# Contract Management System - Comprehensive Training Course

---

## Introduction

Welcome to the Contract Management System (CMS) training course! This course is designed to provide a deep understanding of the architecture, components, and best practices for building and maintaining a modern, secure, and scalable contract management platform. Whether you are a developer, architect, or DevOps engineer, this guide will help you master the system from fundamentals to advanced topics.

---

### Course Sequence & Navigation
To maximise learning efficiency, follow the CMS knowledge journey in this order:
1. **Use Cases & Business Requirements** – Understand *why* the platform exists and the problems it solves.
2. **Design & Implementation** – Dive deep into each component (Backend, Frontend, Blockchain, IAM).
3. **System Architecture** – Visual diagrams that connect the components end-to-end.
4. **Security** – Defence-in-depth principles and practices woven throughout the stack.
5. **Testing & Quality** – Validate correctness, performance, and resilience.
6. **DevSecOps & Continuous Security** – Automate security from commit to production.
7. **Deployment & Operations** – Ship, monitor, and scale CMS reliably in production.

(Each item links to its corresponding section ‑ use your editor's outline or the document's anchors.)

---

## 0. Use Cases & Business Requirements

A successful contract management solution must address real-world pain points across industries. Below are the core use cases that shaped CMS design:

1. **Multi-Party Contract Lifecycle**  
   • Draft creation, review, multi-party e-signatures, activation, amendments, and archival.  
   • Role separation for Trusted Data Providers (TDP), Contract Counterparty Representatives (CCRP), and Regulators.
2. **Dataset Licensing & Monetisation**  
   • Secure negotiation and purchase of datasets with automated licence enforcement.  
   • Price discovery, payment processing, and royalty distribution on-chain for auditability.
3. **Regulatory Compliance & Audit**  
   • Immutable blockchain records for tamper-evident audit trails.  
   • Fine-grained access logs meeting GDPR, HIPAA, or sector-specific regulations.
4. **Identity & Access Management**  
   • Single Sign-On (SSO) via Keycloak, supporting corporate identity providers (SAML, OIDC) and MFA.  
   • Delegated administration and role-based access control (RBAC) down to contract level.
5. **Notification & Workflow Automation**  
   • Real-time alerts (email, WebSocket, webhook) for signature requests, contract status, and expirations.  
   • Pluggable workflow engine for custom approval chains.
6. **Scalability & Extensibility**  
   • Modular microservice-friendly architecture for future features such as AI contract analytics.  
   • API-first philosophy enabling third-party integrations and custom frontends.

> **Outcome-Driven Requirements:** These use cases translate into non-functional requirements such as high availability, horizontal scalability, end-to-end encryption, auditable actions, and pluggable authentication providers.

---

## 1. Backend Fundamentals

### 1.1 What is a Backend?
The backend is the server-side part of an application responsible for business logic, data storage, security, and integration with external systems. It exposes APIs for the frontend and other clients, manages authentication, and ensures data integrity.

**Key Concepts:**
- **API (Application Programming Interface):** A set of endpoints for communication between frontend and backend.
- **Database:** Persistent storage for application data (e.g., PostgreSQL, MongoDB).
- **Business Logic:** The rules and workflows that govern how data is created, modified, and validated.
- **Authentication & Authorization:** Mechanisms to verify user identity and control access to resources.
- **Middleware:** Functions that process requests before they reach the main logic (e.g., logging, error handling).

### 1.2 Node.js and Express.js
- **Node.js** is a JavaScript runtime built on Chrome's V8 engine, enabling server-side JavaScript execution.
- **Express.js** is a minimal and flexible Node.js web application framework that provides a robust set of features for web and API development.

**Why Node.js/Express?**
- Non-blocking, event-driven architecture for high concurrency.
- Large ecosystem (npm) and active community.
- Easy integration with modern frontend frameworks.

### 1.3 Database Design (PostgreSQL)
- **Relational Database:** Organizes data into tables with rows and columns, supporting relationships and constraints.
- **ORM (Object-Relational Mapping):** Tools like Sequelize map database tables to JavaScript objects, simplifying CRUD operations.
- **Transactions:** Ensure a set of operations are completed successfully or rolled back on failure, maintaining data integrity.

### 1.4 RESTful API Design
- **REST (Representational State Transfer):** An architectural style for designing networked applications using stateless HTTP requests.
- **CRUD Operations:** Create, Read, Update, Delete - the four basic operations for persistent storage.
- **Status Codes:** Standard HTTP codes (e.g., 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found).

### 1.5 Security Best Practices
- **Input Validation:** Always validate and sanitize user input to prevent SQL injection and XSS.
- **Password Hashing:** Store only hashed passwords using strong algorithms (e.g., bcrypt).
- **JWT (JSON Web Token):** Securely transmit information between parties as a JSON object, used for stateless authentication.
- **Rate Limiting:** Prevent abuse by limiting the number of requests per user/IP.

### 1.6 Real-World Use Cases
- **Contract Management:** Automate contract creation, approval, and signing workflows.
- **User Onboarding:** Secure registration and login with email verification and role assignment.
- **Notifications:** Real-time alerts for contract status changes and required actions.

---

## References

- Node.js Official Docs: https://nodejs.org/en/docs/
- Express.js Guide: https://expressjs.com/en/guide/routing.html
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Sequelize ORM: https://sequelize.org/master/
- RESTful API Design: https://restfulapi.net/
- OWASP Top Ten Security Risks: https://owasp.org/www-project-top-ten/
- JWT Introduction: https://jwt.io/introduction
- bcrypt Password Hashing: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- HTTP Status Codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

---

## 2. Frontend Fundamentals

### 2.1 What is a Frontend?
The frontend is the client-side part of an application that users interact with directly. It is responsible for presenting data, capturing user input, and communicating with the backend via APIs. Modern frontends are typically built as Single Page Applications (SPAs) for a seamless user experience.

**Key Concepts:**
- **UI/UX (User Interface/User Experience):** The design and usability of the application.
- **SPA (Single Page Application):** A web app that loads a single HTML page and dynamically updates content as the user interacts.
- **Component-Based Architecture:** UI is broken into reusable, self-contained components.
- **State Management:** Mechanisms to manage and synchronize data across the app (e.g., React Context, Redux).
- **Routing:** Handling navigation between different views/pages without full page reloads.

### 2.2 React.js
- **React.js** is a popular JavaScript library for building user interfaces, developed by Facebook. It enables the creation of interactive UIs using a component-based approach.

