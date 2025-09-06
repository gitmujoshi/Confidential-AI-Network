# ES256 Signing Validation Guide

This guide provides comprehensive instructions for validating ES256 (ECDSA P-256) signatures in the Contract Management system.

## Overview

The system now supports real ES256 cryptographic signing for DID-based contract signing, replacing the previous mock signatures. This ensures proper cryptographic validation and security.

## Key Components

### 1. Frontend ES256 Signing Utility (`frontend/src/utils/es256sign.js`)

- **`signES256(message, privateJwk)`**: Signs messages using ES256 with P-256 curve
- **`validateSignature(message, signature, publicJwk)`**: Validates signatures using public key
- **`testSigningProcess(privateJwk, message)`**: Complete test of signing and validation process
- **`createPublicJwk(privateJwk)`**: Extracts public JWK from private JWK

### 2. Backend DID Verification (`backend/services/didService.js`)

- Supports `JsonWebKey2020` verification method
- Validates ES256 signatures using the public key from did:web document
- Handles base64url signature format

### 3. Test Tools

- **`frontend/test-signing.html`**: Browser-based test page
- **`test-es256-signing.js`**: Node.js test script
- **ContractDetail.js**: Updated with real ES256 signing

## Your DID Information

```
DID: did:web:mukeshjoshidpi.github.io
Public JWK:
{
  "kty": "EC",
  "crv": "P-256",
  "x": "EJVuvRJhjBe7Wtruavp6M8rCVXMHoX1BwFDI-CfWyL8=",
  "y": "qG4ipgVhMekDyyDlPDlSWIemcTqkTMLDMMFmismkNKk=",
  "kid": "6ac757c1174fffaceecba863483d4e8581f41c4a2a530cd7d5b0126dd4199002",
  "alg": "ES256"
}
```

## Validation Steps

### Step 1: Prepare Your Private JWK

You need your private JWK that corresponds to the public JWK above. It should look like:

```json
{
  "kty": "EC",
  "crv": "P-256",
  "x": "EJVuvRJhjBe7Wtruavp6M8rCVXMHoX1BwFDI-CfWyL8=",
  "y": "qG4ipgVhMekDyyDlPDlSWIemcTqkTMLDMMFmismkNKk=",
  "d": "YOUR_ACTUAL_PRIVATE_KEY_D_VALUE",
  "kid": "6ac757c1174fffaceecba863483d4e8581f41c4a2a530cd7d5b0126dd4199002",
  "alg": "ES256"
}
```

**Important**: The `d` field contains your private key and should be kept secure.

### Step 2: Test the Signing Process

#### Option A: Browser Test (Recommended)

1. Open `http://localhost:3000/test-signing.html` in your browser
2. Paste your private JWK in the textarea
3. Click "Test Signing Process"
4. Verify the test passes

#### Option B: Node.js Test

1. Update `test-es256-signing.js` with your private key
2. Run: `node test-es256-signing.js`
3. Verify all tests pass

### Step 3: Test Contract Signing

1. Use the browser test page or update the Node.js script
2. Test with the actual contract signing message format
3. Verify the signature is valid

### Step 4: Use in Contract Management System

1. Login as TDP user
2. Navigate to a contract
3. Click "Sign Contract"
4. Choose "DID-based signing"
5. Paste your private JWK when prompted
6. The system will validate and use the real signature

## Signature Format

The system uses base64url format for signatures:

- **Input**: ES256 signature as ArrayBuffer
- **Conversion**: Base64 → Base64URL (replace `+` with `-`, `/` with `_`, remove padding `=`)
- **Output**: Base64URL string

Example:
```
Original: "ABC+DEF/GHI="
Base64URL: "ABC-DEF_GHI"
```

## Validation Process

1. **Frontend**: Signs message with ES256 using private JWK
2. **Backend**: Receives signature and message
3. **DID Service**: Fetches public JWK from did:web document
4. **Verification**: Uses public JWK to verify ES256 signature
5. **Result**: Contract signed if verification succeeds

## Error Handling

### Common Issues

1. **Invalid JWK Format**: Ensure all required fields are present
2. **Wrong Curve**: Must use P-256 curve
3. **Missing Private Key**: Private JWK must include `d` field
4. **Signature Format**: Must be base64url encoded
5. **DID Resolution**: Backend must be able to resolve your did:web

### Debugging

- Check browser console for detailed error messages
- Verify DID document is accessible at `https://mukeshjoshidpi.github.io/.well-known/did.json`
- Ensure private JWK matches the public JWK in your DID document

## Security Considerations

1. **Private Key Security**: Never expose your private JWK in production
2. **Key Management**: Use secure key storage in production
3. **DID Document**: Ensure your did:web document is properly hosted
4. **HTTPS**: Use HTTPS for DID document hosting in production

## Testing Checklist

- [ ] Private JWK has correct format and fields
- [ ] ES256 signing test passes
- [ ] Signature validation test passes
- [ ] Contract signing test passes
- [ ] DID document is accessible
- [ ] Backend can resolve DID and verify signature
- [ ] Frontend can sign contracts without logout issues

## Troubleshooting

### "Invalid signature" Error

1. Verify your private JWK matches the public JWK in your DID document
2. Check that the signature is properly base64url encoded
3. Ensure the message format matches exactly what the backend expects

### "DID not found" Error

1. Verify your did:web document is accessible
2. Check the DID format: `did:web:mukeshjoshidpi.github.io`
3. Ensure the DID document contains the correct verification method

### "Logout on signing" Issue

1. Verify the JWT token is valid
2. Check that the backend authentication middleware is working
3. Ensure the contract signing endpoint is properly configured

## Next Steps

1. **Complete Testing**: Run all validation tests
2. **Production Setup**: Configure secure key management
3. **Monitoring**: Add logging for signature verification
4. **Documentation**: Update user guides with new signing process

## Summary

The ES256 signing implementation provides:

- ✅ Real cryptographic signatures
- ✅ Proper DID verification
- ✅ Base64URL signature format
- ✅ Comprehensive validation
- ✅ Test tools for verification
- ✅ Security best practices

This resolves the previous logout issues and provides a secure, standards-compliant signing mechanism for the contract management system. 