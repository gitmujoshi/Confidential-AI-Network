# Test Wallets
## Development and Testing Accounts

Complete guide to test wallets for the Contract Management System development and testing.

## ⚠️ IMPORTANT SECURITY WARNING

- **These are TEST wallets only - DO NOT use on mainnet!**
- **All wallets have 10,000 ETH on the local Hardhat network**
- **Use these for development, testing, and demonstration purposes only**
- **The private keys are publicly known and should NEVER be used on mainnet networks**
- **These accounts are pre-configured in Keycloak IAM for testing**

## 🔐 IAM Integration

All test wallets are pre-configured in the Keycloak IAM system with:
- **Pre-created user accounts** with email verification completed
- **Role assignments** (TDP, TDC, CCRP) based on wallet addresses
- **Onboarding status** set to COMPLETED
- **Profile information** including organization details

### IAM Test Credentials
- **Keycloak Admin**: admin/***REMOVED-KEYCLOAK_ADMIN_PASSWORD***
- **Realm**: contract-management
- **Client**: contract-management-client
- **All test users**: Password is same as email (e.g., hardhat.tdp1@test.com)

## 🏭 Training Data Providers (TDP)

### Primary TDP Accounts (Hardhat Default)

**TDP Account 1 (Hardhat Account #0):**
- **Name**: Hardhat TDP Provider 1
- **Email**: hardhat.tdp1@test.com
- **Wallet Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **User ID**: 26
- **Hardhat Account**: #0

**TDP Account 2 (Hardhat Account #3):**
- **Name**: Hardhat TDP Provider 2
- **Email**: hardhat.tdp2@test.com
- **Wallet Address**: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- **Private Key**: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`
- **User ID**: 29
- **Hardhat Account**: #3

**TDP Account 3 (Hardhat Account #6):**
- **Name**: Hardhat TDP Provider 3
- **Email**: hardhat.tdp3@test.com
- **Wallet Address**: `0x976EA74026E726554dB657fA54763abd0C3a0aa9`
- **Private Key**: `0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e`
- **User ID**: 32
- **Hardhat Account**: #6

**TDP Account 4 (Hardhat Account #9):**
- **Name**: Hardhat TDP Provider 4
- **Email**: hardhat.tdp4@test.com
- **Wallet Address**: `0xa0Ee7A142d267C1f36714E4a8F75612F20a79720`
- **Private Key**: `0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6`
- **User ID**: 35
- **Hardhat Account**: #9

### Additional TDP Accounts

**Test TDP Provider 1:**
- **Name**: Test TDP Provider 1
- **Email**: tdp1@test.com
- **Wallet Address**: `0x7E38648d17BA3bfbA5e5f7d34BF300F578B068A8`
- **Private Key**: `0x24f41817e61953a433c88f04b2800655faf221d6689e703d2b60d2c1c5f2cc56`
- **User ID**: 17

**Test TDP Provider 2:**
- **Name**: Test TDP Provider 2
- **Email**: tdp2@test.com
- **Wallet Address**: `0xE29B14eDEe66528a4baa3b55D2505E95c5bdFA86`
- **Private Key**: `0xbf655fb9da33b4ff7269c35336b1e557940817f53fa63ae267d1aaa99973122b`
- **User ID**: 18

**Test TDP Provider 3:**
- **Name**: Test TDP Provider 3
- **Email**: tdp3@test.com
- **Wallet Address**: `0xc4b8B159D51C37b3592D59ccb86A4b466ec6dc54`
- **Private Key**: `0x3f6fec1b65625715d2c17c29260508b447f388888d3688f8dfc16ccdb3eeb389`
- **User ID**: 19

## 🛒 Training Data Consumers (TDC)

### Primary TDC Accounts (Hardhat Default)

**TDC Account 1 (Hardhat Account #1):**
- **Name**: Hardhat TDC Consumer 1
- **Email**: hardhat.tdc1@test.com
- **Wallet Address**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Private Key**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **User ID**: 27
- **Hardhat Account**: #1

**TDC Account 2 (Hardhat Account #4):**
- **Name**: Hardhat TDC Consumer 2
- **Email**: hardhat.tdc2@test.com
- **Wallet Address**: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`
- **Private Key**: `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a`
- **User ID**: 30
- **Hardhat Account**: #4

**TDC Account 3 (Hardhat Account #7):**
- **Name**: Hardhat TDC Consumer 3
- **Email**: hardhat.tdc3@test.com
- **Wallet Address**: `0x14dC79964da2C08b23698B3D3cc7Ca32193d9955`
- **Private Key**: `0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356`
- **User ID**: 33
- **Hardhat Account**: #7

### Additional TDC Accounts

**Test TDC Consumer 1:**
- **Name**: Test TDC Consumer 1
- **Email**: tdc1@test.com
- **Wallet Address**: `0xe92Bb7496c4aAf1F52168Bf023e33849EAEAF4A6`
- **Private Key**: `0x33588a7a92b4eecaf71ef356bea4962989563afff003e11649b2ec7159b48883`
- **User ID**: 20

**Test TDC Consumer 2:**
- **Name**: Test TDC Consumer 2
- **Email**: tdc2@test.com
- **Wallet Address**: `0xa5FAD6ecf895eF04ed2F65A56F3c64b03f736286`
- **Private Key**: `0x600ac394b978969d9626d45580752f831340c0a8690f9afd5c57073759312ce0`
- **User ID**: 21

**Test TDC Consumer 3:**
- **Name**: Test TDC Consumer 3
- **Email**: tdc3@test.com
- **Wallet Address**: `0x77B54c4F9ff7164888261122C07f61c83fE68B22`
- **Private Key**: `0x2f7a5c8535adb52a53922bdc66a5c803372916b26d2a76740410495c410cf076`
- **User ID**: 22

## 🔐 CCRP Providers (Confidential Clean Room Provider)

### Primary CCRP Accounts (Hardhat Default)

**CCRP Account 1 (Hardhat Account #2):**
- **Name**: Hardhat CCRP Provider 1
- **Email**: hardhat.ccrp1@test.com
- **Wallet Address**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Private Key**: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- **User ID**: 28
- **Hardhat Account**: #2

**CCRP Account 2 (Hardhat Account #5):**
- **Name**: Hardhat CCRP Provider 2
- **Email**: hardhat.ccrp2@test.com
- **Wallet Address**: `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc`
- **Private Key**: `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba`
- **User ID**: 31
- **Hardhat Account**: #5

**CCRP Account 3 (Hardhat Account #8):**
- **Name**: Hardhat CCRP Provider 3
- **Email**: hardhat.ccrp3@test.com
- **Wallet Address**: `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f`
- **Private Key**: `0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97`
- **User ID**: 34
- **Hardhat Account**: #8

### Additional CCRP Accounts

**Test CCRP Provider 1:**
- **Name**: Test CCRP Provider 1
- **Email**: ccrp1@test.com
- **Wallet Address**: `0xF49Bb88F7CADf858d2881934ee0CC5181f48f632`
- **Private Key**: `0xd52b1445a9463af41d73e3bf817ded125f230ee3489dc784e4e31dd02c89a9c6`
- **User ID**: 23

**Test CCRP Provider 2:**
- **Name**: Test CCRP Provider 2
- **Email**: ccrp2@test.com
- **Wallet Address**: `0x1Ef5601fF54ba5d4A1e8aE65272bE3982176FD39`
- **Private Key**: `0xb2500a2231abd3b8542a1ffda554bd1d39ca05b7c2eb5206577c9158fe735d02`
- **User ID**: 24

**Test CCRP Provider 3:**
- **Name**: Test CCRP Provider 3
- **Email**: ccrp3@test.com
- **Wallet Address**: `0x59ed6c7081638d742323eAe9514E89cBF08784D5`
- **Private Key**: `0x09e5bdd0e8dccfac53bf9868519335f850942f3758dc6aa69ae9e75d7b8f9944`
- **User ID**: 25

## 📊 Summary

### Account Statistics
- **Total Registered**: 19 users
- **TDP Providers**: 7 users (4 Hardhat + 3 Additional)
- **TDC Consumers**: 6 users (3 Hardhat + 3 Additional)
- **CCRP Providers**: 6 users (3 Hardhat + 3 Additional)

### Quick Reference by Party Type

#### TDP Wallets (Data Providers)
- `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` - hardhat.tdp1@test.com (Primary)
- `0x90F79bf6EB2c4f870365E785982E1f101E93b906` - hardhat.tdp2@test.com
- `0x976EA74026E726554dB657fA54763abd0C3a0aa9` - hardhat.tdp3@test.com
- `0xa0Ee7A142d267C1f36714E4a8F75612F20a79720` - hardhat.tdp4@test.com
- `0x7E38648d17BA3bfbA5e5f7d34BF300F578B068A8` - tdp1@test.com
- `0xE29B14eDEe66528a4baa3b55D2505E95c5bdFA86` - tdp2@test.com
- `0xc4b8B159D51C37b3592D59ccb86A4b466ec6dc54` - tdp3@test.com

#### TDC Wallets (Data Consumers)
- `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` - hardhat.tdc1@test.com (Primary)
- `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` - hardhat.tdc2@test.com
- `0x14dC79964da2C08b23698B3D3cc7Ca32193d9955` - hardhat.tdc3@test.com
- `0xe92Bb7496c4aAf1F52168Bf023e33849EAEAF4A6` - tdc1@test.com
- `0xa5FAD6ecf895eF04ed2F65A56F3c64b03f736286` - tdc2@test.com
- `0x77B54c4F9ff7164888261122C07f61c83fE68B22` - tdc3@test.com

#### CCRP Wallets (Clean Room Providers)
- `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` - hardhat.ccrp1@test.com (Primary)
- `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` - hardhat.ccrp2@test.com
- `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f` - hardhat.ccrp3@test.com
- `0xF49Bb88F7CADf858d2881934ee0CC5181f48f632` - ccrp1@test.com
- `0x1Ef5601fF54ba5d4A1e8aE65272bE3982176FD39` - ccrp2@test.com
- `0x59ed6c7081638d742323eAe9514E89cBF08784D5` - ccrp3@test.com

## 🚀 Usage Instructions

### 1. User Registration
- Use the wallet addresses for user registration in the frontend
- Each wallet is already registered in the database with the corresponding party type
- Primary accounts (Hardhat defaults) are recommended for initial testing

### 2. Contract Signing
- Use the private keys for contract signing operations
- These private keys work with the local Hardhat network
- All accounts have sufficient ETH for gas fees

### 3. Testing Scenarios
- **TDP**: Can create datasets and sign contracts as data providers
- **TDC**: Can browse datasets and sign contracts as data consumers
- **CCRP**: Can be selected as clean room providers in contracts

### 4. Network Configuration
- **Network**: Local Hardhat Network
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: 31337
- **Currency**: ETH

### 5. Importing to MetaMask
1. Open MetaMask extension
2. Click the account icon
3. Click "Import account"
4. Paste the private key
5. Click "Import"

## 🔄 Available Commands

```bash
# Register all Hardhat users
npm run register-hardhat

# Start blockchain node
npm run blockchain

# Start backend server
npm run server

# Start frontend
npm run client

# Create new test wallets
npm run create-wallets
```

## 📝 Notes

- All wallets are pre-funded with 10,000 ETH on the Hardhat network
- Hardhat default accounts are deterministic and always available when running `hardhat node`
- The private keys are publicly known and should NEVER be used on mainnet
- Each user has been registered with welcome notifications
- Primary accounts (marked with "Primary") are recommended for initial testing

## 🔍 Troubleshooting

### Issue: "Duplicate Account" Error in MetaMask
**Solution**: This is normal! The account is already imported. Just click on it in MetaMask to make it active.

### Issue: No Accounts Found
**Solutions**:
1. **Unlock MetaMask** - Make sure MetaMask is unlocked
2. **Check network** - Ensure MetaMask is connected to the correct network (localhost:8545)
3. **Import accounts** - If no test accounts are imported, import them using the private keys

### Issue: Insufficient Funds
**Solution**: All test accounts have 10,000 ETH. If you see insufficient funds, ensure you're connected to the local Hardhat network (Chain ID: 31337).

## 📚 Related Documentation

- **Setup Guide**: See [Setup Guide](./SETUP_GUIDE.md) for installation
- **Wallet Guide**: See [Wallet Guide](./WALLET_GUIDE.md) for MetaMask setup
- **User Guide**: See [User Guide](./USER_GUIDE.md) for application usage
- **Architecture Guide**: See [Architecture Guide](./ARCHITECTURE_GUIDE.md) for technical details 