**Why React?**
- Declarative: Describe what you want to see, and React updates the UI efficiently.
- Component Reusability: Build complex UIs from small, isolated pieces of code.
- Strong Ecosystem: Rich set of libraries for routing, state management, and more.

**Example:**
```jsx
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>;
}
```

### 2.3 State Management
- **Local State:** Managed within a component using `useState`.
- **Global State:** Shared across components using Context API or libraries like Redux.
- **Side Effects:** Operations like data fetching, handled with hooks like `useEffect`.

**Example:**
```jsx
const [user, setUser] = useState(null);
useEffect(() => {
  fetch('/api/user').then(res => res.json()).then(setUser);
}, []);
```

### 2.4 API Integration
- **HTTP Requests:** Use `fetch` or libraries like `axios` to communicate with backend APIs.
- **Authentication:** Store tokens securely (e.g., in memory or HttpOnly cookies) and include them in API requests.
- **Error Handling:** Display user-friendly error messages and handle network failures gracefully.

### 2.5 Security Best Practices
- **Input Validation:** Validate user input on the client before sending to the backend.
- **XSS Prevention:** Escape or sanitize any user-generated content rendered in the UI.
- **CSRF Protection:** Use secure authentication tokens and avoid exposing sensitive data in the frontend.

### 2.6 Real-World Use Cases
- **User Registration/Login:** Forms for onboarding and authentication.
- **Dashboard:** Visualize contracts, datasets, and notifications.
- **Contract Signing:** UI for reviewing and signing contracts, with status indicators.
- **Notifications:** Real-time updates for contract status and actions required.

### 2.7 Modern Frontend Tooling
- **Build Tools:** Webpack, Vite, or Create React App for bundling and optimizing assets.
- **Testing:** Jest and React Testing Library for unit and integration tests.
- **Linting/Formatting:** ESLint and Prettier for code quality and consistency.

---

## References (Frontend)

- React Official Docs: https://react.dev/
- MDN Web Docs - JavaScript: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- MDN Web Docs - HTML/CSS: https://developer.mozilla.org/en-US/docs/Web
- React Router: https://reactrouter.com/
- Redux: https://redux.js.org/
- Axios: https://axios-http.com/
- OWASP XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- Webpack: https://webpack.js.org/
- Vite: https://vitejs.dev/
- Jest: https://jestjs.io/
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- ESLint: https://eslint.org/
- Prettier: https://prettier.io/

---

## 3. Blockchain Integration

### 3.1 What is Blockchain?
Blockchain is a distributed ledger technology that enables secure, transparent, and tamper-proof record-keeping. It consists of a chain of blocks, each containing a list of transactions that are cryptographically linked and verified by a network of nodes.

**Key Concepts:**
- **Decentralization:** No single entity controls the network; data is distributed across multiple nodes.
- **Immutability:** Once recorded, data cannot be altered without consensus from the network.
- **Consensus Mechanisms:** Protocols (e.g., Proof of Work, Proof of Stake) ensure agreement on the state of the ledger.
- **Smart Contracts:** Self-executing contracts with predefined rules written in code.

### 3.2 Ethereum and Smart Contracts
- **Ethereum** is a decentralized platform that enables the creation and execution of smart contracts using its native cryptocurrency, Ether (ETH).
- **Smart Contracts** are programs that automatically execute when predefined conditions are met, eliminating the need for intermediaries.

**Example Smart Contract:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContractManager {
    struct Contract {
        string contractId;
        address tdp;
        address ccrp;
        uint256 price;
        bool isActive;
    }
    
    mapping(string => Contract) public contracts;
    
    function createContract(string memory _contractId, address _tdp, address _ccrp, uint256 _price) public {
        contracts[_contractId] = Contract(_contractId, _tdp, _ccrp, _price, false);
    }
    
    function activateContract(string memory _contractId) public {
        require(contracts[_contractId].tdp == msg.sender, "Only TDP can activate");
        contracts[_contractId].isActive = true;
    }
}
```

### 3.3 Hardhat Development Environment
- **Hardhat** is a development environment for Ethereum that provides tools for compiling, deploying, testing, and debugging smart contracts.
- **Local Blockchain:** Hardhat includes a local Ethereum network for development and testing.

**Key Features:**
- **Compilation:** Automatically compiles Solidity contracts.
- **Testing:** Built-in testing framework for smart contracts.
- **Deployment:** Scripts for deploying contracts to various networks.
- **Debugging:** Advanced debugging capabilities with stack traces.

### 3.4 Web3.js Integration
- **Web3.js** is a JavaScript library that allows interaction with Ethereum nodes and smart contracts from web applications.
- **Contract Interaction:** Send transactions, call contract functions, and listen to events.

**Example:**
```javascript
const Web3 = require('web3');
const contractABI = require('./ContractManager.json');

