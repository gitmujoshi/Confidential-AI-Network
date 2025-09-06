/**
 * Authentication Check for ContractFlow Pro
 * Redirects unauthenticated users to login page
 */

class AuthCheck {
    constructor() {
        this.checkAuth();
    }
    
    checkAuth() {
        // Check if user is authenticated
        if (!this.isAuthenticated()) {
            // Redirect to login page
            this.redirectToLogin();
            return;
        }
        
        // User is authenticated, show logout button
        this.showLogoutButton();
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
    
    redirectToLogin() {
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login.html' && !window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
    
    showLogoutButton() {
        // Add logout button to navigation if it doesn't exist
        const navbar = document.querySelector('.navbar-nav');
        if (navbar && !document.getElementById('logout-btn')) {
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item';
            logoutLi.innerHTML = `
                <button class="btn btn-outline-primary ms-2" id="logout-btn" onclick="logout()">
                    <i class="fas fa-sign-out-alt me-2"></i>Logout
                </button>
            `;
            navbar.appendChild(logoutLi);
        }
    }
    
    // Method to logout
    logout() {
        localStorage.removeItem('cfp_auth');
        window.location.href = 'index.html';
    }
}

// Initialize authentication check when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authCheck = new AuthCheck();
});

// Add logout functionality to window object
window.logout = function() {
    if (window.authCheck) {
        window.authCheck.logout();
    }
};
