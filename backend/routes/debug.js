const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

function defaultMlxPythonPath() {
  return (
    process.env.LOCAL_MLX_PYTHON ||
    path.join(__dirname, '..', 'local-training', '.venv-mlx', 'bin', 'python')
  );
}

function defaultNativePythonPath() {
  return (
    process.env.LOCAL_NATIVE_PYTHON ||
    path.join(__dirname, '..', 'local-training', '.venv-native', 'bin', 'python')
  );
}

router.get('/env', (req, res) => {
  const mlxPython = defaultMlxPythonPath();
  const nativePython = defaultNativePythonPath();
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
    training: {
      canLocalTrainingMode: process.env.CAN_LOCAL_TRAINING_MODE || 'simulate',
      trainingSimulationMode: process.env.TRAINING_SIMULATION_MODE ?? '(unset)',
      trainingExecutionMode: process.env.TRAINING_EXECUTION_MODE ?? '(unset)',
      localTrainingImage:
        process.env.LOCAL_TRAINING_IMAGE || 'contractmanagement/local-trainer:latest',
      mlx: {
        appleSilicon: process.platform === 'darwin' && process.arch === 'arm64',
        pythonPath: mlxPython,
        venvExists: fs.existsSync(mlxPython),
      },
      native: {
        appleSilicon: process.platform === 'darwin' && process.arch === 'arm64',
        pythonPath: nativePython,
        venvExists: fs.existsSync(nativePython),
        trainerDevice: process.env.LOCAL_NATIVE_TRAINER_DEVICE || process.env.TRAINER_DEVICE || 'auto',
      },
    },
    huggingface: {
      integrationEnabled: process.env.HUGGINGFACE_INTEGRATION_ENABLED === 'true',
      tokenConfigured: Boolean(process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN),
      orgNamespace: process.env.HUGGINGFACE_ORG_NAMESPACE || '',
      sovereigntyMode: process.env.HUGGINGFACE_SOVEREIGNTY_MODE || 'dev-catalog-reference',
    },
    nodeEnv: process.env.NODE_ENV,
    workingDir: process.cwd()
  });
});

module.exports = router;
