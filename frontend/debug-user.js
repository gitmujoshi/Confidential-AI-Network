// Debug script to check current user
// Run this in browser console

console.log('🔍 Debugging current user...');

// Check localStorage
const authToken = localStorage.getItem('authToken');
const user = localStorage.getItem('user');
const currentUser = localStorage.getItem('currentUser');

console.log('📋 localStorage:');
console.log('  authToken:', authToken ? 'Present' : 'Missing');
console.log('  user:', user);
console.log('  currentUser:', currentUser);

// Check if we can decode the token
if (authToken) {
  try {
    const payload = JSON.parse(atob(authToken.split('.')[1]));
    console.log('🔐 Token payload:', payload);
    console.log('  partyType:', payload.partyType);
    console.log('  dbUserId:', payload.dbUserId);
    console.log('  email:', payload.email);
  } catch (error) {
    console.log('❌ Could not decode token:', error.message);
  }
}

// Check React context if available
if (window.React && window.React.useContext) {
  console.log('🔄 React context available');
} else {
  console.log('⚠️ React context not available in console');
} 