// Centralized test environment setup
const { setTestEnv } = require('./test-env');
setTestEnv(process.env.TEST_MODE || 'mock'); 