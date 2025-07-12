# Backend Assets

This directory contains runtime assets required by the backend application.

## Contract Templates

- `ai_training_ricardian_contract.json` - Template for AI training Ricardian contracts
- `ricardian_contract_example.json` - Basic Ricardian contract template

These files are loaded at runtime by the `RicardianContractService` to generate legal documents and smart contracts.

## Usage

The files in this directory are:
- Version controlled
- Included in deployments
- Required for backend functionality
- Loaded dynamically by the application

## Adding New Templates

When adding new contract templates:
1. Place the JSON file in this directory
2. Update the `RicardianContractService` to include the new template
3. Ensure the file is properly formatted and validated 