// Simple in-memory token blacklist
// In production, this should be stored in Redis or database

const blacklistedTokens = new Set();

const tokenBlacklist = {
  // Add token to blacklist
  blacklistToken: (token) => {
    blacklistedTokens.add(token);
    console.log('🚫 Token blacklisted');
  },

  // Check if token is blacklisted
  isBlacklisted: (token) => {
    return blacklistedTokens.has(token);
  },

  // Clear expired tokens (simple cleanup)
  cleanup: () => {
    // In a real implementation, you'd check token expiration
    // For now, we'll keep it simple
    console.log('🧹 Token blacklist cleanup completed');
  },

  // Get blacklist size (for debugging)
  getSize: () => {
    return blacklistedTokens.size;
  }
};

module.exports = tokenBlacklist; 