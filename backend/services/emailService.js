const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      // For development, use a test account or configure with real SMTP
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER || 'test@example.com',
          pass: process.env.SMTP_PASS || 'testpassword'
        }
      });

      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Error initializing email service:', error);
      // Create a mock transporter for development
      this.transporter = {
        sendMail: async (options) => {
          console.log('📧 Mock email sent:', options);
          return { messageId: 'mock-message-id' };
        }
      };
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(to, subject, content, options = {}) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@contractmanagement.com',
        to,
        subject,
        html: content,
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${to}: ${subject}`);
      return result;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send consent notification
   */
  async sendConsentNotification(userEmail, purpose, consentType) {
    const subject = 'Data Processing Consent Notification';
    const content = `
      <h2>Data Processing Consent</h2>
      <p>You have ${consentType.toLowerCase()} consent for the following purpose:</p>
      <p><strong>Purpose:</strong> ${purpose}</p>
      <p>You can withdraw this consent at any time through your account settings.</p>
      <p>Thank you for using our service.</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }

  /**
   * Send consent withdrawal notification
   */
  async sendConsentWithdrawalNotification(userEmail, purpose) {
    const subject = 'Consent Withdrawal Confirmation';
    const content = `
      <h2>Consent Withdrawal Confirmation</h2>
      <p>Your consent for the following purpose has been withdrawn:</p>
      <p><strong>Purpose:</strong> ${purpose}</p>
      <p>Data processing for this purpose has been stopped.</p>
      <p>If you have any questions, please contact our support team.</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }

  /**
   * Send data breach notification
   */
  async sendDataBreachNotification(userEmail, breachDetails) {
    const subject = 'Important: Data Security Incident Notification';
    const content = `
      <h2>Data Security Incident Notification</h2>
      <p>We have detected a potential data security incident that may affect your personal information.</p>
      <p><strong>Incident Type:</strong> ${breachDetails.type}</p>
      <p><strong>Date Detected:</strong> ${new Date(breachDetails.detectedAt).toLocaleDateString()}</p>
      <p><strong>Description:</strong> ${breachDetails.description}</p>
      <p>We are taking immediate action to address this incident and protect your data.</p>
      <p>If you have any concerns, please contact our support team immediately.</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }

  /**
   * Send grievance acknowledgment
   */
  async sendGrievanceAcknowledgment(userEmail, grievanceId, grievanceType) {
    const subject = 'Grievance Received - Acknowledgment';
    const content = `
      <h2>Grievance Acknowledgment</h2>
      <p>We have received your grievance and are processing it.</p>
      <p><strong>Grievance ID:</strong> ${grievanceId}</p>
      <p><strong>Type:</strong> ${grievanceType}</p>
      <p>We will review your grievance and respond within the required timeframe.</p>
      <p>You will receive updates on the status of your grievance.</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }

  /**
   * Send grievance resolution notification
   */
  async sendGrievanceResolutionNotification(userEmail, grievanceId, resolution) {
    const subject = 'Grievance Resolution Update';
    const content = `
      <h2>Grievance Resolution</h2>
      <p>Your grievance has been resolved.</p>
      <p><strong>Grievance ID:</strong> ${grievanceId}</p>
      <p><strong>Resolution:</strong> ${resolution}</p>
      <p>If you have any questions about this resolution, please contact our support team.</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }

  /**
   * Send data access notification
   */
  async sendDataAccessNotification(userEmail, dataType, accessDetails) {
    const subject = 'Data Access Notification';
    const content = `
      <h2>Data Access Notification</h2>
      <p>Your personal data has been accessed.</p>
      <p><strong>Data Type:</strong> ${dataType}</p>
      <p><strong>Access Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Access Method:</strong> ${accessDetails.method}</p>
      <p>This is a routine notification for transparency purposes.</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }

  /**
   * Send data correction notification
   */
  async sendDataCorrectionNotification(userEmail, correctedFields) {
    const subject = 'Personal Data Correction Confirmation';
    const content = `
      <h2>Data Correction Confirmation</h2>
      <p>Your personal data has been successfully corrected.</p>
      <p><strong>Corrected Fields:</strong></p>
      <ul>
        ${correctedFields.map(field => `<li>${field}</li>`).join('')}
      </ul>
      <p>The changes have been applied to your account.</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }

  /**
   * Send data erasure notification
   */
  async sendDataErasureNotification(userEmail) {
    const subject = 'Data Erasure Confirmation';
    const content = `
      <h2>Data Erasure Confirmation</h2>
      <p>Your personal data has been successfully erased as requested.</p>
      <p>All personal information has been anonymized or deleted from our systems.</p>
      <p>This action is irreversible.</p>
      <p>If you have any questions, please contact our support team.</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }

  /**
   * Send data portability notification
   */
  async sendDataPortabilityNotification(userEmail, downloadUrl) {
    const subject = 'Data Portability - Your Data is Ready';
    const content = `
      <h2>Data Portability</h2>
      <p>Your personal data export is ready for download.</p>
      <p><a href="${downloadUrl}">Click here to download your data</a></p>
      <p>This link will expire in 24 hours for security reasons.</p>
      <p>The exported data is in a standard format that can be imported into other systems.</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }

  /**
   * Send compliance report notification
   */
  async sendComplianceReportNotification(adminEmail, reportPeriod, reportUrl) {
    const subject = 'DPDP Compliance Report Available';
    const content = `
      <h2>DPDP Compliance Report</h2>
      <p>A new compliance report is available for the period: ${reportPeriod}</p>
      <p><a href="${reportUrl}">View Compliance Report</a></p>
      <p>This report contains all required compliance information for the specified period.</p>
    `;

    return this.sendEmail(adminEmail, subject, content);
  }

  /**
   * Send system notification
   */
  async sendSystemNotification(userEmail, notificationType, message) {
    const subject = `System Notification: ${notificationType}`;
    const content = `
      <h2>System Notification</h2>
      <p><strong>Type:</strong> ${notificationType}</p>
      <p>${message}</p>
      <p>Thank you for using our service.</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail({ to, name, resetUrl, expiryTime }) {
    const subject = 'Password Reset Request - Contract Management System';
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">Contract Management System</h1>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Hello ${name || 'there'},
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password for your Contract Management System account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            <strong>Important:</strong> This link will expire in ${expiryTime || '1 hour'}. If you don't reset your password within this time, you'll need to request a new reset link.
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 30px;">
            <h3 style="color: #333; margin-top: 0;">Security Tips:</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>Never share your password with anyone</li>
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication if available</li>
              <li>Keep your email account secure</li>
            </ul>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
            If you have any questions, please contact our support team.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, content);
  }
}

module.exports = EmailService; 