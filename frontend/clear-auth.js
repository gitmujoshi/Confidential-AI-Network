// Clear authentication data script
// Run this in the browser console to clear all auth data

console.log('🧹 Clearing authentication data...');

// Clear all localStorage items
localStorage.removeItem('authToken');
localStorage.removeItem('refreshToken');
localStorage.removeItem('user');
localStorage.removeItem('currentUser');

// Clear sessionStorage
sessionStorage.clear();

console.log('✅ Authentication data cleared');
console.log('🔄 Please refresh the page and login again');

// Optional: Redirect to login page
if (window.location.pathname !== '/login') {
  window.location.href = '/login';
} 