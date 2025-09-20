const service = require('./backend/services/dataEncryptionService');
console.log('Service loaded:', !!service);
try {
  const result = service.encryptData('test data');
  console.log('Encryption result:', result);
} catch (error) {
  console.log('Encryption error:', error.message);
  console.log('Stack:', error.stack);
}
