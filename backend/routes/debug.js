const express = require('express');
const router = express.Router();

router.get('/env', (req, res) => {
  res.json({
    keycloak: {
      url: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ? 'SET' : 'NOT_SET',
      adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME,
      adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD ? 'SET' : 'NOT_SET',
      enabled: process.env.KEYCLOAK_ENABLED
    },
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      name: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ? 'SET' : 'NOT_SET'
    },
    scitt: {
      enabled: process.env.SCITT_CCF_ENABLED,
      nodeUrl: process.env.CCF_NODE_URL,
      platform: process.env.CCF_PLATFORM
    },
    nodeEnv: process.env.NODE_ENV,
    workingDir: process.cwd()
  });
});

module.exports = router;
