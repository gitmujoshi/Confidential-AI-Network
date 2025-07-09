/**
 * Development Tools for Contract Management System
 * 
 * USAGE:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire file
 * 3. Press Enter to execute
 * 4. Use the available commands below
 */

console.log('🔧 Loading Contract Management Dev Tools...');

const devTools = {
  // Token Management
  tokens: {
    // Set TDP user token
    setTDP: () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGRwdXNlckBleGFtcGxlLmNvbSIsInBhcnR5VHlwZSI6IlREUCIsIndhbGxldEFkZHJlc3MiOm51bGwsImlhdCI6MTc1MjA1ODU1MSwiZXhwIjoxNzUyMTQ0OTUxfQ.D_aHPz_-GOSWayDit_u8wVY26mTdOUg2Z8kk2VEQ7l8';
      localStorage.setItem('authToken', token);
      console.log('✅ TDP token set successfully');
      console.log('🔄 Please refresh the page');
    },

    // Set TDC user token
    setTDC: () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoidGRjdXNlckBleGFtcGxlLmNvbSIsInBhcnR5VHlwZSI6IlREQyIsIndhbGxldEFkZHJlc3MiOm51bGwsImlhdCI6MTc1MjA1ODU1MSwiZXhwIjoxNzUyMTQ0OTUxfQ.example_signature';
      localStorage.setItem('authToken', token);
      console.log('✅ TDC token set successfully');
      console.log('🔄 Please refresh the page');
    },

    // Clear all tokens
    clear: () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
      console.log('🧹 All tokens cleared');
      console.log('🔄 Please refresh the page');
    },

    // Check current token
    check: () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('🔐 Current token:', token);
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('📋 Token payload:', payload);
          console.log('⏰ Expires:', new Date(payload.exp * 1000));
        } catch (e) {
          console.log('❌ Invalid token format');
        }
      } else {
        console.log('❌ No token found');
      }
    },

    // Auto-fix token issues
    autoFix: () => {
      console.log('🔧 Auto-fixing token issues...');
      const token = localStorage.getItem('authToken');
      if (token && token.split('.').length !== 3) {
        console.log('🧹 Clearing invalid token format');
        localStorage.removeItem('authToken');
      }
      devTools.tokens.setTDP();
    }
  },

  // API Testing
  api: {
    // Test authentication
    testAuth: async () => {
      try {
        const response = await fetch('http://localhost:5001/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        const data = await response.json();
        console.log('🔐 Auth test result:', data);
        return data;
      } catch (error) {
        console.error('❌ Auth test failed:', error);
      }
    },

    // Test contracts endpoint
    testContracts: async () => {
      try {
        const response = await fetch('http://localhost:5001/api/contracts/user/3', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        const data = await response.json();
        console.log('📋 Contracts test result:', data);
        return data;
      } catch (error) {
        console.error('❌ Contracts test failed:', error);
      }
    }
  },

  // System Info
  system: {
    // Show current state
    status: () => {
      console.log('📊 System Status:');
      console.log('- Token:', localStorage.getItem('authToken') ? '✅ Present' : '❌ Missing');
      console.log('- User:', localStorage.getItem('user') ? '✅ Present' : '❌ Missing');
      console.log('- Current User:', localStorage.getItem('currentUser') ? '✅ Present' : '❌ Missing');
      console.log('- Environment:', process.env.NODE_ENV || 'unknown');
    },

    // Clear all data
    reset: () => {
      localStorage.clear();
      console.log('🧹 All localStorage cleared');
      console.log('🔄 Please refresh the page');
    }
  }
};

// Make available globally
window.devTools = devTools;

console.log('✅ Dev tools loaded successfully!');
console.log('');
console.log('📋 Available commands:');
console.log('- devTools.tokens.setTDP()     // Set TDP user token');
console.log('- devTools.tokens.setTDC()     // Set TDC user token');
console.log('- devTools.tokens.clear()      // Clear all tokens');
console.log('- devTools.tokens.check()      // Check current token');
console.log('- devTools.tokens.autoFix()    // Auto-fix token issues');
console.log('- devTools.api.testAuth()      // Test authentication');
console.log('- devTools.api.testContracts() // Test contracts API');
console.log('- devTools.system.status()     // Show system status');
console.log('- devTools.system.reset()      // Reset all data');
console.log('');
console.log('💡 Tip: Use devTools.tokens.autoFix() to quickly fix token issues'); 