import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { apiService } from '../services/api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [accountChangeTimestamp, setAccountChangeTimestamp] = useState(Date.now());
  const queryClient = useQueryClient();

  // Multi-deployment support
  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [globalDEPAIdValidation, setGlobalDEPAIdValidation] = useState(null);

  // Load deployment status on mount
  useEffect(() => {
    const loadDeploymentStatus = async () => {
      try {
        const response = await apiService.get('/api/global-deployment/status');
        if (response.data.success) {
          setDeploymentStatus(response.data.data);
        }
      } catch (error) {
        console.warn('Failed to load deployment status:', error);
        // Continue without deployment features
      }
    };

    loadDeploymentStatus();
  }, []);

  // Validate global DEPA ID when user changes
  useEffect(() => {
    const validateGlobalDEPAId = async () => {
      if (!currentUser?.depaId) return;

      try {
        const response = await apiService.post('/api/global-deployment/verify', {
          globalDEPAId: currentUser.depaId
        });
        
        if (response.data.success) {
          setGlobalDEPAIdValidation(response.data.data);
        }
      } catch (error) {
        console.warn('Failed to validate global DEPA ID:', error);
        // Continue without validation
      }
    };

    validateGlobalDEPAId();
  }, [currentUser?.depaId]);

  // Function to get current MetaMask account
  const getCurrentMetaMaskAccount = async () => {
    // Skip wallet check if user is authenticated via token
    if (hasValidToken()) {
      return null;
    }
    
    if (!window.ethereum) {
      return null;
    }
    
    try {
      // First check if MetaMask is connected to the current site
      const isConnected = await window.ethereum.isConnected();
      
      if (!isConnected) {
        return null;
      }
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' // Use eth_accounts instead of eth_requestAccounts to avoid popup
      });
      
      if (accounts && accounts.length > 0) {
        const currentAccount = accounts[0];
        return currentAccount;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ [UserContext] Error getting current MetaMask account:', error);
      return null;
    }
  };

  // Function to detect and set current account
  const detectAndSetCurrentAccount = async () => {
    // Skip wallet detection if user is authenticated via token
    if (hasValidToken()) {
      console.log('🔍 [UserContext] User authenticated via token, skipping wallet detection');
      return;
    }
    
    // console.log('🔍 [UserContext] Detecting current MetaMask account...');
    const currentAccount = await getCurrentMetaMaskAccount();
    
    if (currentAccount) {
      // console.log('✅ [UserContext] Current MetaMask account detected:', currentAccount);
      // Always update when we detect an account, regardless of current state
      if (currentAccount !== walletAddress) {
        console.log('🔄 [UserContext] Account changed from', walletAddress, 'to', currentAccount);
        setWalletAddress(currentAccount);
        setAccountChangeTimestamp(Date.now());
        // Clear the query cache to force a fresh fetch
        queryClient.removeQueries(['user']);
      } else {
        // console.log('✅ [UserContext] Account unchanged:', currentAccount);
        // Even if account is the same, clear cache to ensure fresh data
        queryClient.removeQueries(['user']);
      }
    } else {
      // console.log('❌ [UserContext] No MetaMask account detected');
      if (walletAddress) {
        console.log('🔄 [UserContext] Clearing wallet address');
        setWalletAddress('');
        setCurrentUser(null);
        queryClient.removeQueries(['user']);
      }
    }
  };

  // Check if user is logged in via token (for email/password auth)
  const checkTokenAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (token && !currentUser) {
      try {
        console.log('🔍 [UserContext] Checking token authentication...');
        // Add cache-busting parameter to ensure fresh data
        const response = await apiService.get('/api/auth/profile?_t=' + Date.now());
        if (response.data.user) {
          console.log('✅ [UserContext] Token authentication successful:', response.data.user);
          setCurrentUser(response.data.user);
          // Clear wallet address when token auth is successful
          setWalletAddress('');
        }
      } catch (error) {
        console.log('❌ [UserContext] Token authentication failed:', error.response?.status, error.message);
        // If token is invalid (401, 403, or 404), clear it
        if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
        // Don't set any error state here to prevent brief error display
      }
    }
  };

  // Check if user has valid token authentication
  const hasValidToken = () => {
    const token = localStorage.getItem('authToken');
    return !!token && !!currentUser;
  };

  // Initialize account detection on mount
  useEffect(() => {
    const initializeAccount = async () => {
      setIsInitializing(true);
      
      // First check for token authentication
      await checkTokenAuth();
      
      // Only check wallet if no token authentication
      if (!hasValidToken()) {
        await detectAndSetCurrentAccount();
      }
      
      setIsInitializing(false);
    };

    initializeAccount();
  }, []);



  // Listen for MetaMask account changes (only when not using token auth)
  useEffect(() => {
    // Skip wallet listeners if user is authenticated via token
    if (hasValidToken()) {
      return;
    }

    const handleAccountsChanged = (accounts) => {
      console.log('🔄 [UserContext] MetaMask accounts changed event fired:', accounts);
      
      // Handle both disconnection and account switching
      if (!accounts || accounts.length === 0) {
        // User disconnected MetaMask or locked it
        console.log('🔌 [UserContext] MetaMask disconnected or locked');
        setWalletAddress('');
        setCurrentUser(null);
        queryClient.removeQueries(['user']);
      } else {
        // User switched accounts or connected
        const newAccount = accounts[0];
        console.log('🔄 [UserContext] Switching to account:', newAccount);
        
        // Always update when accounts change, regardless of current state
        console.log('🔄 [UserContext] Updating wallet address from', walletAddress, 'to', newAccount);
        setWalletAddress(newAccount);
        setAccountChangeTimestamp(Date.now());
        queryClient.removeQueries(['user']);
      }
    };

    const handleChainChanged = (chainId) => {
      console.log('🔄 [UserContext] MetaMask chain changed:', chainId);
      window.location.reload();
    };

    const handleConnect = (connectInfo) => {
      console.log('🔗 [UserContext] MetaMask connected to site:', connectInfo);
      // When MetaMask connects, check for current account
      setTimeout(() => detectAndSetCurrentAccount(), 100);
    };

    const handleDisconnect = (error) => {
      console.log('🔌 [UserContext] MetaMask disconnected from site:', error);
      // When MetaMask disconnects, clear the wallet state
      setWalletAddress('');
      setCurrentUser(null);
      queryClient.removeQueries(['user']);
    };

    if (window.ethereum) {
      console.log('👂 [UserContext] Setting up MetaMask listeners...');
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('connect', handleConnect);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        console.log('🧹 [UserContext] Cleaning up MetaMask listeners...');
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('connect', handleConnect);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [queryClient, walletAddress, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch user data when wallet address changes (only if wallet is connected and no token auth)
  const { isLoading, error, refetch } = useQuery(
    ['user', walletAddress, accountChangeTimestamp],
    () => {
      console.log('🔍 [UserContext] Fetching user data for wallet:', walletAddress);
      return apiService.getUserByWallet(walletAddress);
    },
    {
      enabled: !!walletAddress && !hasValidToken(), // Only fetch if wallet is connected AND no token auth
      retry: false,
      staleTime: 0, // Always consider data stale
      cacheTime: 0, // Don't cache at all
      onSuccess: (data) => {
        console.log('✅ [UserContext] User data fetched successfully:', data);
        setCurrentUser(data);
      },
      onError: (error) => {
        console.error('❌ [UserContext] Failed to fetch user data:', error);
        console.error('❌ [UserContext] Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: error.config
        });
        // Don't clear currentUser on wallet lookup error - user might be logged in via email/password
        if (walletAddress) {
          setCurrentUser(null);
        }
      }
    }
  );

  const connectWallet = async () => {
    console.log('🔗 [UserContext] Starting wallet connection...');
    
    // If user is authenticated via token, don't allow wallet connection
    if (hasValidToken()) {
      console.log('🔗 [UserContext] User authenticated via token, wallet connection not allowed');
      throw new Error('Cannot connect wallet while logged in via email/password. Please logout first.');
    }
    
    setIsConnecting(true);
    try {
      if (!window.ethereum) {
        console.error('❌ [UserContext] MetaMask is not installed');
        const error = new Error('MetaMask is not installed');
        error.code = 'METAMASK_NOT_INSTALLED';
        error.helpUrl = 'https://metamask.io/download/';
        throw error;
      }
      
      console.log('🔗 [UserContext] Requesting accounts from MetaMask...');
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      console.log('🔗 [UserContext] MetaMask accounts received:', accounts);
      
      if (!accounts || accounts.length === 0) {
        console.error('❌ [UserContext] No accounts found');
        throw new Error('No accounts found. Please unlock MetaMask and try again.');
      }
      
      const selectedAccount = accounts[0];
      console.log('✅ [UserContext] Wallet connected successfully:', selectedAccount);
      setWalletAddress(selectedAccount);
      setAccountChangeTimestamp(Date.now());
      return selectedAccount;
    } catch (error) {
      console.error('❌ [UserContext] Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
      console.log('🔗 [UserContext] Wallet connection process completed');
    }
  };

  const disconnectWallet = () => {
    console.log('🔌 [UserContext] Disconnecting wallet...');
    
    // If user is authenticated via token, this is a no-op
    if (hasValidToken()) {
      console.log('🔌 [UserContext] User authenticated via token, wallet disconnect not needed');
      return;
    }
    
    // Clear local state
    setWalletAddress('');
    setCurrentUser(null);
    queryClient.removeQueries(['user']);
    
    // Try to disconnect from MetaMask if available
    if (window.ethereum) {
      try {
        // Note: MetaMask doesn't have a direct disconnect method for the site
        // The user needs to manually disconnect in MetaMask
        console.log('🔌 [UserContext] MetaMask disconnect not supported - user must disconnect manually');
      } catch (error) {
        console.error('❌ [UserContext] Error during MetaMask disconnect:', error);
      }
    }
    
    console.log('✅ [UserContext] Wallet disconnected from app');
  };

  // Manual refresh function for wallet switching
  const refreshUserData = async () => {
    console.log('🔄 [UserContext] Manual refresh requested');
    setIsConnecting(true);
    
    try {
      // If user is authenticated via token, don't refresh wallet
      if (hasValidToken()) {
        console.log('🔄 [UserContext] User authenticated via token, skipping wallet refresh');
        return;
      }
      
      // Force a complete account detection
      console.log('🔄 [UserContext] Forcing account detection...');
      await detectAndSetCurrentAccount();
      
      // Get current MetaMask account
      console.log('🔄 [UserContext] Getting current MetaMask account...');
      const currentAccount = await getCurrentMetaMaskAccount();
      console.log('🔄 [UserContext] Current MetaMask account:', currentAccount);
      
      if (currentAccount) {
        console.log('🔄 [UserContext] Updating wallet address to:', currentAccount);
        // Update wallet address to trigger user data fetch
        setWalletAddress(currentAccount);
        setAccountChangeTimestamp(Date.now());
        // Clear cache and refetch
        console.log('🔄 [UserContext] Clearing query cache for account:', currentAccount);
        queryClient.removeQueries(['user']);
        console.log('🔄 [UserContext] Triggering refetch...');
        await refetch();
        console.log('✅ [UserContext] Refresh completed successfully');
      } else {
        console.log('❌ [UserContext] No MetaMask account found during refresh');
        setWalletAddress('');
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('❌ [UserContext] Error during manual refresh:', error);
      // If there's an error, assume wallet is disconnected
      setWalletAddress('');
      setCurrentUser(null);
    } finally {
      setIsConnecting(false);
      console.log('🔄 [UserContext] Manual refresh process completed');
    }
  };

  // Force check wallet connection status
  const checkWalletConnection = async () => {
    console.log('🔍 [UserContext] Force checking wallet connection...');
    
    // If user is authenticated via token, don't check wallet
    if (hasValidToken()) {
      console.log('🔍 [UserContext] User authenticated via token, skipping wallet check');
      return;
    }
    
    const currentAccount = await getCurrentMetaMaskAccount();
    
    if (!currentAccount && walletAddress) {
      console.log('🔌 [UserContext] Force check detected wallet disconnection');
      setWalletAddress('');
      setCurrentUser(null);
      queryClient.removeQueries(['user']);
    } else if (currentAccount && currentAccount !== walletAddress) {
      console.log('🔄 [UserContext] Force check detected account change:', currentAccount);
      setWalletAddress(currentAccount);
      setAccountChangeTimestamp(Date.now());
      queryClient.removeQueries(['user']);
    }
  };

  const isTDC = currentUser?.partyType === 'TDC';
  const isTDP = currentUser?.partyType === 'TDP';
  const isCCRP = currentUser?.partyType === 'CCRP';



  // Log state changes (disabled to reduce console spam)
  // console.log('🔄 [UserContext] State update:', {
  //   walletAddress,
  //   accountChangeTimestamp,
  //   currentUser: currentUser ? {
  //     id: currentUser.id,
  //     name: currentUser.name,
  //     partyType: currentUser.partyType,
  //     isRegistered: currentUser.isRegistered
  //   } : null,
  //   isConnecting,
  //   isLoading,
  //   isInitializing,
  //   error: error ? {
  //     message: error.message,
  //     status: error.response?.status
  //   } : null,
  //   isAuthenticated: !!currentUser,
  //   isTDC,
  //   isTDP,
  //   isCCRP
  // });

  // Function to set user manually (for email/password login)
  const setUser = (user) => {
    // Clear any cached data when setting a new user
    console.log('🧹 [UserContext] Clearing cached data for new user login...');
    
    // Clear all cached data
    queryClient.removeQueries(['user']);
    queryClient.clear(); // Clear all queries
    
    // Clear wallet-related state
    setWalletAddress('');
    
    // Set the new user and ensure initialization is complete
    setCurrentUser(user);
    setIsInitializing(false); // Ensure initialization is marked as complete
    
    // Force re-fetch of dashboard data by invalidating specific queries
    if (user) {
      console.log('🔄 [UserContext] Invalidating dashboard queries for user:', user.id);
      // Use setTimeout to ensure user state is fully set before invalidating
      setTimeout(() => {
        queryClient.invalidateQueries(['tdpDashboard']);
        queryClient.invalidateQueries(['tdcDashboard']);
        queryClient.invalidateQueries(['ccrpDashboard']);
        queryClient.invalidateQueries(['adminDashboard']);
        queryClient.invalidateQueries(['contracts']); // Also invalidate contracts
        queryClient.invalidateQueries(['notifications']); // Invalidate notifications
        queryClient.invalidateQueries(['users']); // Invalidate users list
        queryClient.invalidateQueries(['datasets']); // Invalidate datasets
        queryClient.invalidateQueries(['ai-models']); // Invalidate AI models
        queryClient.invalidateQueries(['contract-types']); // Invalidate contract types
      }, 100);
    }
    
    console.log('✅ [UserContext] New user set:', user);
  };

  // Function to refresh authentication (clear invalid tokens and re-check)
  const refreshAuth = async () => {
    console.log('🔄 [UserContext] Refreshing authentication...');
    
    // Clear any existing invalid token
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    
    // Re-check token authentication
    await checkTokenAuth();
  };

  // Function to clear all authentication data
  const clearAuthData = async () => {
    console.log('🧹 [UserContext] Clearing all authentication data...');
    
    // Call logout endpoint to blacklist current token
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        await apiService.post('/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('🚫 Token blacklisted via logout endpoint');
      } catch (error) {
        console.warn('⚠️ Failed to blacklist token:', error.message);
      }
    }
    
    // Clear all storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    sessionStorage.clear();
    
    // Clear all state
    setCurrentUser(null);
    setWalletAddress('');
    queryClient.removeQueries(['user']);
    queryClient.clear(); // Clear all queries
    
    console.log('✅ [UserContext] All authentication data cleared');
    
    // After clearing token auth, re-enable wallet detection
    setTimeout(() => {
      detectAndSetCurrentAccount();
    }, 100);
  };

  // Function to force a complete auth reset (for debugging)
  const forceAuthReset = () => {
    console.log('🔄 [UserContext] Force auth reset...');
    clearAuthData();
  };

  const value = {
    currentUser,
    walletAddress,
    isConnecting,
    isLoading,
    isInitializing,
    error,
    connectWallet,
    disconnectWallet,
    refreshUserData,
    detectAndSetCurrentAccount,
    checkWalletConnection,
    setUser, // Add setUser function
    checkTokenAuth, // Add token auth check
    isTDC,
    isTDP,
    isCCRP,
    isAuthenticated: !!currentUser,
    refreshAuth, // Add refreshAuth function
    clearAuthData, // Add clearAuthData function
    forceAuthReset, // Add force auth reset function
    // Multi-deployment support
    deploymentStatus,
    globalDEPAIdValidation,
    isGlobalDEPAId: currentUser?.depaId ? 
      (currentUser.depaId.includes('-') && currentUser.depaId.split('-').length >= 4) : false,
    deploymentInfo: globalDEPAIdValidation?.deploymentInfo || null
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 