const web3 = new Web3('http://localhost:8545');
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Call contract function
const result = await contract.methods.createContract(
    'CONTRACT-001',
    tdpAddress,
    ccrpAddress,
    web3.utils.toWei('100', 'ether')
).send({ from: userAddress });
```

### 3.5 Gas and Transaction Costs
- **Gas** is the unit of computational effort required to execute operations on the Ethereum network.
- **Gas Price:** The amount of Ether paid per unit of gas, determined by network congestion.
- **Transaction Fees:** Total cost = Gas Used × Gas Price.

**Optimization Strategies:**
- Batch operations to reduce transaction count.
- Use efficient data structures and algorithms.
- Optimize contract code to minimize gas consumption.

### 3.6 Security Considerations
- **Reentrancy Attacks:** Prevent recursive calls to contract functions.
- **Integer Overflow/Underflow:** Use SafeMath library or Solidity 0.8+ built-in checks.
- **Access Control:** Implement proper authorization mechanisms.
- **Code Audits:** Regular security audits by professional firms.

### 3.7 Real-World Use Cases
- **Contract Signing:** Immutable record of contract agreements and signatures.
- **Payment Processing:** Automated payments based on contract terms.
- **Compliance Tracking:** Transparent audit trail for regulatory compliance.
- **Dispute Resolution:** Tamper-proof evidence for legal proceedings.

### 3.8 Testing Smart Contracts
- **Unit Tests:** Test individual contract functions in isolation.
- **Integration Tests:** Test interactions between multiple contracts.
- **Gas Testing:** Measure and optimize gas consumption.
- **Security Testing:** Identify vulnerabilities and attack vectors.

**Example Test:**
```javascript
describe("ContractManager", function () {
  it("Should create a contract", async function () {
    const ContractManager = await ethers.getContractFactory("ContractManager");
    const contractManager = await ContractManager.deploy();
    
    await contractManager.createContract("TEST-001", tdp.address, ccrp.address, 100);
    const contract = await contractManager.contracts("TEST-001");
    
    expect(contract.contractId).to.equal("TEST-001");
  });
});
```

---

## References (Blockchain)

- Ethereum Official Docs: https://ethereum.org/en/developers/docs/
- Solidity Documentation: https://docs.soliditylang.org/
- Hardhat Documentation: https://hardhat.org/docs
- Web3.js Documentation: https://web3js.org/
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/
- ConsenSys Diligence: https://consensys.net/diligence/
- Ethereum Gas Tracker: https://etherscan.io/gastracker
- Smart Contract Security Best Practices: https://consensys.net/blog/developers/smart-contract-security-best-practices/
- Ethereum Improvement Proposals (EIPs): https://eips.ethereum.org/
- MetaMask Documentation: https://docs.metamask.io/

---

## 4. Identity and Access Management (IAM) & Keycloak

### 4.1 What is IAM?
Identity and Access Management (IAM) is a framework of policies and technologies that ensures the right individuals have access to the right resources at the right times for the right reasons. It encompasses user authentication, authorization, and identity lifecycle management.

**Key Concepts:**
- **Authentication (AuthN):** Verifying who a user is (e.g., username/password, biometrics, tokens).
- **Authorization (AuthZ):** Determining what resources a user can access and what actions they can perform.
- **Identity Federation:** Allowing users to access multiple systems with a single set of credentials.
- **Single Sign-On (SSO):** Enabling users to access multiple applications with one login session.

### 4.2 Keycloak Overview
- **Keycloak** is an open-source identity and access management solution that provides authentication, authorization, and user management for modern applications and services.
- **Features:** Single Sign-On, Identity Brokering, Social Login, User Federation, and more.

**Why Keycloak?**
- **Open Source:** No licensing costs and community-driven development.
- **Standards Compliant:** Supports OAuth 2.0, OpenID Connect, SAML 2.0.
- **Scalable:** Can handle millions of users and high availability deployments.
- **Extensible:** Custom themes, user federation, and authentication flows.

### 4.3 Keycloak Architecture
- **Realm:** A security boundary that contains users, applications, and other resources.
- **Client:** An application that can request authentication from Keycloak.
- **User:** An individual who can log in to applications.
- **Role:** A set of permissions that can be assigned to users or groups.

**Example Realm Configuration:**
```json
{
  "realm": "contract-management",
  "enabled": true,
  "clients": [
    {
      "clientId": "contract-management-frontend",
      "enabled": true,
      "publicClient": true,
      "redirectUris": ["http://localhost:3000/*"],
      "webOrigins": ["http://localhost:3000"]
    }
  ],
  "roles": {
    "realm": [
      {
        "name": "TDP",
        "description": "Trusted Data Provider"
      },
      {
        "name": "TDC",
        "description": "Trusted Data Consumer"
      },
      {
        "name": "CCRP",
        "description": "Contract Compliance and Regulatory Party"
      }
    ]
  }
}
```

### 4.4 OAuth 2.0 and OpenID Connect
- **OAuth 2.0** is an authorization framework that enables applications to obtain limited access to user accounts on HTTP services.
- **OpenID Connect** is an authentication layer built on top of OAuth 2.0 that provides identity verification.

**OAuth 2.0 Flow:**
1. **Authorization Request:** Client redirects user to authorization server.
2. **User Consent:** User grants permission to the application.
3. **Authorization Code:** Server returns an authorization code to the client.
4. **Token Exchange:** Client exchanges code for access token.
5. **Resource Access:** Client uses access token to access protected resources.

**Example OAuth 2.0 Implementation:**
```javascript
// Authorization URL
const authUrl = `https://keycloak.example.com/auth/realms/contract-management/protocol/openid-connect/auth?client_id=contract-management-frontend&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid`;

