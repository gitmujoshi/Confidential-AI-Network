const service = require('./backend/services/enhancedPlatformEncryptionService');
console.log('Service loaded:', !!service);
console.log('Service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(service)));
