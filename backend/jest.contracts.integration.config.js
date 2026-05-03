/** Contract / multi-TDP integration suites — requires migrated Postgres with `contracts` table */
const base = require('./jest.integration.config.js');

module.exports = {
  ...base,
  testMatch: [
    '<rootDir>/tests/integration/contract-state-machine.test.js',
    '<rootDir>/tests/integration/multi-tdp-contracts.test.js',
  ],
};
