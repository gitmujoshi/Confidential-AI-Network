// Clear all browser storage for the application
console.log('🧹 Clearing all browser storage...');

// Clear localStorage
localStorage.clear();
console.log('✅ localStorage cleared');

// Clear sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage cleared');

// Clear any cookies for this domain
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
console.log('✅ cookies cleared');

console.log('🎉 All storage cleared! Please refresh the page and login again.'); 