const router = require('./backend/routes/enhanced-encryption');
console.log('Router loaded:', !!router);
console.log('Router methods:', router.stack ? router.stack.map(r => r.route ? r.route.path : 'middleware') : 'no stack');