// Token exchange
const tokenResponse = await fetch('https://keycloak.example.com/auth/realms/contract-management/protocol/openid-connect/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=authorization_code&client_id=contract-management-frontend&code=${code}&redirect_uri=${redirectUri}`
});
```

### 4.5 User Management
- **User Registration:** Self-service registration with email verification.
- **User Profiles:** Customizable user attributes and profile information.
- **Password Policies:** Configurable password strength requirements.
- **Account Lockout:** Protection against brute force attacks.

**Example User Creation:**
```javascript
const createUser = async (userData) => {
  const response = await fetch('https://keycloak.example.com/auth/admin/realms/contract-management/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: userData.email,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      enabled: true,
      emailVerified: false,
      credentials: [{
        type: 'password',
        value: userData.password,
        temporary: false
      }],
      groups: [userData.partyType]
    })
  });
  return response.json();
};
```

### 4.6 Role-Based Access Control (RBAC)
- **Roles:** Named collections of permissions that can be assigned to users.
- **Groups:** Collections of users that can be assigned roles.
- **Permissions:** Fine-grained access control to specific resources or actions.

**Example Role Assignment:**
```javascript
const assignRole = async (userId, roleName) => {
  const role = await getRoleByName(roleName);
  await fetch(`https://keycloak.example.com/auth/admin/realms/contract-management/users/${userId}/role-mappings/realm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([role])
  });
};
```

### 4.7 Integration with Applications
- **Frontend Integration:** JavaScript adapters for single-page applications.
- **Backend Integration:** Server-side libraries for API protection.
- **Token Validation:** Verifying JWT tokens and extracting user information.

**Example Token Validation:**
```javascript
const validateToken = async (token) => {
  const response = await fetch('https://keycloak.example.com/auth/realms/contract-management/protocol/openid-connect/userinfo', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    const userInfo = await response.json();
    return {
      valid: true,
      user: userInfo
    };
  }
  
  return { valid: false };
};
```

### 4.8 Security Best Practices
- **HTTPS Only:** Always use HTTPS for all Keycloak communications.
- **Token Expiration:** Set appropriate token lifetimes.
- **Refresh Tokens:** Use refresh tokens for long-lived sessions.
- **Logout:** Implement proper logout to invalidate tokens.
- **Audit Logging:** Enable audit logging for security monitoring.

### 4.9 Real-World Use Cases
- **Enterprise SSO:** Single sign-on across multiple business applications.
- **API Protection:** Securing REST APIs with OAuth 2.0 tokens.
- **Multi-Tenant Applications:** Managing users across different organizations.
- **Social Login:** Integration with Google, Facebook, LinkedIn, etc.

### 4.10 Monitoring and Maintenance
- **Health Checks:** Monitor Keycloak service availability.
- **Performance Metrics:** Track response times and resource usage.
- **User Analytics:** Monitor login patterns and user behavior.
- **Backup and Recovery:** Regular backups of realm configurations and user data.

---

## References (IAM & Keycloak)

- Keycloak Official Documentation: https://www.keycloak.org/documentation
- OAuth 2.0 RFC 6749: https://tools.ietf.org/html/rfc6749
- OpenID Connect Core 1.0: https://openid.net/specs/openid-connect-core-1_0.html
- SAML 2.0 Specification: https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html
- JWT RFC 7519: https://tools.ietf.org/html/rfc7519
- NIST Digital Identity Guidelines: https://pages.nist.gov/800-63-3/
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- Keycloak GitHub Repository: https://github.com/keycloak/keycloak
- Keycloak Community: https://www.keycloak.org/community
- Identity Management Best Practices: https://www.gartner.com/en/documents/3991077

---

## 5. Security

### 5.1 Security Fundamentals
Security in software systems encompasses protecting data, applications, and infrastructure from unauthorized access, use, disclosure, disruption, modification, or destruction. It involves implementing multiple layers of protection to create a defense-in-depth strategy.

**Key Security Principles:**
- **Confidentiality:** Ensuring that information is accessible only to those authorized to have access.
- **Integrity:** Maintaining and assuring the accuracy and completeness of data.
- **Availability:** Ensuring that authorized users have access to information when needed.
- **Authentication:** Verifying the identity of users, systems, or applications.
- **Authorization:** Determining what resources users can access and what actions they can perform.

### 5.2 OWASP Top 10 Security Risks
The OWASP Top 10 is a standard awareness document for developers and web application security. It represents a broad consensus about the most critical security risks to web applications.

**Current OWASP Top 10 (2021):**
1. **Broken Access Control:** Restrictions on what authenticated users are allowed to do.
2. **Cryptographic Failures:** Failures related to cryptography which often lead to exposure of sensitive data.
3. **Injection:** Untrusted data is sent to an interpreter as part of a command or query.
4. **Insecure Design:** Risks related to design and architectural flaws.
5. **Security Misconfiguration:** Incorrectly configured permissions, cloud services, etc.
6. **Vulnerable and Outdated Components:** Using components with known vulnerabilities.
7. **Authentication and Identification Failures:** Incorrectly implemented authentication functions.
8. **Software and Data Integrity Failures:** Software and data integrity failures relate to code and infrastructure that is not protected from integrity violations.
9. **Security Logging and Monitoring Failures:** Failures to detect, escalate, and respond to active breaches.
10. **Server-Side Request Forgery (SSRF):** SSRF flaws occur when a web application fetches a remote resource without validating the user-supplied URL.

### 5.3 Input Validation and Sanitization
Input validation ensures that only properly formatted data enters the application, while sanitization removes or encodes potentially dangerous characters.

**Example Input Validation:**
```javascript
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const sanitizeInput = (input) => {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
};
```

### 5.4 SQL Injection Prevention
SQL injection occurs when untrusted data is used in database queries without proper validation or parameterization.

**Vulnerable Code:**
```javascript
// DON'T DO THIS
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
```

**Secure Code:**
```javascript
// DO THIS - Use parameterized queries
const query = 'SELECT * FROM users WHERE email = ?';
const result = await sequelize.query(query, {
  replacements: [userInput],
  type: sequelize.QueryTypes.SELECT
});

// Or use Sequelize models
const user = await User.findOne({
  where: { email: userInput }
});
```

### 5.5 Cross-Site Scripting (XSS) Prevention
XSS attacks inject malicious scripts into web pages viewed by other users.

**Types of XSS:**
- **Reflected XSS:** Malicious script is reflected off the web server.
- **Stored XSS:** Malicious script is stored in the database.
- **DOM-based XSS:** Malicious script modifies the DOM environment.

**Prevention Techniques:**
```javascript
// Content Security Policy (CSP)
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  next();
});

// Input sanitization
const sanitizeHtml = require('sanitize-html');
const cleanHtml = sanitizeHtml(userInput, {
  allowedTags: ['b', 'i', 'em', 'strong', 'a'],
  allowedAttributes: { 'a': ['href'] }
});

// Output encoding
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};
```

### 5.6 Authentication Security
Strong authentication mechanisms are crucial for protecting user accounts and sensitive data.

**Password Security:**
```javascript
const bcrypt = require('bcryptjs');

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Password validation
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
};
```

**JWT Security:**
```javascript
const jwt = require('jsonwebtoken');

// Generate token with expiration
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Token refresh
const refreshToken = (token) => {
  const decoded = jwt.decode(token);
  if (decoded && decoded.exp > Date.now() / 1000) {
    return generateToken(decoded.userId, decoded.role);
  }
  throw new Error('Token cannot be refreshed');
};
```

### 5.7 Authorization and Access Control
Authorization determines what resources users can access and what actions they can perform.

**Role-Based Access Control (RBAC):**
```javascript
const checkPermission = (user, resource, action) => {
  const permissions = {
    'TDP': ['read:own_contracts', 'write:own_contracts', 'read:own_datasets'],
    'TDC': ['read:available_contracts', 'write:own_contracts'],
    'CCRP': ['read:all_contracts', 'write:contract_approvals']
  };
  
  const userPermissions = permissions[user.role] || [];
  const requiredPermission = `${action}:${resource}`;
  
  return userPermissions.includes(requiredPermission);
};

// Middleware for route protection
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!checkPermission(req.user, resource, action)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### 5.8 HTTPS and Transport Security
HTTPS encrypts data in transit, preventing man-in-the-middle attacks and data interception.

**HTTPS Configuration:**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem'),
  ca: fs.readFileSync('path/to/ca-bundle.crt')
};

https.createServer(options, app).listen(443);
```

**Security Headers:**
```javascript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
});
```

### 5.9 Rate Limiting and DDoS Protection
Rate limiting prevents abuse by limiting the number of requests per user or IP address.

**Rate Limiting Implementation:**
```javascript
const rateLimit = require('express-rate-limit');

// General rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Specific endpoint rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/auth/login', authLimiter);
```

### 5.10 Security Monitoring and Logging
Comprehensive logging and monitoring help detect and respond to security incidents.

**Security Logging:**
```javascript
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

// Log security events
const logSecurityEvent = (event, details) => {
  securityLogger.info({
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
};

// Log failed login attempts
app.post('/api/auth/login', async (req, res) => {
  try {
    // Authentication logic
    if (!authenticated) {
      logSecurityEvent('failed_login', { email: req.body.email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    logSecurityEvent('login_error', { error: error.message });
  }
});
```

### 5.11 Security Testing
Regular security testing helps identify vulnerabilities before they can be exploited.

**Types of Security Testing:**
- **Static Application Security Testing (SAST):** Analyzing source code for vulnerabilities.
- **Dynamic Application Security Testing (DAST):** Testing running applications for vulnerabilities.
- **Penetration Testing:** Simulating real-world attacks to identify security weaknesses.
- **Vulnerability Scanning:** Automated scanning for known vulnerabilities.

**Example Security Test:**
```javascript
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: maliciousInput,
        password: 'Password123'
      });
    
    expect(response.status).toBe(400);
  });
  
  it('should prevent XSS attacks', async () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    
    const response = await request(app)
      .post('/api/contracts')
      .send({
        termsAndConditions: maliciousInput
      });
    
    // Should sanitize input or reject it
    expect(response.status).toBe(400);
  });
});
```

### 5.12 Incident Response
Having a plan for responding to security incidents is crucial for minimizing damage and recovery time.

**Incident Response Plan:**
1. **Detection:** Identify and confirm security incidents.
2. **Analysis:** Assess the scope and impact of the incident.
3. **Containment:** Isolate affected systems to prevent further damage.
4. **Eradication:** Remove the threat from the environment.
5. **Recovery:** Restore systems to normal operation.
6. **Lessons Learned:** Document lessons and improve security measures.

---

## References (Security)

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- NIST Digital Identity Guidelines: https://pages.nist.gov/800-63-3/
- OWASP Application Security Verification Standard: https://owasp.org/www-project-application-security-verification-standard/
- SANS Top 20 Critical Security Controls: https://www.sans.org/top20/
- CWE/SANS Top 25 Most Dangerous Software Weaknesses: https://cwe.mitre.org/top25/
- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- Security Headers: https://securityheaders.com/
- Content Security Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- JWT Security Best Practices: https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/
- Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- SQL Injection Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

---

## 6. Testing

### 6.1 Testing Fundamentals
Testing is a systematic process of evaluating software to ensure it meets specified requirements and works as expected. It helps identify defects, verify functionality, and ensure quality throughout the development lifecycle.

**Testing Principles:**
- **Early Testing:** Start testing as early as possible in the development cycle.
- **Defect Clustering:** Most defects are found in a small number of modules.
- **Pesticide Paradox:** Running the same tests repeatedly will eventually stop finding new defects.
- **Absence of Errors Fallacy:** Finding and fixing defects doesn't help if the system doesn't meet user needs.
- **Testing is Context Dependent:** Testing approaches depend on the context of the software being developed.

**Testing Levels:**
1. **Unit Testing:** Testing individual components in isolation.
2. **Integration Testing:** Testing the interaction between components.
3. **System Testing:** Testing the complete system as a whole.
4. **Acceptance Testing:** Testing to determine if the system meets business requirements.

### 6.2 Unit Testing
Unit testing focuses on testing individual functions, methods, or classes in isolation. It's the foundation of a robust testing strategy.

**Unit Testing Best Practices:**
- Test one thing at a time
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern
- Keep tests independent and isolated
- Test both happy path and edge cases

**Example Unit Tests:**
```javascript
// User model unit tests
describe('User Model', () => {
  beforeEach(async () => {
    await User.sync({ force: true });
  });

  describe('Validation', () => {
    it('should create a valid user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        role: 'TDP',
        organization: 'Test Org'
      };

      const user = await User.create(userData);
      
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.organization).toBe(userData.organization);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should require email', async () => {
      const userData = {
        password: 'Password123!',
        role: 'TDP'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require unique email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        role: 'TDP'
      };

      await User.create(userData);
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const password = 'Password123!';
      const user = await User.create({
        email: 'test@example.com',
        password,
        role: 'TDP'
      });

      expect(user.password).not.toBe(password);
      expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/);
    });

    it('should verify password correctly', async () => {
      const password = 'Password123!';
      const user = await User.create({
        email: 'test@example.com',
        password,
        role: 'TDP'
      });

      const isValid = await user.verifyPassword(password);
      expect(isValid).toBe(true);
    });
  });
});
```

**Service Layer Unit Tests:**
```javascript
// DID service unit tests
describe('DID Service', () => {
  let didService;
  let mockAxios;

  beforeEach(() => {
    mockAxios = {
      get: jest.fn(),
      post: jest.fn()
    };
    didService = new DIDService();
    didService.axios = mockAxios;
  });

  describe('fetchPublicKey', () => {
    it('should fetch public key from DID document', async () => {
      const did = 'did:web:example.com:user:123';
      const mockResponse = {
        data: {
          verificationMethod: [{
            id: `${did}#key-1`,
            type: 'Ed25519VerificationKey2020',
            publicKeyJwk: {
              kty: 'OKP',
              crv: 'Ed25519',
              x: 'test-public-key'
            }
          }]
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await didService.fetchPublicKey(did);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://example.com/.well-known/did.json'
      );
      expect(result).toBe('test-public-key');
    });

    it('should handle DID resolution errors', async () => {
      const did = 'did:web:invalid.com:user:123';
      mockAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(didService.fetchPublicKey(did)).rejects.toThrow('Network error');
    });

    it('should handle missing verification method', async () => {
      const did = 'did:web:example.com:user:123';
      const mockResponse = {
        data: {
          verificationMethod: []
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      await expect(didService.fetchPublicKey(did)).rejects.toThrow('No verification method found');
    });
  });
});
```

### 6.3 Integration Testing
Integration testing verifies that different components work together correctly. It focuses on the interfaces between components and their interactions.

**API Integration Tests:**
```javascript
// Contract API integration tests
describe('Contract API Integration', () => {
  let server;
  let authToken;

  beforeAll(async () => {
    server = app.listen(0);
    const port = server.address().port;
    baseURL = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
    
    // Create test user and get auth token
    const user = await User.create({
      email: 'test@example.com',
      password: 'Password123!',
      role: 'TDP'
    });
    
    const response = await request(baseURL)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });
    
    authToken = response.body.token;
  });

  describe('POST /api/contracts', () => {
    it('should create a new contract', async () => {
      const contractData = {
        title: 'Test Contract',
        description: 'Test Description',
        termsAndConditions: 'Test Terms',
        datasetId: 1
      };

      const response = await request(baseURL)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(contractData.title);
      expect(response.body.status).toBe('DRAFT');
      expect(response.body.createdBy).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(baseURL)
        .post('/api/contracts')
        .send({ title: 'Test Contract' });

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await request(baseURL)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/contracts', () => {
    beforeEach(async () => {
      // Create test contracts
      await Contract.bulkCreate([
        {
          title: 'Contract 1',
          description: 'Description 1',
          termsAndConditions: 'Terms 1',
          status: 'DRAFT',
          createdBy: 1
        },
        {
          title: 'Contract 2',
          description: 'Description 2',
          termsAndConditions: 'Terms 2',
          status: 'ACTIVE',
          createdBy: 1
        }
      ]);
    });

    it('should return contracts for authenticated user', async () => {
      const response = await request(baseURL)
        .get('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBeDefined();
    });

    it('should filter contracts by status', async () => {
      const response = await request(baseURL)
        .get('/api/contracts?status=DRAFT')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('DRAFT');
    });
  });
});
```

### 6.4 End-to-End Testing
End-to-end testing verifies that the entire application works correctly from the user's perspective. It tests complete user workflows.

**E2E Test Example:**
```javascript
// Contract creation workflow E2E test
describe('Contract Creation Workflow', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });

  afterEach(async () => {
    await page.close();
  });

  it('should create a contract successfully', async () => {
    // Login
    await page.click('[data-testid="login-button"]');
    await page.type('[data-testid="email-input"]', 'test@example.com');
    await page.type('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="submit-login"]');
    
    await page.waitForSelector('[data-testid="dashboard"]');

    // Navigate to create contract
    await page.click('[data-testid="create-contract-button"]');
    await page.waitForSelector('[data-testid="contract-form"]');

    // Fill contract form
    await page.type('[data-testid="contract-title"]', 'Test Contract');
    await page.type('[data-testid="contract-description"]', 'Test Description');
    await page.type('[data-testid="contract-terms"]', 'Test Terms and Conditions');
    
    // Select dataset
    await page.select('[data-testid="dataset-select"]', '1');
    
    // Submit form
    await page.click('[data-testid="submit-contract"]');
    
    // Verify success
    await page.waitForSelector('[data-testid="success-message"]');
    const successMessage = await page.$eval(
      '[data-testid="success-message"]',
      el => el.textContent
    );
    
    expect(successMessage).toContain('Contract created successfully');
  });

  it('should handle form validation errors', async () => {
    // Login and navigate to create contract
    await page.click('[data-testid="login-button"]');
    await page.type('[data-testid="email-input"]', 'test@example.com');
    await page.type('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="submit-login"]');
    
    await page.waitForSelector('[data-testid="dashboard"]');
    await page.click('[data-testid="create-contract-button"]');
    await page.waitForSelector('[data-testid="contract-form"]');

    // Submit empty form
    await page.click('[data-testid="submit-contract"]');
    
    // Verify validation errors
    await page.waitForSelector('[data-testid="error-message"]');
    const errorMessage = await page.$eval(
      '[data-testid="error-message"]',
      el => el.textContent
    );
    
    expect(errorMessage).toContain('Title is required');
  });
});
```

### 6.5 Test-Driven Development (TDD)
TDD is a development methodology where tests are written before the actual code. It follows the Red-Green-Refactor cycle.

**TDD Example:**
```javascript
// Step 1: Write failing test (Red)
describe('Contract Signature Verification', () => {
  it('should verify valid signature', () => {
    const contract = {
      id: 1,
      termsAndConditions: 'Test terms',
      hash: 'abc123'
    };
    
    const signature = 'valid-signature';
    const publicKey = 'user-public-key';
    
    const result = verifyContractSignature(contract, signature, publicKey);
    
    expect(result).toBe(true);
  });
});

