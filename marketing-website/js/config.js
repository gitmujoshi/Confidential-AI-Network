/**
 * Configuration file for Confidential AI Network marketing website
 * Update these settings as needed
 */

const CONFIG = {
    // Security Settings
    SECURITY: {
        // Password for website access (change this to your desired password)
        PASSWORD: 'ConfidentialAI2026!',
        
        // Maximum failed attempts before lockout
        MAX_ATTEMPTS: 3,
        
        // Lockout duration in minutes
        LOCKOUT_DURATION_MINUTES: 15,
        
        // Authentication validity in hours
        AUTH_VALIDITY_HOURS: 24
    },
    
    // Website Settings
    WEBSITE: {
        NAME: 'Confidential AI Network',
        DESCRIPTION: 'Secure contracting + confidential AI training on protected data',
        VERSION: '3.0'
    },
    
    // Contact Information
    CONTACT: {
        EMAIL: 'info@confidentialai.network',
        PHONE: '+1 (555) 123-4567',
        LOCATION: 'San Francisco, CA'
    }
};

// Make config available globally
window.CONFIG = CONFIG;
