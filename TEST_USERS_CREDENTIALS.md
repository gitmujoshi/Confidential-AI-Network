# Test Users and Credentials

## 🔐 **Keycloak Admin Access**
- **URL**: http://localhost:8080/admin/
- **Email**: `admin`
- **Password**: `admin123`

## 👥 **Application Users**

### **Admin Users**
| ID | Email | Name | Party Type | Password | Purpose |
|----|-------|------|------------|----------|---------|
| 8 | `admin@contractmanagement.com` | System Administrator | AppAdmin | `Admin123!` | Full system access |
| 9 | `manager@contractmanagement.com` | Platform Manager | AppAdmin | `Admin123!` | Administrative privileges |

### **Training Data Providers (TDP)**
| ID | Email | Name | Organization | Password | DID |
|----|-------|------|--------------|----------|-----|
| 1 | `contact@datacorp.com` | DataCorp Inc. | DataCorp Inc. | `password123` | `did:web:datacorp.com:admin` |
| 2 | `info@aidasolutions.com` | AI Data Solutions | AI Data Solutions | `password123` | `did:web:aidasolutions.com:admin` |
| 3 | `hello@globaldatahub.com` | Global Data Hub | Global Data Hub | `password123` | `did:web:globaldatahub.com:admin` |
| 10 | `test@example.com` | Test User | Test Org | `CixRSJu4sQ@N` | `did:web:gitmujoshi.github.io` |
| 13 | `joshi.mukesh078@gmail.com` | Mukesh Joshi | - | `CixRSJu4sQ@N` | `did:web:mukeshjoshi.github.io` |

### **Training Data Consumers (TDC)**
| ID | Email | Name | Organization | Password | DID |
|----|-------|------|--------------|----------|-----|
| 4 | `research@techailabs.com` | TechAI Labs | TechAI Labs | `password123` | `did:web:techailabs.com:admin` |
| 5 | `ai@innovationcorp.com` | Innovation Corp | Innovation Corp | `password123` | `did:web:innovationcorp.com:admin` |

### **Confidential Clean Room Providers (CCRP)**
| ID | Email | Name | Organization | Password | DID |
|----|-------|------|--------------|----------|-----|
| 6 | `security@securecompute.com` | SecureCompute Inc. | SecureCompute Inc. | `password123` | `did:web:securecompute.com:admin` |
| 7 | `contact@privacyfirst.com` | PrivacyFirst Labs | PrivacyFirst Labs | `password123` | `did:web:privacyfirst.com:admin` |

## 🌐 **Access URLs**

### **Frontend Application**
- **Login URL**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard
- **Contracts**: http://localhost:3000/contracts
- **Datasets**: http://localhost:3000/datasets

### **Keycloak Authentication**
- **Realm**: contract-management
- **Client**: contract-management-frontend
- **Redirect URI**: http://localhost:3000/callback

### **Backend API**
- **Base URL**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/api/health

## 📋 **Quick Reference by Role**

### **For Testing TDP (Training Data Provider) Features**
```
Email: contact@datacorp.com
Password: password123
DID: did:web:datacorp.com:admin
```

### **For Testing TDC (Training Data Consumer) Features**
```
Email: research@techailabs.com
Password: password123
DID: did:web:techailabs.com:admin
```

### **For Testing CCRP (Confidential Clean Room Provider) Features**
```
Email: security@securecompute.com
Password: password123
DID: did:web:securecompute.com:admin
```

### **For Testing Admin Features**
```
Email: admin@contractmanagement.com
Password: Admin123!
DID: did:web:contractmanagement.com:admin:system
```

## 🔧 **User Details**

### **Sample Data Users (ID 1-7)**
These users were created with the sample data script and have complete profiles:
- All have `onboardingStatus: 'COMPLETED'`
- All have `profileCompleted: true`
- All have `emailVerified: true`
- All use default password: `password123`

### **Recently Registered Users (ID 10, 13)**
These users were registered through the registration flow:
- Have temporary passwords generated during registration
- May need email verification
- Have `onboardingStatus: 'IN_PROGRESS'`

### **Admin Users (ID 8, 9)**
These users have administrative privileges:
- Can access all system features
- Use password: `Admin123!`
- Have `partyType: 'AppAdmin'`

## 🚀 **Getting Started**

1. **Start the services** using your `start-service.sh` script
2. **Access the frontend** at http://localhost:3000
3. **Login with any user** from the list above
4. **For admin access**, use `admin@contractmanagement.com` with `Admin123!`

## 📝 **Notes**

- **Default passwords**: Most users use `password123`
- **Admin passwords**: Admin users use `Admin123!`
- **Temporary passwords**: Recently registered users have temporary passwords that should be changed on first login
- **DID verification**: All users have verified DIDs except for recently registered ones
- **Email verification**: Sample users are pre-verified, recent registrations may need verification

## 🔄 **Password Reset**

If you need to reset passwords, you can:
1. Use the forgot password flow in the frontend
2. Reset via Keycloak admin console
3. Use the backend scripts to set new passwords

---

*Last updated: July 12, 2025*
*Total users: 11* 