// Step 2: Write minimal code to pass test (Green)
const verifyContractSignature = (contract, signature, publicKey) => {
  // Minimal implementation to make test pass
  return true;
};

// Step 3: Refactor code (Refactor)
const verifyContractSignature = (contract, signature, publicKey) => {
  try {
    const message = `${contract.id}:${contract.hash}`;
    const signatureBuffer = Buffer.from(signature, 'base64');
    const publicKeyBuffer = Buffer.from(publicKey, 'base64');
    
    return crypto.verify(
      'sha256',
      Buffer.from(message),
      publicKeyBuffer,
      signatureBuffer
    );
  } catch (error) {
    return false;
  }
};
```

### 6.6 Performance Testing
Performance testing evaluates how the system performs under various conditions, including load, stress, and scalability testing.

**Load Testing Example:**
```javascript
// Load testing with Artillery
const loadTestConfig = {
  config: {
    target: 'http://localhost:5001',
    phases: [
      { duration: 60, arrivalRate: 10 }, // Ramp up
      { duration: 300, arrivalRate: 50 }, // Sustained load
      { duration: 60, arrivalRate: 100 }  // Peak load
    ]
  },
  scenarios: [
    {
      name: 'Contract API Load Test',
      weight: 1,
      flow: [
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: 'test@example.com',
              password: 'Password123!'
            }
          }
        },
        {
          get: {
            url: '/api/contracts'
          }
        },
        {
          post: {
            url: '/api/contracts',
            json: {
              title: 'Load Test Contract',
              description: 'Test Description',
              termsAndConditions: 'Test Terms'
            }
          }
        }
      ]
    }
  ]
};
```

### 6.7 Security Testing
Security testing identifies vulnerabilities and ensures the application is secure against various attacks.

**Security Test Examples:**
```javascript
describe('Security Tests', () => {
  it('should prevent SQL injection in contract search', async () => {
    const maliciousQuery = "'; DROP TABLE contracts; --";
    
    const response = await request(app)
      .get(`/api/contracts?search=${encodeURIComponent(maliciousQuery)}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    // Should not crash and should return empty results
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should prevent XSS in contract creation', async () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    
    const response = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: maliciousInput,
        description: 'Test Description',
        termsAndConditions: 'Test Terms'
      });
    
    // Should sanitize input or reject it
    expect(response.status).toBe(400);
  });

  it('should enforce authentication on protected routes', async () => {
    const response = await request(app)
      .get('/api/contracts');
    
    expect(response.status).toBe(401);
  });

  it('should enforce authorization based on user role', async () => {
    // Create user with limited role
    const limitedUser = await User.create({
      email: 'limited@example.com',
      password: 'Password123!',
      role: 'TDC'
    });
    
    const limitedToken = jwt.sign(
      { userId: limitedUser.id, role: limitedUser.role },
      process.env.JWT_SECRET
    );
    
    // Try to access admin-only endpoint
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${limitedToken}`);
    
    expect(response.status).toBe(403);
  });
});
```

### 6.8 Test Automation and CI/CD
Automated testing integrated into the CI/CD pipeline ensures code quality and prevents regressions.

**GitHub Actions Example:**
```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd backend && npm ci
        cd ../frontend && npm ci
    
    - name: Run backend tests
      run: |
        cd backend
        npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        JWT_SECRET: test-secret
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false
    
    - name: Run E2E tests
      run: |
        npm run test:e2e
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        JWT_SECRET: test-secret
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### 6.9 Test Data Management
Proper test data management ensures tests are reliable and maintainable.

