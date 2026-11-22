# Configuration Management

Edit `config.env` and `secrets.env` at the repository root. Copy them from `config/examples/config.env.example` and `secrets.env.example`.

Every parameter, which values are required, and the extra inputs for each environment are in [the deployment hub](../deployment/README.md).

`./start-system.sh` and `scripts/config-loader.js` read those two files.
