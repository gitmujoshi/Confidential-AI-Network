# 🚀 Cursor Best Practices for Iterative Development

## 🎯 **Overview**

This document outlines best practices for using Cursor to build complex projects (like the Contract Management System) in an iterative manner without regressions. These practices help prevent the recurring authentication issues and other common problems.

## 📋 **Table of Contents**

1. [Project Structure & Organization](#project-structure--organization)
2. [Development Workflow](#development-workflow)
3. [Regression Prevention](#regression-prevention)
4. [Automation & Tools](#automation--tools)
5. [Testing Strategy](#testing-strategy)
6. [Documentation Standards](#documentation-standards)
7. [Cursor-Specific Features](#cursor-specific-features)
8. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🏗️ **Project Structure & Organization**

### **Recommended Structure**
```
project/
├── .cursorrules                    # Project-specific rules
├── .cursorignore                   # Files to ignore
├── docs/
│   ├── ARCHITECTURE.md            # System design
│   ├── SETUP.md                   # Setup procedures
│   ├── TROUBLESHOOTING.md         # Common issues
│   └── CURSOR_BEST_PRACTICES.md   # This document
├── scripts/
│   ├── setup.sh                   # One-time setup
│   ├── start.sh                   # Development startup
│   ├── fix-auth.sh               # Authentication fixes
│   └── test.sh                   # Testing procedures
├── backend/
│   ├── auto-fix-keycloak.js      # Auto-fix script
│   ├── health-check.js           # Health monitoring
│   └── test-regression.js        # Regression tests
└── config/
    ├── dev.env                   # Development config
    ├── test.env                  # Testing config
    └── prod.env                  # Production config
```

### **Create `.cursorrules` for Your Project**
```markdown
# Contract Management System - Cursor Rules

## 🔐 Authentication & Keycloak
- ALWAYS use Keycloak for authentication
- NEVER bypass authentication layers
- ALWAYS sync users to Keycloak before testing
- Use service APIs, never direct database calls

## 🏗️ Development Workflow
- Test authentication after ANY changes
- Use `./fix-auth.sh` for authentication issues
- Run `npm run status` to check system health
- Document all configuration changes

## 🧪 Testing Requirements
- Test login after every change
- Verify all user roles work
- Check API endpoints respond correctly
- Validate environment file sync

## 📝 Documentation
- Update docs when making changes
- Document any manual steps required
- Keep troubleshooting guide current
- Note any workarounds or fixes
```

---

## 🔄 **Development Workflow**

### **Before Making Changes**
```bash
# 1. Check current state
npm run status

# 2. Test current functionality
npm run test:login

# 3. Document what you're about to change
# (Add to your commit message or notes)
```

### **During Development**
```bash
# 1. Make small, focused changes
# 2. Test immediately after each change
npm run test:login

# 3. If something breaks, fix it immediately
./fix-auth.sh

# 4. Don't move on until it's working
```

### **After Making Changes**
```bash
# 1. Test the specific change
npm run test:login

# 2. Test related functionality
npm run status

# 3. Update documentation if needed
# 4. Commit with clear message
```

### **Commit Message Template**
```
feat: [Brief description of change]

## Context
- Making changes to [specific area]
- Testing with [specific user/endpoint]
- Previous state: [working/broken]
- Expected outcome: [what should happen]

## Testing Checklist
- [ ] Login works for all user types
- [ ] Error messages are clear
- [ ] No regressions in other features
- [ ] Documentation updated

## Notes
- Any manual steps required
- Known limitations
- Future improvements needed
```

---

## 🛡️ **Regression Prevention**

### **Automated Health Checks**
```javascript
// backend/health-check.js
async function healthCheck() {
  const checks = [
    { name: 'Database', test: () => db.sequelize.authenticate() },
    { name: 'Keycloak', test: () => axios.get('http://localhost:8080/health') },
    { name: 'Authentication', test: () => testLogin() },
    { name: 'API Endpoints', test: () => testAPIEndpoints() }
  ];
  
  for (const check of checks) {
    try {
      await check.test();
      console.log(`✅ ${check.name}: OK`);
    } catch (error) {
      console.log(`❌ ${check.name}: FAILED`);
      throw error;
    }
  }
}
```

### **Pre-commit Hooks**
```json
// package.json
{
  "scripts": {
    "precommit": "npm run test:auth && npm run status",
    "test:auth": "node test-authentication.js",
    "status": "node health-check.js"
  }
}
```

### **Development Checklist**
For Every Change:
- [ ] **Before**: Test current state
- [ ] **During**: Make small, focused changes
- [ ] **After**: Test the change
- [ ] **Verify**: Related functionality still works
- [ ] **Document**: Update docs if needed
- [ ] **Commit**: With clear, descriptive message

For Authentication Changes:
- [ ] Test login before changes
- [ ] Make the change
- [ ] Run `./fix-auth.sh` if needed
- [ ] Test login after changes
- [ ] Verify all user types work
- [ ] Check API endpoints

---

## 🤖 **Automation & Tools**

### **One-Command Fixes**
```bash
# Fix all authentication issues
./fix-auth.sh

# Start everything properly
./start-system.sh

# Check system status
npm run status

# Test authentication
npm run test:login
```

### **Auto-Detection Scripts**
```javascript
// backend/auto-fix-keycloak.js
class KeycloakAutoFix {
  async run() {
    // 1. Check Keycloak health
    // 2. Auto-fix configuration issues
    // 3. Sync users
    // 4. Test authentication
    // 5. Report results
  }
}
```

### **Health Monitoring**
```javascript
// backend/monitor.js
setInterval(async () => {
  try {
    await healthCheck();
    console.log('✅ System health: OK');
  } catch (error) {
    console.log('❌ System health: FAILED');
    console.log('Running auto-fix...');
    await autoFix();
  }
}, 60000); // Check every minute
```

---

## 🧪 **Testing Strategy**

### **Automated Tests**
```javascript
// backend/test-regression.js
describe('Authentication Regression Tests', () => {
  test('TDC user can login', async () => {
    const result = await loginUser('tdc-test@example.com', 'password123');
    expect(result.success).toBe(true);
  });
  
  test('TDP user can login', async () => {
    const result = await loginUser('tdp-test@example.com', 'password123');
    expect(result.success).toBe(true);
  });
  
  test('CCRP user can login', async () => {
    const result = await loginUser('ccrp-test@example.com', 'password123');
    expect(result.success).toBe(true);
  });
});
```

### **Test Categories**
1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: API endpoints and services
3. **End-to-End Tests**: Complete user workflows
4. **Regression Tests**: Ensure no breaking changes
5. **Health Checks**: System status verification

### **Testing Commands**
```bash
# Run all tests
npm test

# Run specific test category
npm run test:auth
npm run test:api
npm run test:e2e

# Run health checks
npm run health

# Test authentication specifically
npm run test:login
```

---

## 📝 **Documentation Standards**

### **Living Documentation**
```markdown
# docs/CURRENT_STATE.md
## Authentication Status
- ✅ Keycloak: Running on port 8080
- ✅ Backend: Running on port 5001
- ✅ Test Users: All synced
- ✅ Login: Working for all user types

## Last Known Working State
- Date: 2025-08-03
- Commit: abc123
- Changes: Fixed Keycloak client configuration

## Common Issues & Solutions
1. "Invalid client credentials" → Run `./fix-auth.sh`
2. "Realm not found" → Run `cd backend && node auto-fix-keycloak.js`
3. "User not synced" → Run `npm run keycloak:sync`
```

### **Documentation Types**
1. **Architecture Docs**: System design and components
2. **Setup Guides**: Installation and configuration
3. **Troubleshooting**: Common issues and solutions
4. **API Docs**: Endpoint documentation
5. **User Guides**: How to use the system

### **Documentation Maintenance**
- Update docs when making changes
- Keep troubleshooting guide current
- Document any workarounds or fixes
- Note any manual steps required

---

## 🎯 **Cursor-Specific Features**

### **Leverage Cursor's AI for:**
- **Code Review**: Ask "Will this change break authentication?"
- **Testing**: "What tests should I run after this change?"
- **Documentation**: "Update the troubleshooting guide for this change"
- **Debugging**: "Why is authentication failing after this change?"

### **Use Cursor's Context Awareness**
```markdown
# In your commit messages or comments:
## Context
- Making changes to authentication flow
- Testing with tdc-test@example.com
- Previous state: working
- Expected outcome: improved error handling

## Testing Checklist
- [ ] Login works for all user types
- [ ] Error messages are clear
- [ ] No regressions in other features
```

### **Cursor Workflow for This Project**
Daily Development:
1. **Start**: `./start-system.sh`
2. **Check**: `npm run status`
3. **Develop**: Make changes iteratively
4. **Test**: After each change
5. **Fix**: Immediately if issues arise
6. **Document**: Update relevant docs

When Issues Occur:
1. **Don't panic** - use the automated fixes
2. **Run**: `./fix-auth.sh`
3. **Check**: `npm run status`
4. **Document**: What caused the issue
5. **Prevent**: Add safeguards for next time

---

## 🚨 **Troubleshooting Guide**

### **Common Issues & Solutions**

#### **Authentication Issues**
```bash
# Quick fix for authentication problems
./fix-auth.sh

# Manual Keycloak fix
cd backend && node auto-fix-keycloak.js

# Reset everything
npm run reset:keycloak
```

#### **Backend Won't Start**
```bash
# Check if port is in use
lsof -i :5001

# Kill existing process
pkill -f "node server.js"

# Start fresh
cd backend && node server.js
```

#### **Keycloak Issues**
```bash
# Check Keycloak status
curl -s http://localhost:8080/health

# Restart Keycloak
docker-compose -f docker-compose.keycloak-persistent.yml restart

# Reset Keycloak completely
docker-compose -f docker-compose.keycloak-persistent.yml down
docker-compose -f docker-compose.keycloak-persistent.yml up -d
```

#### **Environment Issues**
```bash
# Check environment files
diff backend/.env backend/config.env

# Sync environment files
cd backend && node auto-fix-keycloak.js
```

### **Debugging Commands**
```bash
# Check system status
npm run status

# Test authentication
npm run test:login

# Check health
npm run health

# View logs
tail -f logs/backend.log
```

---

## 🔄 **Continuous Improvement**

### **Learn from Regressions**
- **Document** what caused each regression
- **Automate** detection of similar issues
- **Add** tests for the failing scenarios
- **Improve** the auto-fix scripts

### **Iterate on Tools**
- **Enhance** the health check scripts
- **Improve** the auto-fix capabilities
- **Add** more comprehensive testing
- **Streamline** the development workflow

### **Metrics to Track**
- Number of regressions per week
- Time to fix authentication issues
- Test coverage percentage
- Documentation freshness

---

## 🎉 **Result: No More Regressions**

With these practices:
- ✅ **Automated detection** of issues
- ✅ **Immediate fixes** when problems occur
- ✅ **Comprehensive testing** after changes
- ✅ **Living documentation** of current state
- ✅ **Iterative improvement** of tools and processes

This approach ensures that your Contract Management System (and any similar project) can be developed iteratively without regressions, using Cursor's capabilities to maintain system health and prevent issues before they become problems.

---

## 📚 **Additional Resources**

- [Cursor Documentation](https://cursor.sh/docs)
- [Git Best Practices](https://git-scm.com/book/en/v2)
- [Node.js Testing Guide](https://nodejs.org/en/docs/guides/testing-and-debugging/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

*Last updated: 2025-08-03*
*Version: 1.0.0* 