# Service Management Guide

This guide explains how to start, stop, and manage the Contract Management System services.

## Quick Start

### Start All Services
```bash
./start-services.sh
```

### Stop All Services
```bash
./stop-services.sh
```

### Check Service Status
```bash
./status.sh
```

## Service Architecture

The system consists of three main services:

1. **Backend** (Port 5001)
   - Node.js/Express API server
   - PostgreSQL database
   - Keycloak IAM integration
   - DID management

2. **Frontend** (Port 3000)
   - React application
   - Material-UI components
   - MetaMask integration

3. **Blockchain** (Port 8545) - Optional
   - Hardhat local blockchain
   - Smart contract deployment
   - Web3 integration

## Manual Service Management

### Backend Only
```bash
cd backend
npm start
```

### Frontend Only
```bash
cd frontend
npm start
```

### Blockchain Only
```bash
cd blockchain
npx hardhat node
```

## Configuration

### Enable/Disable Blockchain
Edit `backend/config.env`:
```bash
# Enable blockchain
BLOCKCHAIN_ENABLED=true

# Disable blockchain (recommended for development)
BLOCKCHAIN_ENABLED=false
```

### Port Configuration
- Backend: 5001 (configurable in `backend/config.env`)
- Frontend: 3000 (configurable via PORT environment variable)
- Blockchain: 8545 (configurable in `blockchain/hardhat.config.js`)

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :5001
   
   # Kill the process
   pkill -f "node server.js"
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   brew services list | grep ***REMOVED-DB_PASSWORD***ql
   
   # Start PostgreSQL if needed
   brew services start ***REMOVED-DB_PASSWORD***ql
   ```

3. **Node Modules Issues**
   ```bash
   # Reinstall dependencies
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **Blockchain Connection Issues**
   ```bash
   # Check if Hardhat is running
   curl -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     http://127.0.0.1:8545
   ```

### Log Files

The startup script creates log files for debugging:
- `backend.log` - Backend server logs
- `frontend.log` - Frontend build logs
- `blockchain.log` - Hardhat blockchain logs

### Process Management

The scripts create PID files to track running processes:
- `backend.pid` - Backend process ID
- `frontend.pid` - Frontend process ID
- `blockchain.pid` - Blockchain process ID

## Development Workflow

### Recommended Development Setup

1. **Start without blockchain** (faster, more stable):
   ```bash
   # Ensure blockchain is disabled
   echo "BLOCKCHAIN_ENABLED=false" >> backend/config.env
   
   # Start services
   ./start-services.sh
   ```

2. **Start with blockchain** (for contract testing):
   ```bash
   # Enable blockchain
   sed -i '' 's/BLOCKCHAIN_ENABLED=false/BLOCKCHAIN_ENABLED=true/' backend/config.env
   
   # Start services
   ./start-services.sh
   ```

### Hot Reloading

- **Frontend**: Automatically reloads on file changes
- **Backend**: Restart required for changes (use `nodemon` for development)
- **Blockchain**: Restart required for contract changes

### Database Migrations

```bash
cd backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

## Production Deployment

For production deployment, consider:

1. **Process Management**: Use PM2 or similar
2. **Reverse Proxy**: Nginx for frontend/backend routing
3. **Database**: Use managed PostgreSQL service
4. **Blockchain**: Use testnet/mainnet instead of local Hardhat
5. **Environment Variables**: Use proper secrets management

## Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **Database**: Use strong passwords and proper access controls
3. **API Keys**: Rotate regularly and use least privilege
4. **Blockchain**: Use separate wallets for development/production

## Support

If you encounter issues:

1. Check the log files for error messages
2. Verify all dependencies are installed
3. Ensure ports are not in use by other applications
4. Check database connectivity
5. Verify environment configuration

For additional help, refer to the main README.md file. 