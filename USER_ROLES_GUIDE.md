# User Roles Guide

## 🎯 **Overview**

The Contract Management System uses role-based access control (RBAC) to ensure users have appropriate permissions and functionality based on their role in the AI training ecosystem. This guide explains each role, their capabilities, and how they interact within the system.

---

## 👥 **Role Types**

### **TDP (Training Data Provider)**
**Purpose**: Organizations that provide datasets for AI training

**Primary Responsibilities**:
- Upload and manage datasets
- Set pricing and access controls
- Respond to contract requests
- Monitor dataset usage and revenue

**Key Capabilities**:
- Create and edit datasets
- Set dataset pricing and licensing
- View contract requests from TDCs
- Accept or reject contract proposals
- Monitor dataset analytics and usage
- Manage data privacy and access controls

**Dashboard Features**:
- **My Datasets**: List and manage owned datasets
- **Contract Requests**: Review pending requests
- **Active Contracts**: Monitor ongoing contracts
- **Analytics**: Usage statistics and revenue tracking
- **Settings**: Profile and organization management

**Data Access**:
- Full access to own datasets
- Read-only access to contract details
- Analytics on dataset usage
- Revenue and billing information

---

### **TDC (Training Data Consumer)**
**Purpose**: Organizations that consume datasets for AI model training

**Primary Responsibilities**:
- Browse available datasets
- Create training contracts
- Monitor training progress
- Access training results

**Key Capabilities**:
- Search and filter available datasets
- Create new training contracts
- Monitor training job progress
- Access trained models and results
- Track contract costs and billing
- Ensure DPDP compliance

**Dashboard Features**:
- **Available Datasets**: Browse and search datasets
- **My Contracts**: Manage training contracts
- **Training Jobs**: Monitor training progress
- **Billing & Payments**: Track costs and invoices
- **Results**: Access trained models and analytics

**Data Access**:
- Read access to public datasets
- Contract-specific access to private datasets
- Training results and model outputs
- Cost and billing information

---

### **CCRP (Confidential Clean Room Provider)**
**Purpose**: Organizations that provide secure computing environments

**Primary Responsibilities**:
- Provide secure computing infrastructure
- Ensure privacy-preserving computation
- Monitor secure data processing
- Maintain compliance standards

**Key Capabilities**:
- Configure secure computing environments
- Monitor secure data processing jobs
- Ensure privacy and security compliance
- Manage compute resources
- Generate compliance reports
- Support multi-party computation

**Dashboard Features**:
- **Secure Environments**: Manage computing resources
- **Active Jobs**: Monitor processing jobs
- **Compliance Reports**: Privacy and security audits
- **Resource Analytics**: Usage and performance metrics
- **Settings**: Environment configuration

**Data Access**:
- Processing environment configuration
- Job execution logs and metrics
- Compliance and audit reports
- Resource utilization data

---

### **AppAdmin (Application Administrator)**
**Purpose**: System administrators with full system access

**Primary Responsibilities**:
- Manage all system users
- Monitor system health and performance
- Configure system settings
- Ensure security and compliance

**Key Capabilities**:
- Create and manage user accounts
- Assign roles and permissions
- Monitor system performance
- Configure system parameters
- View audit logs and security events
- Manage system backups and recovery

**Dashboard Features**:
- **User Management**: Add, edit, and manage users
- **System Health**: Monitor system performance
- **Audit Logs**: Complete activity tracking
- **Configuration**: System settings and parameters
- **Security**: Security monitoring and alerts

**Data Access**:
- Full system access
- All user data and configurations
- System logs and audit trails
- Performance and security metrics

---

## 🔐 **Permission Matrix**