**Test Data Factory:**
```javascript
// Test data factory
class TestDataFactory {
  static createUser(overrides = {}) {
    return {
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'TDP',
      organization: 'Test Organization',
      ...overrides
    };
  }

  static createContract(overrides = {}) {
    return {
      title: `Test Contract ${Date.now()}`,
      description: 'Test Description',
      termsAndConditions: 'Test Terms and Conditions',
      status: 'DRAFT',
      ...overrides
    };
  }

  static createDataset(overrides = {}) {
    return {
      name: `Test Dataset ${Date.now()}`,
      description: 'Test Dataset Description',
      dataType: 'STRUCTURED',
      ...overrides
    };
  }
}

// Test database setup
const setupTestDatabase = async () => {
  await sequelize.sync({ force: true });
  
  // Create test users
  const users = await Promise.all([
    User.create(TestDataFactory.createUser({ role: 'TDP' })),
    User.create(TestDataFactory.createUser({ role: 'TDC' })),
    User.create(TestDataFactory.createUser({ role: 'CCRP' }))
  ]);
  
  // Create test datasets
  const datasets = await Promise.all([
    Dataset.create(TestDataFactory.createDataset()),
    Dataset.create(TestDataFactory.createDataset())
  ]);
  
  return { users, datasets };
};
```

