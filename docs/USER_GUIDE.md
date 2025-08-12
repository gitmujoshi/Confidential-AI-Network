# 👥 User Guide

Complete guide for using the Contract Management System. This guide consolidates all user-related documentation.

## 📋 Table of Contents

1. [User Roles](#user-roles)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Dashboard Overview](#dashboard-overview)
5. [Contract Management](#contract-management)
6. [Dataset Management](#dataset-management)
7. [Cloud Credentials](#cloud-credentials)
8. [Differential Privacy](#differential-privacy)
9. [Troubleshooting](#troubleshooting)

## 👤 User Roles

### **TDC (Training Data Consumer)**
**Purpose**: Browse and purchase datasets for training AI models

**Capabilities**:
- Browse available datasets
- View dataset details and metadata
- Purchase datasets through contracts
- Track contract status and execution
- View training environment specifications

**Dashboard Features**:
- Dataset catalog with search and filters
- Contract management interface
- Purchase history and tracking
- Training environment monitoring

### **TDP (Training Data Provider)**
**Purpose**: Create and manage datasets for sale

**Capabilities**:
- Create and upload datasets
- Set pricing and licensing terms
- Manage dataset metadata and descriptions
- Track sales and revenue
- Monitor contract execution

**Dashboard Features**:
- Dataset creation and management
- Sales analytics and reporting
- Contract status tracking
- Revenue and performance metrics

### **CCRP (Confidential Clean Room Provider)**
**Purpose**: Provide secure computing environments for data processing

**Capabilities**:
- Manage cloud credentials
- Configure secure environments
- Monitor environment usage
- Track costs and billing
- Provide infrastructure specifications

**Dashboard Features**:
- Cloud credentials management
- Environment provisioning
- Cost monitoring and analytics
- Infrastructure specifications

### **AppAdmin (Application Administrator)**
**Purpose**: System administration and oversight

**Capabilities**:
- User management and role assignment
- System configuration and monitoring
- Audit logs and security oversight
- Performance monitoring and optimization

**Dashboard Features**:
- User management interface
- System health monitoring
- Audit logs and reporting
- Configuration management

## 🚀 Getting Started

### **First-Time Login**

1. **Access the System**
   - Open your browser and navigate to: http://localhost:3000
   - You'll see the login page

2. **Login with Test Credentials**
   - Use one of the test accounts below
   - All test users use password: `password123`

   | Role | Email | Purpose |
   |------|-------|---------|
   | TDC | `tdc-test@example.com` | Browse and purchase datasets |
   | TDP | `tdp-test@example.com` | Create and manage datasets |
   | CCRP | `ccrp-test@example.com` | Manage cloud credentials |
   | AppAdmin | `appadmin-test@example.com` | System administration |

3. **Complete Onboarding**
   - Fill in your profile information
   - Verify your email address
   - Complete any required setup steps

### **Dashboard Navigation**

Once logged in, you'll see:

- **Left Sidebar**: Navigation menu with role-specific options
- **Top Bar**: User info, notifications, and logout
- **Main Content**: Role-specific dashboard
- **Breadcrumbs**: Current location in the system

## 🔐 Authentication

### **Login Process**

1. **Enter Credentials**
   - Email: Your registered email address
   - Password: Your account password

2. **Authentication Flow**
   - System validates credentials with Keycloak
   - Role-based access is applied
   - Session tokens are generated
   - You're redirected to your dashboard

### **Password Management**

#### **Reset Password**
1. Click "Forgot Password" on login page
2. Enter your email address
3. Check your email for reset link
4. Create a new password

#### **Change Password**
1. Go to Profile Settings
2. Click "Change Password"
3. Enter current and new password
4. Save changes

### **Session Management**

- **Session Timeout**: 30 minutes of inactivity
- **Token Refresh**: Automatic token refresh
- **Logout**: Click logout button or close browser

## 📊 Dashboard Overview

### **TDC Dashboard**

#### **Main Features**
- **Dataset Catalog**: Browse available datasets
- **My Contracts**: View your purchased contracts
- **Training Environments**: Monitor your training setups
- **Analytics**: View usage and performance metrics

#### **Key Actions**
1. **Browse Datasets**: Search and filter available datasets
2. **Purchase Dataset**: Create contract for dataset purchase
3. **Monitor Training**: Track contract execution status
4. **View History**: Access purchase and usage history

### **TDP Dashboard**

#### **Main Features**
- **My Datasets**: Manage your created datasets
- **Sales Analytics**: View revenue and performance
- **Contract Management**: Track dataset sales
- **Revenue Reports**: Financial performance metrics

#### **Key Actions**
1. **Create Dataset**: Upload and configure new datasets
2. **Manage Pricing**: Set and update dataset pricing
3. **Track Sales**: Monitor contract status and revenue
4. **Analytics**: View performance and usage metrics

### **CCRP Dashboard**

#### **Main Features**
- **Cloud Credentials**: Manage multi-cloud credentials
- **Environment Management**: Configure secure environments
- **Cost Monitoring**: Track infrastructure costs
- **Infrastructure Specs**: Define environment requirements

#### **Key Actions**
1. **Add Credentials**: Configure cloud provider access
2. **Create Environments**: Provision secure computing environments
3. **Monitor Costs**: Track infrastructure usage and billing
4. **Manage Specs**: Define environment requirements

### **AppAdmin Dashboard**

#### **Main Features**
- **User Management**: Manage system users and roles
- **System Health**: Monitor system performance
- **Audit Logs**: View security and activity logs
- **Configuration**: System settings and configuration

#### **Key Actions**
1. **Manage Users**: Create, edit, and delete user accounts
2. **Monitor Health**: Check system performance and status
3. **View Logs**: Access audit and security logs
4. **Configure System**: Update system settings

## 📄 Contract Management

### **Creating Contracts**

#### **For TDC Users**
1. **Browse Datasets**: Find datasets you want to purchase
2. **Select Dataset**: Click on dataset to view details
3. **Review Terms**: Check pricing, licensing, and terms
4. **Create Contract**: Click "Create Contract"
5. **Fill Details**: Enter contract specifications
6. **Submit**: Review and submit contract

#### **Contract Specifications**
- **Dataset Information**: Dataset ID, name, and version
- **Pricing**: Cost and payment terms
- **Licensing**: Usage rights and restrictions
- **Training Environment**: Infrastructure requirements
- **Timeline**: Start and end dates
- **Terms**: Additional terms and conditions

### **Contract Status**

#### **Status Types**
- **Draft**: Contract being created
- **Pending**: Awaiting approval
- **Active**: Contract in execution
- **Completed**: Contract finished successfully
- **Cancelled**: Contract terminated
- **Failed**: Contract execution failed

#### **Status Tracking**
- **Real-time Updates**: Status changes are reflected immediately
- **Notifications**: Email and in-app notifications for status changes
- **History**: Complete audit trail of status changes

### **Contract Execution**

#### **Training Environment Setup**
1. **Environment Creation**: System provisions secure environment
2. **Data Transfer**: Dataset is securely transferred
3. **Access Provisioning**: User access is configured
4. **Monitoring**: System monitors execution progress

#### **Execution Monitoring**
- **Progress Tracking**: Real-time execution status
- **Resource Monitoring**: CPU, memory, and storage usage
- **Cost Tracking**: Infrastructure cost monitoring
- **Log Access**: Execution logs and debugging information

## 📊 Dataset Management

### **For TDP Users**

#### **Creating Datasets**
1. **Upload Data**: Upload dataset files
2. **Metadata**: Add dataset description and metadata
3. **Pricing**: Set pricing and licensing terms
4. **Publishing**: Make dataset available for purchase

#### **Dataset Information**
- **Name and Description**: Clear dataset identification
- **Size and Format**: Technical specifications
- **Licensing**: Usage rights and restrictions
- **Pricing**: Cost structure and payment terms
- **Quality Metrics**: Data quality indicators

#### **Managing Datasets**
- **Update Information**: Modify dataset details
- **Version Control**: Manage dataset versions
- **Pricing Updates**: Adjust pricing as needed
- **Availability**: Enable/disable dataset availability

### **For TDC Users**

#### **Browsing Datasets**
- **Search**: Find datasets by name or description
- **Filter**: Filter by type, size, price, or provider
- **Sort**: Sort by relevance, price, or date
- **Preview**: View dataset details and samples

#### **Dataset Information**
- **Overview**: Dataset description and purpose
- **Specifications**: Technical details and requirements
- **Pricing**: Cost and payment information
- **Licensing**: Usage rights and restrictions
- **Provider**: Information about the data provider

## ☁️ Cloud Credentials

### **For CCRP Users**

#### **Adding Cloud Credentials**
1. **Select Provider**: Choose cloud provider (AWS, Azure, GCP, OCI)
2. **Enter Credentials**: Add access keys and configuration
3. **Validate**: Test credential validity
4. **Save**: Store credentials securely

#### **Supported Providers**
- **AWS**: Amazon Web Services
- **Azure**: Microsoft Azure
- **GCP**: Google Cloud Platform
- **OCI**: Oracle Cloud Infrastructure

#### **Credential Management**
- **Secure Storage**: Credentials stored in HashiCorp Vault
- **Access Control**: Role-based access to credentials
- **Validation**: Automatic credential validation
- **Rotation**: Support for credential rotation

#### **Environment Creation**
1. **Select Credentials**: Choose cloud provider credentials
2. **Define Specs**: Specify environment requirements
3. **Provision**: System creates secure environment
4. **Monitor**: Track environment usage and costs

## 🔐 Differential Privacy

### **Overview**
The differential privacy system provides privacy-preserving data analysis capabilities. It allows you to analyze sensitive data while maintaining mathematical guarantees of privacy protection.

### **Key Concepts**

#### **What is Differential Privacy?**
Differential privacy is a mathematical framework that provides strong privacy guarantees. It works by adding carefully calibrated noise to data analysis results, ensuring that individual records cannot be identified while maintaining useful statistical information.

#### **Privacy Parameters**
- **Epsilon (ε)**: Controls the privacy level
  - Lower values = higher privacy, lower utility
  - Higher values = lower privacy, higher utility
  - Typical range: 0.1 to 10.0
- **Delta (δ)**: Probability of privacy failure
  - Lower values = higher privacy
  - Typical range: 1e-6 to 1e-3

#### **Available Mechanisms**
- **Laplace**: Best for general-purpose queries
- **Gaussian**: Better utility for averages
- **Exponential**: For discrete choice problems
- **Geometric**: For count queries

### **Using Differential Privacy**

#### **1. Accessing DP Features**
1. **Navigate to DP Manager**
   - From your dashboard, look for "Differential Privacy" or "Privacy Tools"
   - Click to open the DP management interface

2. **Select Your Data**
   - Choose the dataset you want to analyze
   - Specify the type of analysis (COUNT, AVERAGE, etc.)

3. **Configure Privacy Parameters**
   - Set epsilon value (recommended: start with 1.0)
   - Set delta value (recommended: 1e-5)
   - Choose appropriate mechanism

#### **2. Running Privacy-Preserving Queries**

**Example: Analyzing Average Values**
```
1. Select data: [1, 2, 3, 4, 5]
2. Query type: AVERAGE
3. Privacy parameters:
   - Epsilon: 0.5
   - Delta: 1e-5
   - Mechanism: Gaussian
4. Click "Apply Differential Privacy"
5. View results with privacy metrics
```

**Example: Counting Records**
```
1. Select data: Dataset with 1000 records
2. Query type: COUNT
3. Privacy parameters:
   - Epsilon: 1.0
   - Delta: 1e-5
   - Mechanism: Geometric
4. Click "Apply Differential Privacy"
5. Get noisy count (e.g., 1003 instead of 1000)
```

#### **3. Understanding Results**

**Privacy Metrics Display**
```
Result: [1.023, 1.987, 3.012, 4.001, 5.034]
Privacy Metrics:
- Mechanism: Laplace
- Epsilon used: 0.5
- Delta used: 1e-5
- Sensitivity: 1.0
- Noise added: ±0.034
```

**Budget Information**
```
Privacy Budget Status:
- Remaining Epsilon: 0.5
- Remaining Delta: 9e-5
- Status: ACTIVE
- Last reset: 2025-08-12
```

### **Privacy Budget Management**

#### **Understanding Your Budget**
- **Initial Budget**: Each contract gets a privacy budget
- **Budget Consumption**: Each DP operation uses part of your budget
- **Budget Status**: Monitor your remaining privacy budget
- **Budget Reset**: Budgets can be reset periodically

#### **Budget Status Indicators**
- 🟢 **ACTIVE**: Budget available for operations
- 🟡 **WARNING**: Budget running low (< 20% remaining)
- 🔴 **EXHAUSTED**: Budget fully consumed
- 🔄 **RESET**: Budget has been reset

#### **Optimizing Budget Usage**
1. **Start Conservative**: Begin with higher epsilon values
2. **Batch Operations**: Combine multiple queries when possible
3. **Choose Mechanisms Wisely**: Use appropriate mechanisms for query types
4. **Monitor Usage**: Check budget status regularly

### **Query Types and Use Cases**

#### **COUNT Queries**
- **Use Case**: Counting records, users, or events
- **Recommended Mechanism**: Geometric
- **Example**: "How many users are in each age group?"
- **Privacy Impact**: Low - only reveals aggregate counts

#### **AVERAGE Queries**
- **Use Case**: Calculating mean values, scores, or ratings
- **Recommended Mechanism**: Gaussian
- **Example**: "What's the average satisfaction score?"
- **Privacy Impact**: Medium - reveals distribution information

#### **SUM Queries**
- **Use Case**: Total values, revenue, or quantities
- **Recommended Mechanism**: Laplace
- **Example**: "What's the total revenue by region?"
- **Privacy Impact**: Medium - reveals aggregate values

#### **GRADIENT Queries**
- **Use Case**: Machine learning training, optimization
- **Recommended Mechanism**: Laplace
- **Example**: "What are the gradients for model training?"
- **Privacy Impact**: High - reveals model behavior

#### **HISTOGRAM Queries**
- **Use Case**: Data distribution analysis
- **Recommended Mechanism**: Laplace
- **Example**: "What's the distribution of user ages?"
- **Privacy Impact**: Medium - reveals data patterns

### **Best Practices for Users**

#### **1. Start Simple**
- Begin with basic queries (COUNT, AVERAGE)
- Use default privacy parameters initially
- Test with small datasets first

#### **2. Understand Trade-offs**
- Higher privacy (lower epsilon) = less accurate results
- Lower privacy (higher epsilon) = more accurate results
- Balance privacy needs with utility requirements

#### **3. Monitor Your Budget**
- Check budget status before operations
- Plan your analysis to fit within budget
- Consider budget resets for long-term projects

#### **4. Choose Appropriate Mechanisms**
- Use Laplace for general-purpose queries
- Use Gaussian for averages when better accuracy is needed
- Use Geometric for count queries
- Use Exponential for selection problems

### **Troubleshooting DP Issues**

#### **Common Problems and Solutions**

**Problem: "Insufficient Privacy Budget"**
```
Solution:
1. Check your current budget status
2. Reduce epsilon/delta values
3. Combine multiple queries into one
4. Wait for budget reset
5. Contact administrator for budget increase
```

**Problem: "Results Too Noisy"**
```
Solution:
1. Increase epsilon value (reduces privacy)
2. Use more data (reduces noise impact)
3. Choose appropriate mechanism
4. Consider query type alternatives
```

**Problem: "Mechanism Not Available"**
```
Solution:
1. Check available mechanisms for your query type
2. Verify your data format
3. Choose alternative query type
4. Contact support for custom mechanisms
```

#### **Getting Help**
1. **Check Documentation**: Review this guide and API documentation
2. **Test Endpoints**: Use the test endpoint to verify functionality
3. **Monitor Logs**: Check operation history for errors
4. **Contact Support**: Reach out to system administrators

### **Advanced Features**

#### **Custom Query Types**
- Define your own analysis types
- Specify custom sensitivity calculations
- Implement domain-specific privacy mechanisms

#### **Batch Processing**
- Process multiple datasets simultaneously
- Optimize budget usage across operations
- Generate comprehensive privacy reports

#### **Privacy Analytics**
- Monitor your privacy budget usage
- Analyze query performance and accuracy
- Generate compliance reports

#### **Integration with Training**
- Apply DP to machine learning workflows
- Protect model gradients during training
- Ensure training data privacy

### **Privacy Compliance**

#### **Data Protection**
- All operations are logged for audit purposes
- Privacy budgets are enforced automatically
- Mathematical guarantees are provided

#### **Audit Trail**
- Complete operation history
- Budget consumption tracking
- Privacy parameter logging
- User activity monitoring

#### **Compliance Reporting**
- Automated privacy reports
- Budget utilization analytics
- Risk assessment tools
- Regulatory compliance checks

## 🚨 Troubleshooting

### **Common User Issues**

#### **Login Problems**
**Symptoms**: "Invalid credentials" or "User not found"

**Solutions**:
1. **Check Email**: Ensure email is correct
2. **Reset Password**: Use "Forgot Password" feature
3. **Contact Admin**: If issues persist, contact system administrator

#### **Dashboard Issues**
**Symptoms**: Blank page or missing features

**Solutions**:
1. **Refresh Page**: Hard refresh (Ctrl+F5 or Cmd+Shift+R)
2. **Clear Cache**: Clear browser cache and cookies
3. **Check Role**: Ensure you're logged in with correct role
4. **Contact Support**: If issues persist

#### **Contract Issues**
**Symptoms**: Contract creation fails or status doesn't update

**Solutions**:
1. **Check Requirements**: Ensure all required fields are filled
2. **Validate Data**: Check data format and requirements
3. **Refresh Page**: Reload to see latest status
4. **Contact Provider**: Reach out to dataset provider

#### **Dataset Issues**
**Symptoms**: Can't upload or access datasets

**Solutions**:
1. **Check Format**: Ensure file format is supported
2. **Verify Size**: Check file size limits
3. **Check Permissions**: Ensure you have upload permissions
4. **Contact Admin**: If technical issues persist

### **Getting Help**

#### **Self-Service Resources**
- **Help Documentation**: In-app help and guides
- **FAQ Section**: Common questions and answers
- **Video Tutorials**: Step-by-step video guides

#### **Support Channels**
- **Email Support**: support@contractmanagement.com
- **In-App Chat**: Live chat support during business hours
- **Phone Support**: +1-800-CONTRACT (business hours)

#### **Escalation Process**
1. **Self-Service**: Try troubleshooting guides first
2. **Email Support**: Send detailed issue description
3. **Phone Support**: Call for urgent issues
4. **Admin Escalation**: Contact system administrator

## 📚 Related Documentation

- **[Quick Start](QUICK_START.md)** - Get started in 5 minutes
- **[Setup Guide](SETUP.md)** - Complete installation and configuration
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Development workflows
- **[API Reference](API_REFERENCE.md)** - Technical API documentation
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

---

*This user guide consolidates information from multiple user-related documents and role-specific guides.* 