# CRITICAL AUTHENTICATION RULES

## ⚠️ NEVER BYPASS KEYCLOAK AUTHENTICATION

### **ALWAYS USE KEYCLOAK AUTHENTICATION**
- **NEVER** bypass Keycloak for authentication
- **NEVER** use direct database authentication
- **ALWAYS** use service APIs to maintain data integrity
- **ALWAYS** ensure users exist in Keycloak before testing
- **NEVER** create users only in database without Keycloak sync

### **CORRECT WORKFLOW:**
1. Create users in database
2. **ALWAYS** sync users to Keycloak
3. **ALWAYS** authenticate through Keycloak
4. **ALWAYS** use service APIs for data operations
5. **NEVER** bypass authentication layers

### **SERVICE API USAGE:**
- Use `/api/auth/login` (Keycloak-based)
- Use `/api/auth/profile` (Keycloak-verified)
- Use role-specific APIs (`/api/tdp/*`, `/api/tdc/*`, etc.)
- **NEVER** direct database calls for user operations

### **TESTING APPROACH:**
- **ALWAYS** sync test users to Keycloak first
- **ALWAYS** authenticate through Keycloak
- **ALWAYS** verify user partyType comes from Keycloak
- **NEVER** test with database-only users

## **WHY THIS MATTERS:**
- Maintains data integrity
- Ensures proper role-based access control
- Prevents security vulnerabilities
- Keeps authentication consistent across environments

## **COMMON MISTAKES TO AVOID:**
- ❌ Direct database authentication
- ❌ Bypassing Keycloak for "quick testing"
- ❌ Creating users only in database
- ❌ Using database passwords for authentication
- ❌ Testing without Keycloak sync

## **CORRECT PATTERN:**
```javascript
// ✅ CORRECT - Use Keycloak authentication
const response = await apiService.post('/api/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

// ❌ WRONG - Direct database authentication
const user = await User.findOne({ where: { email } });
```

**Last Updated:** $(date)
**Reason:** Prevent authentication regressions and maintain data integrity 