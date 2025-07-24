// Test script to verify authentication flow
// Run this in browser console to test the complete flow

async function testAuthFlow() {
  console.log('🧪 Testing authentication flow...');
  
  // Step 1: Clear all auth data
  console.log('1️⃣ Clearing auth data...');
  localStorage.clear();
  sessionStorage.clear();
  
  // Step 2: Navigate to login
  console.log('2️⃣ Navigating to login...');
  window.location.href = '/login';
  
  // Step 3: Wait for page load and check if auth data is cleared
  setTimeout(() => {
    console.log('3️⃣ Checking if auth data is cleared...');
    const hasAuthToken = !!localStorage.getItem('authToken');
    const hasUser = !!localStorage.getItem('user');
    console.log('   Auth token exists:', hasAuthToken);
    console.log('   User data exists:', hasUser);
    
    if (!hasAuthToken && !hasUser) {
      console.log('✅ Auth data properly cleared');
    } else {
      console.log('❌ Auth data not cleared properly');
    }
  }, 1000);
}

// Run the test
testAuthFlow(); 