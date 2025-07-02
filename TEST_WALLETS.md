# Test Wallets for Contract Management App

This file contains test wallet information for development and testing purposes.

## ⚠️ IMPORTANT
- These are TEST wallets only - DO NOT use on mainnet!
- All wallets have 10,000 ETH on the local Hardhat network
- Use these for development, testing, and demonstration purposes only

## Training Data Providers (TDP)

### Test TDP Provider 1
- **Name**: Test TDP Provider 1
- **Email**: tdp1@test.com
- **Wallet Address**: `0x7E38648d17BA3bfbA5e5f7d34BF300F578B068A8`
- **Private Key**: `0x24f41817e61953a433c88f04b2800655faf221d6689e703d2b60d2c1c5f2cc56`
- **User ID**: 17

### Test TDP Provider 2
- **Name**: Test TDP Provider 2
- **Email**: tdp2@test.com
- **Wallet Address**: `0xE29B14eDEe66528a4baa3b55D2505E95c5bdFA86`
- **Private Key**: `0xbf655fb9da33b4ff7269c35336b1e557940817f53fa63ae267d1aaa99973122b`
- **User ID**: 18

### Test TDP Provider 3
- **Name**: Test TDP Provider 3
- **Email**: tdp3@test.com
- **Wallet Address**: `0xc4b8B159D51C37b3592D59ccb86A4b466ec6dc54`
- **Private Key**: `0x3f6fec1b65625715d2c17c29260508b447f388888d3688f8dfc16ccdb3eeb389`
- **User ID**: 19

## Training Data Consumers (TDC)

### Test TDC Consumer 1
- **Name**: Test TDC Consumer 1
- **Email**: tdc1@test.com
- **Wallet Address**: `0xe92Bb7496c4aAf1F52168Bf023e33849EAEAF4A6`
- **Private Key**: `0x33588a7a92b4eecaf71ef356bea4962989563afff003e11649b2ec7159b48883`
- **User ID**: 20

### Test TDC Consumer 2
- **Name**: Test TDC Consumer 2
- **Email**: tdc2@test.com
- **Wallet Address**: `0xa5FAD6ecf895eF04ed2F65A56F3c64b03f736286`
- **Private Key**: `0x600ac394b978969d9626d45580752f831340c0a8690f9afd5c57073759312ce0`
- **User ID**: 21

### Test TDC Consumer 3
- **Name**: Test TDC Consumer 3
- **Email**: tdc3@test.com
- **Wallet Address**: `0x77B54c4F9ff7164888261122C07f61c83fE68B22`
- **Private Key**: `0x2f7a5c8535adb52a53922bdc66a5c803372916b26d2a76740410495c410cf076`
- **User ID**: 22

## Confidential Clean Room Providers (CCRP)

### Test CCRP Provider 1
- **Name**: Test CCRP Provider 1
- **Email**: ccrp1@test.com
- **Wallet Address**: `0xF49Bb88F7CADf858d2881934ee0CC5181f48f632`
- **Private Key**: `0xd52b1445a9463af41d73e3bf817ded125f230ee3489dc784e4e31dd02c89a9c6`
- **User ID**: 23

### Test CCRP Provider 2
- **Name**: Test CCRP Provider 2
- **Email**: ccrp2@test.com
- **Wallet Address**: `0x1Ef5601fF54ba5d4A1e8aE65272bE3982176FD39`
- **Private Key**: `0xb2500a2231abd3b8542a1ffda554bd1d39ca05b7c2eb5206577c9158fe735d02`
- **User ID**: 24

### Test CCRP Provider 3
- **Name**: Test CCRP Provider 3
- **Email**: ccrp3@test.com
- **Wallet Address**: `0x59ed6c7081638d742323eAe9514E89cBF08784D5`
- **Private Key**: `0x09e5bdd0e8dccfac53bf9868519335f850942f3758dc6aa69ae9e75d7b8f9944`
- **User ID**: 25

## Usage Instructions

### 1. User Registration
- Use the wallet addresses for user registration in the frontend
- Each wallet is already registered in the database with the corresponding party type

### 2. Contract Signing
- Use the private keys for contract signing operations
- These private keys work with the local Hardhat network

### 3. Testing Scenarios
- **TDP**: Can create datasets and sign contracts as data providers
- **TDC**: Can browse datasets and sign contracts as data consumers
- **CCRP**: Can be selected as clean room providers in contracts

### 4. Network Configuration
- **Network**: Local Hardhat Network
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: 31337
- **Currency**: ETH

## Quick Reference by Party Type

### TDP Wallets (Data Providers)
- `0x7E38648d17BA3bfbA5e5f7d34BF300F578B068A8` - tdp1@test.com
- `0xE29B14eDEe66528a4baa3b55D2505E95c5bdFA86` - tdp2@test.com
- `0xc4b8B159D51C37b3592D59ccb86A4b466ec6dc54` - tdp3@test.com

### TDC Wallets (Data Consumers)
- `0xe92Bb7496c4aAf1F52168Bf023e33849EAEAF4A6` - tdc1@test.com
- `0xa5FAD6ecf895eF04ed2F65A56F3c64b03f736286` - tdc2@test.com
- `0x77B54c4F9ff7164888261122C07f61c83fE68B22` - tdc3@test.com

### CCRP Wallets (Clean Room Providers)
- `0xF49Bb88F7CADf858d2881934ee0CC5181f48f632` - ccrp1@test.com
- `0x1Ef5601fF54ba5d4A1e8aE65272bE3982176FD39` - ccrp2@test.com
- `0x59ed6c7081638d742323eAe9514E89cBF08784D5` - ccrp3@test.com

## Regeneration
To create new test wallets, run:
```bash
npm run create-wallets
```

This will generate new wallets and register them in the database. 