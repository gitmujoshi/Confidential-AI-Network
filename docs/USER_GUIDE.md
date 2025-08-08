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
8. [Troubleshooting](#troubleshooting)

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