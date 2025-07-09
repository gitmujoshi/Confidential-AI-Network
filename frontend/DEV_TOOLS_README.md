# Development Tools

This document explains how to use the development tools for the Contract Management System.

## Why Development Tools?

Development tools are needed for:
- **Token Management**: Quickly set valid tokens for different user types
- **API Testing**: Test endpoints without going through the full UI flow
- **Debugging**: Check system state and troubleshoot issues
- **Development Efficiency**: Speed up development and testing cycles

## Usage

### Method 1: Browser Console (Recommended)

1. Open your browser's developer console (F12)
2. Copy the contents of `dev-tools.js`
3. Paste and press Enter
4. Use the available commands

### Method 2: Bookmarklet

Create a bookmarklet with the dev tools code for quick access.

### Method 3: Browser Extension

Create a browser extension that injects the dev tools automatically in development.

## Available Commands

### Token Management
```javascript
// Set TDP user token
devTools.tokens.setTDP()

// Set TDC user token  
devTools.tokens.setTDC()

// Clear all tokens
devTools.tokens.clear()

// Check current token
devTools.tokens.check()

// Auto-fix token issues
devTools.tokens.autoFix()
```

### API Testing
```javascript
// Test authentication
devTools.api.testAuth()

// Test contracts endpoint
devTools.api.testContracts()
```

### System Information
```javascript
// Show system status
devTools.system.status()

// Reset all data
devTools.system.reset()
```

## Best Practices

### ✅ Do's
- Use development tools only in development environment
- Clear tokens when switching between user types
- Test API endpoints before using them in the UI
- Use `autoFix()` to quickly resolve token issues

### ❌ Don'ts
- Don't use development tools in production
- Don't commit tokens to version control
- Don't rely on development tools for production functionality
- Don't use hardcoded tokens in production code

## Security Considerations

- Development tools are for development only
- Tokens in the dev tools are test tokens only
- Never use development tokens in production
- Clear tokens when switching between environments

## Troubleshooting

### Common Issues

1. **Token not working**: Use `devTools.tokens.autoFix()`
2. **API errors**: Check if backend is running on port 5001
3. **CORS issues**: Ensure backend CORS is configured correctly
4. **Token expired**: Use `devTools.tokens.setTDP()` to get a fresh token

### Quick Fixes

```javascript
// Quick fix for most token issues
devTools.tokens.autoFix()

// Check if everything is working
devTools.api.testAuth()

// Reset everything and start fresh
devTools.system.reset()
```

## Future Improvements

- [ ] Create React DevTools panel
- [ ] Add more API testing endpoints
- [ ] Create browser extension
- [ ] Add automated testing tools
- [ ] Integrate with React Query DevTools 