---

## References (Testing)

- Jest Testing Framework: https://jestjs.io/
- Supertest for API Testing: https://github.com/visionmedia/supertest
- Puppeteer for E2E Testing: https://pptr.dev/
- Playwright for E2E Testing: https://playwright.dev/
- Artillery for Load Testing: https://www.artillery.io/
- Test-Driven Development: https://en.wikipedia.org/wiki/Test-driven_development
- Testing Pyramid: https://martinfowler.com/articles/practical-test-pyramid.html
- Behavior-Driven Development: https://cucumber.io/docs/bdd/
- Test Coverage: https://en.wikipedia.org/wiki/Code_coverage
- Continuous Integration: https://en.wikipedia.org/wiki/Continuous_integration
- GitHub Actions: https://docs.github.com/en/actions
- Testing Best Practices: https://github.com/goldbergyoni/javascript-testing-best-practices
- API Testing Guide: https://www.postman.com/collection/guide-to-api-testing/
- Performance Testing Guide: https://k6.io/docs/testing-guides/
- Security Testing Guide: https://owasp.org/www-project-web-security-testing-guide/

---

## 7. Architecture Diagrams and Advanced Technical Concepts

### 7.1 System Architecture Overview
The diagram below illustrates how the Contract Management System components interact across tiers—from the client browser through the backend and identity provider to the blockchain network.

```mermaid
graph TD
    subgraph ClientTier
        A[Browser-SPA]
    end
    subgraph EdgeTier
        B[NGINX-Proxy]
    end
    subgraph AppTier
        C[ReactFrontend]
        D[ExpressBackend]
    end
    subgraph Services
        E[KeycloakIAM]
        F[PostgreSQLDB]
        G[BlockchainNode]
    end
    A --> B --> C
    C -->|HTTPS / REST| D
    D --> F
    D --> E
    D --> G
```

*Key Points*
1. **Zero-Trust Edge** – All traffic terminates at the reverse proxy where HTTPS is enforced.
2. **Stateless Frontend** – React bundles are served over CDN / edge cache for scalability.
3. **Backend Orchestration** – Express coordinates persistence, IAM, and optional blockchain calls.
4. **Decoupled Services** – Each service (DB, IAM, Blockchain) can scale independently.

---

### 7.2 Backend Request Flow
A sequence diagram that follows a typical "Create Contract" request from the user interface down to the blockchain.

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant API as Express API
    participant Service
    participant DB as PostgreSQL
    participant BC as Blockchain

    User->>UI: Click "Create Contract"
    UI->>API: POST /api/contracts
    API->>Service: Validate & process
    Service->>DB: Begin TX & persist
    Service-->>BC: Store on-chain hash (optional)
    BC-->>Service: Tx receipt
    Service-->>DB: Commit TX
    API-->>UI: 201 Created + contractId
```

*Highlights*
- **Transactional Consistency** – Database commit only after blockchain confirmation to prevent orphaned records.
- **Service Layer** – Centralizes business rules (pricing, role checks, notifications).
- **Scalable I/O** – Non-blocking I/O in Node.js handles high concurrency.

---

### 7.3 Frontend Component Architecture
The component tree shows React's modular structure, emphasising separation of concerns.

```mermaid
graph LR
    App --> Layout
    Layout --> Header
    Layout --> Sidebar
    Layout --> Router
    Router --> Dashboard
    Router --> Contracts
    Router --> ContractDetail
    Router --> Datasets
    Router --> Notifications
    Router --> UserRegistration
```

*Design Notes*
- **Presentational vs Container Components** – UI-focused components are isolated from data-fetching logic.
- **Lazy Loading** – Routes are code-split to improve initial load times.
- **Context Providers** – Global state (auth token, theme) is injected at `App` level.

---

### 7.4 IAM Authentication Flow
OpenID Connect (OIDC) authorization-code flow implemented with Keycloak.

```mermaid
sequenceDiagram
    participant User
    participant UI as SPA
    participant KC as Keycloak
    participant API as Backend

    User->>UI: Enter credentials
    UI->>KC: OIDC AuthN Request
    KC-->>UI: AuthZ Code
    UI->>KC: Code + Client Secret
    KC-->>UI: ID & Access Tokens
    UI->>API: Bearer ACCESS_TOKEN
    API->>KC: Introspect_JWKS
    KC-->>API: Token valid
    API-->>UI: Protected resource
