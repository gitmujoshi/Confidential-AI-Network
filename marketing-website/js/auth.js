/**
 * Authentication Handler for ContractFlow Pro
 * Clean authentication without exposing site content
 */

class AuthHandler {
    constructor() {
        this.credentials = {
            username: 'admin',
            password: 'ContractFlow2025!'
        };
        
        // Additional user accounts
        this.additionalUsers = {
            'jimm': 'J1mm$tr0ngP@ss2025!'
        };
        this.maxAttempts = 3;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.attempts = 0;
        this.lockoutUntil = 0;
        
        this.init();
    }
    
    init() {
        // Check if already authenticated
        if (this.isAuthenticated()) {
            this.redirectToMainSite();
            return;
        }
        
        // Check if locked out
        if (this.isLockedOut()) {
            this.showLockoutMessage();
            return;
        }
        
        // Add event listeners
        this.addEventListeners();
    }
    
    isAuthenticated() {
        const auth = localStorage.getItem('cfp_auth');
        if (!auth) return false;
        
        try {
            const authData = JSON.parse(auth);
            const now = Date.now();
            
            // Check if authentication is still valid (24 hours)
            if (now - authData.timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('cfp_auth');
                return false;
            }
            
            return authData.authenticated === true;
        } catch (e) {
            localStorage.removeItem('cfp_auth');
            return false;
        }
    }
    
    isLockedOut() {
        const now = Date.now();
        if (now < this.lockoutUntil) {
            return true;
        }
        
        // Reset lockout if expired
        if (this.lockoutUntil > 0 && now >= this.lockoutUntil) {
            this.attempts = 0;
            this.lockoutUntil = 0;
        }
        
        return false;
    }
    
    addEventListeners() {
        const form = document.getElementById('authForm');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Enter key handling
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });
        
        // Auto-focus on username
        usernameInput.focus();
    }
    
    handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const errorMessage = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        // Check if locked out
        if (this.isLockedOut()) {
            const remainingTime = Math.ceil((this.lockoutUntil - Date.now()) / 1000 / 60);
            errorText.textContent = `Too many failed attempts. Please wait ${remainingTime} minutes before trying again.`;
            errorMessage.style.display = 'block';
            return;
        }
        
        // Validate credentials
        if ((username === this.credentials.username && password === this.credentials.password) ||
            (this.additionalUsers[username] && password === this.additionalUsers[username])) {
            // Success - authenticate and redirect
            this.authenticate();
            this.redirectToMainSite();
        } else {
            // Failed attempt
            this.attempts++;
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
            
            if (this.attempts >= this.maxAttempts) {
                // Lock out user
                this.lockoutUntil = Date.now() + this.lockoutDuration;
                errorText.textContent = `Too many failed attempts. Please wait 15 minutes before trying again.`;
                errorMessage.style.display = 'block';
            } else {
                const remainingAttempts = this.maxAttempts - this.attempts;
                errorText.textContent = `Invalid credentials. ${remainingAttempts} attempts remaining.`;
                errorMessage.style.display = 'block';
            }
        }
    }
    
    authenticate() {
        const authData = {
            authenticated: true,
            timestamp: Date.now()
        };
        localStorage.setItem('cfp_auth', JSON.stringify(authData));
    }
    
    redirectToMainSite() {
        // Redirect to the main site after successful authentication
        window.location.href = 'index.html';
    }
    
    showLockoutMessage() {
        const authForm = document.getElementById('authForm');
        const errorMessage = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        // Hide the form
        authForm.style.display = 'none';
        
        // Show lockout message
        errorText.textContent = 'Access temporarily blocked due to multiple failed attempts. Please wait 15 minutes before trying again.';
        errorMessage.style.display = 'block';
        errorMessage.className = 'alert alert-warning';
        
        // Auto-refresh after lockout expires
        setTimeout(() => {
            location.reload();
        }, this.lockoutDuration);
    }
    
    // Method to update credentials
    updateCredentials(newUsername, newPassword) {
        this.credentials.username = newUsername;
        this.credentials.password = newPassword;
        console.log('Credentials updated successfully');
    }
    
    // Method to add new user
    addUser(username, password) {
        this.additionalUsers[username] = password;
        console.log(`User ${username} added successfully`);
    }
    
    // Method to remove user
    removeUser(username) {
        if (this.additionalUsers[username]) {
            delete this.additionalUsers[username];
            console.log(`User ${username} removed successfully`);
        }
    }
    
    // Method to logout
    logout() {
        localStorage.removeItem('cfp_auth');
        window.location.href = 'login.html';
    }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authHandler = new AuthHandler();
});

// Add logout functionality to window object
window.logout = function() {
    if (window.authHandler) {
        window.authHandler.logout();
    }
};
