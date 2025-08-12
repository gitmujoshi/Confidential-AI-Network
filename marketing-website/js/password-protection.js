// Password Protection Script
// Access codes - you can modify these
const validPasswords = [
    'contractflow2024',
    'ai-training',
    'demo-access',
    'enterprise'
];

// Check if user is already authenticated
const isAuthenticated = sessionStorage.getItem('contractflow_authenticated');

if (isAuthenticated) {
    // User is already authenticated, show content
    const overlay = document.getElementById('passwordOverlay');
    const mainContent = document.getElementById('mainContent');
    if (overlay) overlay.style.display = 'none';
    if (mainContent) mainContent.classList.add('visible');
} else {
    // Show password overlay
    const overlay = document.getElementById('passwordOverlay');
    if (overlay) overlay.style.display = 'flex';
}

// Handle password form submission
document.addEventListener('DOMContentLoaded', function() {
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const password = document.getElementById('accessPassword').value;
            const errorMessage = document.getElementById('errorMessage');
            
            if (validPasswords.includes(password)) {
                // Correct password
                sessionStorage.setItem('contractflow_authenticated', 'true');
                const overlay = document.getElementById('passwordOverlay');
                const mainContent = document.getElementById('mainContent');
                if (overlay) overlay.style.display = 'none';
                if (mainContent) mainContent.classList.add('visible');
                if (errorMessage) errorMessage.style.display = 'none';
            } else {
                // Wrong password
                if (errorMessage) errorMessage.style.display = 'block';
                const passwordField = document.getElementById('accessPassword');
                if (passwordField) {
                    passwordField.value = '';
                    passwordField.focus();
                }
            }
        });
    }
    
    // Handle Enter key in password field
    const passwordField = document.getElementById('accessPassword');
    if (passwordField) {
        passwordField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const form = document.getElementById('passwordForm');
                if (form) form.dispatchEvent(new Event('submit'));
            }
        });
    }
}); 