```

*Security Considerations*
- **Short-Lived Tokens** – Access tokens expire quickly; refresh tokens renew sessions without re-authentication.
- **Spectre Mitigation** – Tokens stored in memory (not localStorage) to minimise XSS impact.

---

### 7.5 Contract Signing Lifecycle
The high-level workflow covering draft creation, multi-party signatures, and activation.

```mermaid
sequenceDiagram
    participant TDP as Trusted Data Provider
    participant Backend
    participant BC as Blockchain
    participant CCRP as Contract Counterparty

    TDP->>Backend: Submit draft
    Backend->>BC: Record hash + metadata
    BC-->>Backend: Tx receipt
    Backend-->>TDP: Draft ID

    CCRP->>Backend: Review & sign
    Backend->>BC: Append CCRP signature
    BC-->>Backend: Confirmed block
    Backend-->>CCRP: Contract active
```

*Lifecycle States*
1. **DRAFT** – Editable by creator.
2. **PENDING_SIGNATURES** – Waiting for counterparty.
3. **ACTIVE** – Fully signed and enforceable.
4. **ARCHIVED** – Immutable record retained for audit.

---

### 7.6 Defense-in-Depth Security Layers

```mermaid
graph LR
    A[Network Firewall] --> B[HTTPS / TLS]
    B --> C[Keycloak IAM]
    C --> D[API Input Validation]
    D --> E[Business Authorization]
    E --> F[Encrypted Storage]
    F --> G[Monitoring & Alerting]
```

*Layered Approach*
- **Perimeter Guard** – Only ports 443/80 exposed.
- **Strong Identity** – Centralised IAM enforces MFA & RBAC.
- **Sanitisation & Validation** – Prevents injection attacks at earliest point.
- **Observability** – Structured logs feed SIEM for anomaly detection.

---

### 7.7 Testing Pyramid & Quality Gates

```mermaid
graph TD
    %% Testing pyramid
    subgraph Pyramid
        UT[UnitTests] --> IT[IntegrationTests] --> E2E[E2ETests]
    end
    %% Continuous quality checks
    subgraph Quality
        LINT[StaticAnalysis] --> COV[Coverage] --> PERF[Performance] --> SEC[SecurityScans]
    end
    E2E --> LINT
```

*Guidelines*
- **Broad Base** – Fast unit tests catch regressions early.
- **Middle Layer** – Integration tests validate service contracts.
- **Thin Top** – E2E focuses on critical user journeys only.

---

### 7.8 CI/CD Pipeline Overview

```mermaid
graph LR
    Code[Git Push] --> CI[GitHub Actions]
    CI --> TestSuite[Automated Tests]
    TestSuite --> Build[Docker Build & Tag]
    Build --> Scan[Security Scan / SCA]
    Scan --> Registry[OCI Registry]
    Registry --> Deploy[Helm / Terraform]
    Deploy --> K8s[Kubernetes Cluster]
```

*Pipeline Stages*
1. **Continuous Integration** – Every commit triggers the unified test suite and static checks.
2. **Immutable Artifacts** – Docker images are versioned and signed.
3. **Policy-As-Code** – Terraform plans reviewed via pull requests before apply.
4. **Progressive Delivery** – Canary or blue/green strategies minimise downtime.

---

## 8. DevSecOps & Continuous Security

DevSecOps integrates security practices at every phase of the software delivery lifecycle—**from code to cloud**—turning security into a shared responsibility across development, operations, and security teams.

### 8.1 Shift-Left Security Principles
1. **Early Detection** – Identify vulnerabilities during coding and build stages, when fixes are cheapest.
2. **Automated Enforcement** – Embed security controls in CI/CD pipelines rather than manual gates.
3. **Continuous Feedback** – Provide actionable insights to developers within minutes of a commit.
4. **Reproducibility** – Infrastructure and policies versioned in code, auditable and repeatable.

### 8.2 DevSecOps Toolchain

```mermaid
graph LR
    SRC[SourceCode] --> SAST[SAST_CodeQL]
    SRC --> SCA[DepScan_Snyk]
    SAST --> TESTS[UnitIntegrationTests]
    SCA --> TESTS
    TESTS --> BUILD[ContainerBuild]
    BUILD --> IMGSCAN[ImageScan_Trivy]
    IMGSCAN --> IAC[IaCScan_tfsec]
    IAC --> POLICY[OPA_Policy]
    POLICY --> DEPLOY[K8sDeploy]
    DEPLOY --> RUNTIME[RuntimeSec_Falco]
```

*Highlights*
- **Static Application Security Testing (SAST)** – CodeQL runs on every PR; blocks merges on high-severity findings.
- **Software Composition Analysis (SCA)** – Dependency scanning prevents known-vulnerable packages from entering the build.
- **Container Image Scanning** – Trivy checks OS packages and language deps; fails pipeline on CVSS ≥7.
- **Infrastructure as Code (IaC) Scanning** – tfsec validates Terraform against CIS benchmarks.
- **Policy-as-Code** – OPA Gatekeeper enforces Kubernetes admission control (e.g., no privileged pods).
- **Runtime Threat Detection** – Falco watches syscalls for crypto-miners, reverse shells.

### 8.3 Security Gates & Quality Thresholds
| Pipeline Stage              | Tool           | Blocking Condition                       |
|-----------------------------|----------------|-----------------------------------------|
| SAST                        | CodeQL         | `severity: error` findings               |
| Dependency Scan             | Snyk           | CVSS ≥ 7                                 |
| Container Scan              | Trivy          | Critical vulnerabilities                 |
| IaC Scan                    | tfsec          | High-severity rule failures              |
| Unit Test Coverage          | Jest           | < 90 % blocks merge                      |
| License Compliance          | OSS Review     | Non-approved licenses                    |

### 8.4 Secrets Management
- **Pre-Commit Hooks** (`git-secrets`, `detect-secrets`) to detect keys before pushing.  
- **Vault-Backed CI** – GitHub OIDC → HashiCorp Vault issues short-lived tokens at build time.  
- **Kubernetes Secrets** – SealedSecrets or External Secrets Operator decrypt at runtime only inside cluster.

### 8.5 Continuous Compliance & Audit
- **Automated Evidence Collection** – Pipeline artifacts (scan reports) stored in immutable S3 bucket for auditors.
- **Compliance as Code** – Regula / InSpec profiles validate AWS, Kubernetes, and Terraform against SOC2, ISO 27001.
- **Attestation & SBOM** – Cosign signs images; SPDX SBOM embedded for supply-chain transparency.

---

*Next: 9. Deployment, Observability, and Scalability sections will be added in upcoming revisions.* 