./start# DEPA Integration Guide

## 🎯 **Overview**

**DEPA** is India’s **iSPIRT** **Data Empowerment and Protection Architecture** ([depa.world](https://depa.world)) — a consent-based framework for accountable data sharing. CAN aligns with DEPA-style multi-party collaboration (TDP / TDC / TSP).

Separately, India’s **Digital Personal Data Protection (DPDP) Act** and other regimes may require clear identification and auditability of parties and processing. The Contract Management System assigns **DEPA IDs** (DEPA-aligned entity identifiers) to users, datasets, contracts, and models so every use of data has a stable, auditable reference.

---

## 🆔 **DEPA ID System**

### **What are DEPA IDs?**

In this product, **DEPA IDs** are unique, DEPA-aligned identifiers (inspired by India’s iSPIRT Data Empowerment and Protection Architecture) assigned to all entities in the system:
- **Users**: TDPs, TDCs, CCRPs, AppAdmins
- **Datasets**: All datasets uploaded to the system
- **Contracts**: All training contracts created
- **AI Models**: Models trained on the platform

### **DEPA ID Format**

**Structure**: `{DEPLOYMENT}-{ENTITY_TYPE}-{UUID}`

**Examples**:
- **User**: `LOCAL-TDP-5534ff3a-2b6a-4dee-9397-7a4e25207bd3`
- **Dataset**: `LOCAL-CONTRACT-426da7bf-a055-4cdb-ac60-79432d05c6ba`
- **Contract**: `LOCAL-CONTRACT-d90ff929-b542-48ac-ac55-9b3f059497a5`

**Components**:
- **Deployment**: LOCAL, PROD, STAGING
- **Entity Type**: TDP, TDC, CCRP, CONTRACT
- **UUID**: Unique identifier for the entity

---

## 🔍 **DEPA ID Display**

### **User Interface**

**Top Bar Display**:
- **Compact Format**: Shows first two segments of DEPA ID
- **Full ID on Hover**: Complete DEPA ID appears on mouse hover
- **Color Coding**: Different colors for different entity types
- **Role Badge**: User role displayed alongside DEPA ID

**Example Display**:
```
DEPA: LOCAL-TDP-5534ff3a... (hover for full ID)
Role: TDP
```

### **Dataset Cards**

**Dataset Information**:
- **DEPA ID**: Unique identifier for each dataset
- **Owner DEPA ID**: TDP's DEPA ID who owns the dataset
- **Contract DEPA IDs**: Associated contract DEPA IDs
- **Usage Tracking**: Complete audit trail of dataset usage

### **Contract Details**

**Contract Information**:
- **Contract DEPA ID**: Unique contract identifier
- **Party DEPA IDs**: All involved parties (TDP, TDC, CCRP)
- **Dataset DEPA IDs**: All datasets used in the contract
- **Execution Tracking**: Complete contract execution audit

---

## 📊 **Privacy Compliance Features**

### **Data Access Tracking**

**Complete Audit Trail**:
- **Who**: Which user accessed the data
- **What**: What data was accessed
- **When**: Timestamp of access
- **Why**: Purpose of data access
- **How**: Method of data access

**Audit Log Example**:
```
2024-01-15 14:30:25 | User: LOCAL-TDP-5534ff3a... | 
Action: Dataset Access | Dataset: LOCAL-CONTRACT-426da7bf... | 
Purpose: Contract Creation | Method: API Call
```

### **Privacy-Preserving Techniques**

**Federated Learning**:
- **Description**: Train models without sharing raw data
- **DEPA Tracking**: Track model updates without data access
- **Privacy Guarantee**: Raw data never leaves TDP premises
- **Compliance**: Full DPDP compliance maintained

**Homomorphic Encryption**:
- **Description**: Compute on encrypted data
- **DEPA Tracking**: Track computation on encrypted data
- **Privacy Guarantee**: Data remains encrypted throughout
- **Compliance**: Zero-knowledge computation

**Differential Privacy**:
- **Description**: Add noise to protect individual privacy
- **DEPA Tracking**: Track privacy budget usage
- **Privacy Guarantee**: Individual privacy protected
- **Compliance**: Mathematical privacy guarantees

**Confidential Computing**:
- **Description**: Secure enclaves for computation
- **DEPA Tracking**: Track computation in secure environment
- **Privacy Guarantee**: Hardware-level security
- **Compliance**: Trusted execution environment

---

## 🔐 **Security and Privacy Controls**

### **Data Access Controls**

**Role-Based Access**:
- **TDP**: Full access to own datasets
- **TDC**: Contract-specific access to datasets
- **CCRP**: Processing environment access only
- **AppAdmin**: System-wide access for administration

**Permission Matrix**:
| Entity | TDP | TDC | CCRP | AppAdmin |
|--------|-----|-----|------|----------|
| Own Datasets | Full | None | None | Full |
| Contract Datasets | Read | Read | Process | Full |
| User Data | Own | None | None | Full |
| System Data | None | None | None | Full |

### **Data Encryption**

**At Rest Encryption**:
- **Database**: All data encrypted in database
- **File Storage**: Dataset files encrypted
- **Backups**: Backup data encrypted
- **Logs**: Audit logs encrypted

**In Transit Encryption**:
- **HTTPS**: All web traffic encrypted
- **API Calls**: All API communication encrypted
- **Database**: Database connections encrypted
- **File Transfer**: Dataset transfers encrypted

---

## 📋 **Compliance Reporting**

### **DPDP Compliance Reports**

**Automated Reports**:
- **Data Access Reports**: Who accessed what data
- **Privacy Impact Assessments**: Privacy risk analysis
- **Compliance Audits**: Regulatory compliance status
- **Incident Reports**: Security and privacy incidents

**Report Types**:
1. **Daily Reports**: Daily data access summaries
2. **Weekly Reports**: Weekly compliance status
3. **Monthly Reports**: Monthly privacy assessments
4. **Annual Reports**: Annual compliance audits

### **Audit Trail**

**Complete Tracking**:
- **User Actions**: All user actions logged
- **Data Access**: All data access recorded
- **System Events**: All system events tracked
- **Security Events**: All security events logged

**Audit Log Fields**:
- **Timestamp**: When the action occurred
- **User DEPA ID**: Who performed the action
- **Action**: What action was performed
- **Resource**: What resource was accessed
- **Result**: Success/failure of the action
- **IP Address**: Source IP address
- **User Agent**: Browser/client information

---

## 🎯 **Best Practices**

### **DEPA ID Management**

**Assignment**:
- **Automatic Assignment**: DEPA IDs assigned automatically
- **Unique Guarantee**: No duplicate DEPA IDs
- **Persistence**: DEPA IDs never change once assigned
- **Validation**: DEPA ID format validation

**Display**:
- **Consistent Format**: Uniform display across UI
- **Compact View**: Show abbreviated form by default
- **Full View**: Show complete ID on hover/click
- **Color Coding**: Different colors for different types

### **Privacy Compliance**

**Data Minimization**:
- **Purpose Limitation**: Data used only for stated purpose
- **Data Retention**: Automatic data deletion after retention period
- **Access Control**: Strict access controls based on need
- **Audit Logging**: Complete audit trail for all access

**Consent Management**:
- **Explicit Consent**: Clear consent for data usage
- **Consent Tracking**: Track consent status and history
- **Withdrawal**: Allow consent withdrawal
- **Notification**: Notify users of data usage

### **Security Measures**

**Access Control**:
- **Multi-Factor Authentication**: Require MFA for all users
- **Session Management**: Automatic session timeout
- **IP Restrictions**: Restrict access by IP address
- **Role-Based Access**: Strict role-based permissions

**Monitoring**:
- **Real-time Monitoring**: Monitor all system activity
- **Alert System**: Alert on suspicious activity
- **Incident Response**: Clear incident response procedures
- **Regular Audits**: Regular security audits

---

## 🛠️ **Technical Implementation**

### **DEPA ID Generation**

**Algorithm**:
```javascript
// Generate DEPA ID for user
const depaId = depaIdService.generateGlobalUserDEPAId('TDP');

// Generate DEPA ID for dataset/contract
const depaId = depaIdService.generateGlobalDEPAId('CONTRACT');
```

**Validation**:
- **Format Check**: Validate DEPA ID format
- **Uniqueness Check**: Ensure no duplicate IDs
- **Type Validation**: Validate entity type
- **Deployment Check**: Validate deployment prefix

### **Database Schema**

**User Table**:
```sql
ALTER TABLE users ADD COLUMN depaId VARCHAR(255) UNIQUE;
```

**Dataset Table**:
```sql
ALTER TABLE datasets ADD COLUMN depaId VARCHAR(255) UNIQUE;
```

**Contract Table**:
```sql
ALTER TABLE contracts ADD COLUMN depaId VARCHAR(255) UNIQUE;
```

### **API Integration**

**DEPA ID in API Responses**:
```json
{
  "id": 1,
  "name": "Medical Images Dataset",
  "depaId": "LOCAL-CONTRACT-426da7bf-a055-4cdb-ac60-79432d05c6ba",
  "owner": {
    "id": 2,
    "name": "AI Research Labs",
    "depaId": "LOCAL-TDP-5534ff3a-2b6a-4dee-9397-7a4e25207bd3"
  }
}
```

---

## 📚 **Getting Started**

### **For Developers**

1. **DEPA ID Service**: Use the DEPA ID service for generation
2. **Validation**: Implement DEPA ID validation
3. **Display**: Implement consistent DEPA ID display
4. **Audit**: Implement audit logging for all actions

### **For Users**

1. **Understanding**: Learn about DEPA ID significance
2. **Display**: Know how to view full DEPA IDs
3. **Compliance**: Understand privacy compliance requirements
4. **Reporting**: Know how to access compliance reports

### **For Administrators**

1. **Monitoring**: Monitor DEPA ID assignment
2. **Audit**: Review audit logs regularly
3. **Compliance**: Ensure DPDP compliance
4. **Reporting**: Generate compliance reports

---

## 🔍 **Troubleshooting**

### **Common Issues**

**DEPA ID Not Displaying**:
- Check if DEPA ID is assigned to entity
- Verify DEPA ID generation service is running
- Check database for DEPA ID values
- Verify UI component is properly configured

**Duplicate DEPA IDs**:
- Check DEPA ID generation algorithm
- Verify uniqueness constraints in database
- Review DEPA ID assignment logic
- Check for race conditions in generation

**Compliance Issues**:
- Review audit logs for missing entries
- Check privacy technique configurations
- Verify data access controls
- Review consent management

### **Support Resources**

- **Documentation**: Comprehensive DEPA ID documentation
- **API Reference**: DEPA ID API documentation
- **Compliance Guide**: DPDP compliance guidelines
- **Support Team**: Technical support for DEPA ID issues

---

*This guide provides comprehensive information about DEPA ID integration and privacy compliance in the Contract Management System. For technical details, refer to the API documentation and developer guides.* 