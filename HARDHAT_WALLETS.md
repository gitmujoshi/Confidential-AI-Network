# Hardhat Test Wallets for Contract Management App

This file contains Hardhat test wallet information for development and testing purposes.

## ⚠️ IMPORTANT
- These are TEST wallets only - DO NOT use on mainnet!
- All wallets have 10,000 ETH on the local Hardhat network
- Use these for development, testing, and demonstration purposes only
- These are the default Hardhat accounts that are always available

## 🏭 Training Data Providers (TDP)

### Hardhat TDP Provider 1
- **Name**: Hardhat TDP Provider 1
- **Email**: hardhat.tdp1@test.com
- **Wallet Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **User ID**: 26
- **Hardhat Account**: #0

### Hardhat TDP Provider 2
- **Name**: Hardhat TDP Provider 2
- **Email**: hardhat.tdp2@test.com
- **Wallet Address**: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- **Private Key**: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`
- **User ID**: 29
- **Hardhat Account**: #3

### Hardhat TDP Provider 3
- **Name**: Hardhat TDP Provider 3
- **Email**: hardhat.tdp3@test.com
- **Wallet Address**: `0x976EA74026E726554dB657fA54763abd0C3a0aa9`
- **Private Key**: `0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e`
- **User ID**: 32
- **Hardhat Account**: #6

### Hardhat TDP Provider 4
- **Name**: Hardhat TDP Provider 4
- **Email**: hardhat.tdp4@test.com
- **Wallet Address**: `0xa0Ee7A142d267C1f36714E4a8F75612F20a79720`
- **Private Key**: `0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6`
- **User ID**: 35
- **Hardhat Account**: #9

## 🛒 Training Data Consumers (TDC)

### Hardhat TDC Consumer 1
- **Name**: Hardhat TDC Consumer 1
- **Email**: hardhat.tdc1@test.com
- **Wallet Address**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Private Key**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **User ID**: 27
- **Hardhat Account**: #1

### Hardhat TDC Consumer 2
- **Name**: Hardhat TDC Consumer 2
- **Email**: hardhat.tdc2@test.com
- **Wallet Address**: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`
- **Private Key**: `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a`
- **User ID**: 30
- **Hardhat Account**: #4

### Hardhat TDC Consumer 3
- **Name**: Hardhat TDC Consumer 3
- **Email**: hardhat.tdc3@test.com
- **Wallet Address**: `0x14dC79964da2C08b23698B3D3cc7Ca32193d9955`
- **Private Key**: `0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356`
- **User ID**: 33
- **Hardhat Account**: #7

## 🔐 CCRP Providers

### Hardhat CCRP Provider 1
- **Name**: Hardhat CCRP Provider 1
- **Email**: hardhat.ccrp1@test.com
- **Wallet Address**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Private Key**: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- **User ID**: 28
- **Hardhat Account**: #2

### Hardhat CCRP Provider 2
- **Name**: Hardhat CCRP Provider 2
- **Email**: hardhat.ccrp2@test.com
- **Wallet Address**: `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc`
- **Private Key**: `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba`
- **User ID**: 31
- **Hardhat Account**: #5

### Hardhat CCRP Provider 3
- **Name**: Hardhat CCRP Provider 3
- **Email**: hardhat.ccrp3@test.com
- **Wallet Address**: `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f`
- **Private Key**: `0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97`
- **User ID**: 34
- **Hardhat Account**: #8

## 📊 Summary

- **Total Registered**: 10 users
- **TDP Providers**: 4 users
- **TDC Consumers**: 3 users  
- **CCRP Providers**: 3 users

## 🚀 Usage

These wallets can be used for:
- Testing contract creation and signing
- Demonstrating the contract workflow
- Development and debugging
- User registration testing

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
```

## 📝 Notes

- All wallets are pre-funded with 10,000 ETH on the Hardhat network
- These accounts are deterministic and always available when running `hardhat node`
- The private keys are publicly known and should NEVER be used on mainnet
- Each user has been registered with welcome notifications 