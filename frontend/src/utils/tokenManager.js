// Token management utilities
export const tokenManager = {
  // Clear all authentication-related data
  clearAuthData: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    console.log('🧹 [TokenManager] Cleared all auth data');
  },

  // Get the current auth token
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  // Set the auth token
  setToken: (token) => {
    localStorage.setItem('authToken', token);
    console.log('🔐 [TokenManager] Token set');
  },

  // Check if token exists
  hasToken: () => {
    return !!localStorage.getItem('authToken');
  },

  // Validate token format (basic check)
  isValidTokenFormat: (token) => {
    if (!token) return false;
    
    // Basic JWT format check (3 parts separated by dots)
    const parts = token.split('.');
    return parts.length === 3;
  },

  // Auto-clean invalid tokens on app startup
  autoCleanInvalidTokens: () => {
    const token = localStorage.getItem('authToken');
    
    if (token && !tokenManager.isValidTokenFormat(token)) {
      console.log('🧹 [TokenManager] Auto-cleaning invalid token format');
      tokenManager.clearAuthData();
      return true; // Indicates that cleaning was performed
    }
    
    return false; // No cleaning needed
  }
};

// Auto-clean on module load
if (typeof window !== 'undefined') {
  tokenManager.autoCleanInvalidTokens();
} 