| Feature | TDP | TDC | CCRP | AppAdmin |
|---------|-----|-----|------|----------|
| **Dataset Management** |
| Create Datasets | ✅ | ❌ | ❌ | ✅ |
| Edit Own Datasets | ✅ | ❌ | ❌ | ✅ |
| View All Datasets | ✅ | ✅ | ❌ | ✅ |
| Delete Datasets | ✅ | ❌ | ❌ | ✅ |
| **Contract Management** |
| Create Contracts | ❌ | ✅ | ❌ | ✅ |
| View Own Contracts | ✅ | ✅ | ✅ | ✅ |
| Edit Contracts | ✅ | ✅ | ✅ | ✅ |
| Delete Contracts | ✅ | ✅ | ✅ | ✅ |
| **User Management** |
| View Users | ❌ | ❌ | ❌ | ✅ |
| Create Users | ❌ | ❌ | ❌ | ✅ |
| Edit Users | ❌ | ❌ | ❌ | ✅ |
| Delete Users | ❌ | ❌ | ❌ | ✅ |
| **System Administration** |
| View System Health | ❌ | ❌ | ❌ | ✅ |
| Configure System | ❌ | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ❌ | ✅ |
| Manage Security | ❌ | ❌ | ❌ | ✅ |
| **Analytics** |
| View Own Analytics | ✅ | ✅ | ✅ | ✅ |
| View All Analytics | ❌ | ❌ | ❌ | ✅ |
| Export Reports | ✅ | ✅ | ✅ | ✅ |
| **Settings** |
| Edit Own Profile | ✅ | ✅ | ✅ | ✅ |
| View System Settings | ❌ | ❌ | ❌ | ✅ |
| Manage Organizations | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 **Common Tasks by Role**

### **TDP Common Tasks**

**Daily Operations**:
1. **Review Contract Requests**: Check for new requests from TDCs
2. **Monitor Dataset Usage**: Track how datasets are being used
3. **Update Pricing**: Adjust dataset pricing based on demand
4. **Add New Datasets**: Upload and configure new datasets

**Weekly Tasks**:
1. **Analytics Review**: Review usage statistics and revenue
2. **Contract Management**: Monitor active contracts
3. **Data Quality**: Ensure dataset quality and accuracy
4. **Compliance Check**: Verify DPDP compliance

**Monthly Tasks**:
1. **Revenue Analysis**: Analyze revenue trends and patterns
2. **Dataset Optimization**: Optimize dataset descriptions and tags
3. **Performance Review**: Review contract performance metrics
4. **Strategy Planning**: Plan new datasets and features

### **TDC Common Tasks**

**Daily Operations**:
1. **Browse Datasets**: Search for relevant datasets
2. **Monitor Training**: Check training job progress
3. **Review Results**: Access completed training results
4. **Track Costs**: Monitor contract costs and billing

**Weekly Tasks**:
1. **Contract Creation**: Create new training contracts
2. **Performance Analysis**: Analyze training results
3. **Cost Management**: Review and optimize costs
4. **Compliance Check**: Ensure privacy compliance

**Monthly Tasks**:
1. **Strategy Planning**: Plan new AI training initiatives
2. **Vendor Management**: Evaluate TDP and CCRP performance
3. **Budget Review**: Review and adjust training budgets
4. **Technology Assessment**: Evaluate new AI frameworks

### **CCRP Common Tasks**

**Daily Operations**:
1. **Monitor Jobs**: Check secure processing jobs
2. **Resource Management**: Monitor compute resource usage
3. **Security Alerts**: Respond to security notifications
4. **Performance Monitoring**: Track system performance

**Weekly Tasks**:
1. **Compliance Reports**: Generate privacy compliance reports
2. **Resource Optimization**: Optimize compute resource allocation
3. **Security Audits**: Conduct security assessments
4. **Capacity Planning**: Plan for future capacity needs

**Monthly Tasks**:
1. **Performance Review**: Review overall system performance
2. **Compliance Assessment**: Assess regulatory compliance
3. **Technology Updates**: Plan infrastructure upgrades
4. **Client Management**: Review client satisfaction and needs

### **AppAdmin Common Tasks**

**Daily Operations**:
1. **System Monitoring**: Monitor system health and performance
2. **User Support**: Assist users with issues
3. **Security Monitoring**: Monitor security events and alerts
4. **Backup Verification**: Verify system backups

