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

  // Function to get current MetaMask account
  const getCurrentMetaMaskAccount = async () => {
    console.log('🔍 [UserContext] getCurrentMetaMaskAccount called');
    
    if (!window.ethereum) {
      console.log('❌ [UserContext] window.ethereum not available');
      return null;
    }
    
    try {
      // First check if MetaMask is connected to the current site
      const isConnected = await window.ethereum.isConnected();
      console.log('🔍 [UserContext] MetaMask connection status:', isConnected);
      
      if (!isConnected) {
        console.log('❌ [UserContext] MetaMask not connected to this site');
        return null;
      }
      
      console.log('🔍 [UserContext] Requesting eth_accounts from MetaMask...');
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' // Use eth_accounts instead of eth_requestAccounts to avoid popup
      });
      
      console.log('🔍 [UserContext] MetaMask accounts received:', accounts);
      
      if (accounts && accounts.length > 0) {
        const currentAccount = accounts[0];
        console.log('✅ [UserContext] Current MetaMask account detected:', currentAccount);
        return currentAccount;
      } else {
        console.log('❌ [UserContext] No accounts found in MetaMask (likely locked)');
        return null;
      }
    } catch (error) {
      console.error('❌ [UserContext] Error getting current MetaMask account:', error);
      // If we get an error, it might mean MetaMask is locked or disconnected
      return null;
    }
  };

  // Function to detect and set current account
  const detectAndSetCurrentAccount = async () => {
    console.log('🔍 [UserContext] Detecting current MetaMask account...');
    const currentAccount = await getCurrentMetaMaskAccount();
    
    if (currentAccount) {
      console.log('✅ [UserContext] Current MetaMask account detected:', currentAccount);
      // Always update when we detect an account, regardless of current state
      if (currentAccount !== walletAddress) {
        console.log('🔄 [UserContext] Account changed from', walletAddress, 'to', currentAccount);
        setWalletAddress(currentAccount);
        setAccountChangeTimestamp(Date.now());
        // Clear the query cache to force a fresh fetch
        queryClient.removeQueries(['user']);
      } else {
        console.log('✅ [UserContext] Account unchanged:', currentAccount);
        // Even if account is the same, clear cache to ensure fresh data
        queryClient.removeQueries(['user']);
      }
    } else {
      console.log('❌ [UserContext] No MetaMask account detected');
      if (walletAddress) {
        console.log('🔄 [UserContext] Clearing wallet address');
        setWalletAddress('');
        setCurrentUser(null);
        queryClient.removeQueries(['user']);
      }
    }
  };

  // Initialize account detection on mount
  useEffect(() => {
    const initializeAccount = async () => {
      setIsInitializing(true);
      await detectAndSetCurrentAccount();
      setIsInitializing(false);
    };

    initializeAccount();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for account changes (since MetaMask doesn't always fire events)
  useEffect(() => {
    if (!window.ethereum) return;

    // Use shorter interval when wallet is connected for faster detection
    const interval = walletAddress ? 500 : 1000;
    
    const pollInterval = setInterval(async () => {
      const currentAccount = await getCurrentMetaMaskAccount();
      
      if (currentAccount && currentAccount !== walletAddress) {
        console.log('🔄 [UserContext] Polling detected account change from', walletAddress, 'to', currentAccount);
        setWalletAddress(currentAccount);
        setAccountChangeTimestamp(Date.now());
        queryClient.removeQueries(['user']);
      } else if (!currentAccount && walletAddress) {
        // No account found but we have a wallet address - wallet was disconnected
        console.log('🔌 [UserContext] Polling detected wallet disconnection');
        setWalletAddress('');
        setCurrentUser(null);
        queryClient.removeQueries(['user']);
      } else if (currentAccount && currentAccount === walletAddress) {
        // Account is the same, but let's verify the user data is still valid
        console.log('✅ [UserContext] Polling confirmed same account:', currentAccount);
      }
    }, interval);

    return () => clearInterval(pollInterval);
  }, [walletAddress, queryClient]);

  // Listen for MetaMask account changes
  useEffect(() => {
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
  }, [queryClient, walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch user data when wallet address changes
  const { isLoading, error, refetch } = useQuery(
    ['user', walletAddress, accountChangeTimestamp],
    () => {
      console.log('🔍 [UserContext] Fetching user data for wallet:', walletAddress);
      return apiService.getUserByWallet(walletAddress);
    },
    {
      enabled: !!walletAddress,
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
        setCurrentUser(null);
      }
    }
  );

  const connectWallet = async () => {
    console.log('🔗 [UserContext] Starting wallet connection...');
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

  // Log state changes
  console.log('🔄 [UserContext] State update:', {
    walletAddress,
    accountChangeTimestamp,
    currentUser: currentUser ? {
      id: currentUser.id,
      name: currentUser.name,
      partyType: currentUser.partyType,
      isRegistered: currentUser.isRegistered
    } : null,
    isConnecting,
    isLoading,
    isInitializing,
    error: error ? {
      message: error.message,
      status: error.response?.status
    } : null,
    isAuthenticated: !!currentUser,
    isTDC,
    isTDP,
    isCCRP
  });

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
    isTDC,
    isTDP,
    isCCRP,
    isAuthenticated: !!currentUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 