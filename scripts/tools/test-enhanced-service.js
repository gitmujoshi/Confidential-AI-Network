try { 
  const service = require('./backend/services/enhancedPlatformEncryptionService'); 
  console.log('Service loaded:', !!service); 
} catch(e) { 
  console.log('Error:', e.message); 
}