**Weekly Tasks**:
1. **User Management**: Review and manage user accounts
2. **Performance Analysis**: Analyze system performance metrics
3. **Security Review**: Review security logs and events
4. **Configuration Updates**: Update system configurations

**Monthly Tasks**:
1. **System Maintenance**: Perform system maintenance tasks
2. **Capacity Planning**: Plan for system growth
3. **Security Assessment**: Conduct comprehensive security reviews
4. **Compliance Review**: Review regulatory compliance status

---

## 🔄 **Role Interactions**

### **Contract Creation Flow**

1. **TDC Initiates**: TDC creates contract request
2. **TDP Reviews**: TDP reviews and accepts/rejects
3. **CCRP Provides**: CCRP provides secure environment
4. **Execution**: Contract executes in secure environment
5. **Results**: TDC receives training results

### **Data Access Flow**

1. **TDP Uploads**: TDP uploads dataset with DEPA ID
2. **TDC Browses**: TDC searches and selects datasets
3. **Contract Creation**: TDC creates contract with selected datasets
4. **Secure Processing**: CCRP provides secure processing environment
5. **Results Delivery**: TDC receives training results

### **Compliance Flow**

1. **DEPA ID Assignment**: All entities get unique DEPA IDs
2. **Privacy Controls**: CCRP ensures privacy-preserving computation
3. **Audit Logging**: System logs all data access and usage
4. **Compliance Reports**: CCRP generates compliance reports
5. **Regulatory Compliance**: System ensures DPDP compliance

---

## 🛡️ **Security and Privacy**

### **Role-Based Security**

**Data Access Controls**:
- Users can only access data relevant to their role
- Multi-factor authentication for all users
- Session management and timeout controls
- Audit logging for all data access

**Privacy Protection**:
- DEPA ID tracking for all data usage
- Privacy-preserving computation techniques
- Data encryption at rest and in transit
- Access controls and permission management

**Compliance Features**:
- DPDP compliance monitoring
- Data residency controls
- Privacy budget management
- Regulatory reporting capabilities

### **Audit and Monitoring**

**Activity Logging**:
- All user actions are logged
- Data access is tracked with DEPA IDs
- Contract execution is monitored
- Security events are recorded

**Compliance Reporting**:
- Automated compliance reports
- Privacy impact assessments
- Security audit reports
- Regulatory compliance documentation

---

## 📚 **Getting Started**

### **For New TDPs**
1. **Register**: Create account with TDP role
2. **Add Datasets**: Upload and configure datasets
3. **Set Pricing**: Configure dataset pricing
4. **Respond to Requests**: Review and accept contract requests

### **For New TDCs**
1. **Browse Datasets**: Search and filter available datasets
2. **Create Contracts**: Initiate training contracts
3. **Monitor Progress**: Track training job progress
4. **Review Results**: Access training results and models

### **For New CCRPs**
1. **Configure Environments**: Set up secure computing environments
2. **Monitor Jobs**: Track secure processing jobs
3. **Ensure Compliance**: Maintain privacy and security standards
4. **Generate Reports**: Create compliance and audit reports

### **For New AppAdmins**
1. **Manage Users**: Add and configure system users
2. **Monitor System**: Track system health and performance
3. **Configure Settings**: Set system parameters
4. **Review Logs**: Monitor audit logs and security events

---

## 🎯 **Best Practices**

### **Role Management**
1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Regular Review**: Periodically review user roles and permissions
3. **Separation of Duties**: Ensure critical functions require multiple approvals
4. **Documentation**: Maintain clear role documentation

### **Security Practices**
1. **Strong Authentication**: Use multi-factor authentication
2. **Regular Updates**: Keep systems and software updated
3. **Monitoring**: Monitor for suspicious activity
4. **Incident Response**: Have clear incident response procedures

### **Compliance Management**
1. **Regular Audits**: Conduct regular compliance audits
2. **Documentation**: Maintain comprehensive documentation
3. **Training**: Provide regular compliance training
4. **Monitoring**: Continuously monitor compliance status

---

*This guide provides comprehensive information about user roles and their capabilities in the Contract Management System. For technical details, refer to the API documentation and developer guides.* 