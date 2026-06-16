/**
 * Password Protection System for Confidential AI Network marketing website
 * Protects all pages with a secure password gate
 */

class PasswordProtector {
    constructor() {
        // Use config values if available, otherwise use defaults
        this.password = (window.CONFIG && window.CONFIG.SECURITY.PASSWORD) || 'ConfidentialAI2026!';
        this.maxAttempts = (window.CONFIG && window.CONFIG.SECURITY.MAX_ATTEMPTS) || 3;
        this.lockoutDuration = ((window.CONFIG && window.CONFIG.SECURITY.LOCKOUT_DURATION_MINUTES) || 15) * 60 * 1000;
        this.authValidityHours = (window.CONFIG && window.CONFIG.SECURITY.AUTH_VALIDITY_HOURS) || 24;
        this.attempts = 0;
        this.lockoutUntil = 0;
        
        this.init();
    }
    
    init() {
        // Check if user is already authenticated
        if (this.isAuthenticated()) {
            this.showContent();
            return;
        }
        
        // Check if user is locked out
        if (this.isLockedOut()) {
            this.showLockoutMessage();
            return;
        }
        
        // Show password gate
        this.showPasswordGate();
    }
    
    isAuthenticated() {
        const auth = localStorage.getItem('cfp_auth');
        if (!auth) return false;
        
        try {
            const authData = JSON.parse(auth);
            const now = Date.now();
            
            // Check if authentication is still valid (configurable hours)
            if (now - authData.timestamp > this.authValidityHours * 60 * 60 * 1000) {
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
    
    showPasswordGate() {
        // Hide all content
        this.hideContent();
        
        // Create password gate HTML
        const passwordGate = `
            <div id="password-gate" class="password-gate">
                <div class="password-container">
                    <div class="password-logo">
                        <i class="fas fa-file-contract fa-3x text-primary mb-3"></i>
                        <h2 class="text-primary">Confidential AI Network</h2>
                    </div>
                    
                    <div class="password-form">
                        <h4 class="mb-3">Access Required</h4>
                        <p class="text-muted mb-4">This website is password protected. Please enter the password to continue.</p>
                        
                        <div class="mb-3">
                            <input type="password" id="password-input" class="form-control form-control-lg" 
                                   placeholder="Enter password" autocomplete="off">
                        </div>
                        
                        <button type="button" id="submit-password" class="btn btn-primary btn-lg w-100 mb-3">
                            <i class="fas fa-unlock me-2"></i>Access Website
                        </button>
                        
                        <div id="error-message" class="alert alert-danger" style="display: none;">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <span id="error-text"></span>
                        </div>
                        
                        <div class="password-footer">
                            <small class="text-muted">
                                <i class="fas fa-shield-alt me-1"></i>
                                Secure access to Confidential AI Network materials
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert password gate at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', passwordGate);
        
        // Add event listeners
        this.addEventListeners();
        
        // Focus on password input
        document.getElementById('password-input').focus();
    }
    
    addEventListeners() {
        const passwordInput = document.getElementById('password-input');
        const submitButton = document.getElementById('submit-password');
        
        // Submit on Enter key
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkPassword();
            }
        });
        
        // Submit on button click
        submitButton.addEventListener('click', () => {
            this.checkPassword();
        });
        
        // Auto-focus on input
        passwordInput.focus();
    }
    
    checkPassword() {
        const passwordInput = document.getElementById('password-input');
        const inputPassword = passwordInput.value.trim();
        const errorMessage = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        // Check if locked out
        if (this.isLockedOut()) {
            const remainingTime = Math.ceil((this.lockoutUntil - Date.now()) / 1000 / 60);
            errorText.textContent = `Too many failed attempts. Please wait ${remainingTime} minutes before trying again.`;
            errorMessage.style.display = 'block';
            return;
        }
        
        // Check password
        if (inputPassword === this.password) {
            // Success - authenticate user
            this.authenticate();
            this.showContent();
            this.removePasswordGate();
        } else {
            // Failed attempt
            this.attempts++;
            passwordInput.value = '';
            passwordInput.focus();
            
            if (this.attempts >= this.maxAttempts) {
                // Lock out user
                this.lockoutUntil = Date.now() + this.lockoutDuration;
                errorText.textContent = `Too many failed attempts. Please wait 15 minutes before trying again.`;
                errorMessage.style.display = 'block';
            } else {
                const remainingAttempts = this.maxAttempts - this.attempts;
                errorText.textContent = `Incorrect password. ${remainingAttempts} attempts remaining.`;
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
    
    showContent() {
        // Show all content elements
        const elements = document.querySelectorAll('body > *:not(#password-gate)');
        elements.forEach(el => {
            el.style.display = '';
        });
    }
    
    hideContent() {
        // Hide all content elements except password gate
        const elements = document.querySelectorAll('body > *:not(#password-gate)');
        elements.forEach(el => {
            el.style.display = 'none';
        });
    }
    
    removePasswordGate() {
        const passwordGate = document.getElementById('password-gate');
        if (passwordGate) {
            passwordGate.remove();
        }
    }
    
    showLockoutMessage() {
        this.hideContent();
        
        const lockoutMessage = `
            <div id="lockout-message" class="password-gate">
                <div class="password-container">
                    <div class="password-logo">
                        <i class="fas fa-lock fa-3x text-danger mb-3"></i>
                        <h2 class="text-danger">Access Temporarily Blocked</h2>
                    </div>
                    
                    <div class="password-form text-center">
                        <h4 class="mb-3">Too Many Failed Attempts</h4>
                        <p class="text-muted mb-4">
                            Your access has been temporarily blocked due to multiple failed password attempts.
                        </p>
                        
                        <div class="lockout-timer mb-4">
                            <div class="spinner-border text-primary mb-3" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p>Please wait before trying again</p>
                        </div>
                        
                        <div class="password-footer">
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>
                                This is a security measure to protect our content
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', lockoutMessage);
        
        // Auto-refresh after lockout expires
        setTimeout(() => {
            location.reload();
        }, this.lockoutDuration);
    }
    
    // Method to change password (call this to update the password)
    updatePassword(newPassword) {
        this.password = newPassword;
        console.log('Password updated successfully');
    }
    
    // Method to logout user
    logout() {
        localStorage.removeItem('cfp_auth');
        location.reload();
    }
}

// Initialize password protection when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.passwordProtector = new PasswordProtector();
});

// Add logout functionality to window object
window.logout = function() {
    if (window.passwordProtector) {
        window.passwordProtector.logout();
    }
}; 