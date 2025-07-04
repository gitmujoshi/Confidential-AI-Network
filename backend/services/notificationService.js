const nodemailer = require('nodemailer');
const db = require('../models');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.emailEnabled = process.env.EMAIL_ENABLED === 'true';
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (this.emailEnabled) {
      // For development, use a test account or configure your email service
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      console.log('📧 Email sending is disabled. Emails will be logged instead.');
    }
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@example.com',
        to: to,
        subject: subject,
        html: html
      };

      if (this.emailEnabled && this.transporter) {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('📧 Email sent:', info.messageId);
        return info;
      } else {
        // Log email instead of sending
        console.log('📧 [EMAIL LOGGED - NOT SENT]');
        console.log('📧 To:', to);
        console.log('📧 Subject:', subject);
        console.log('📧 Content:', html);
        console.log('📧 --- End Email ---');
        
        // Return a mock response
        return {
          messageId: `logged-${Date.now()}`,
          response: 'Email logged (not sent)'
        };
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  async createNotification(userId, type, title, message, metadata = {}) {
    try {
      const notification = await db.Notification.create({
        userId,
        type,
        title,
        message,
        metadata,
        isRead: false
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async notifyContractCreated(contract, tdpUser) {
    try {
      const title = 'New Contract Initiated';
      const message = `A new contract has been initiated for your dataset. Contract ID: ${contract.contractId}`;
      
      // Create database notification
      await this.createNotification(
        tdpUser.id,
        'CONTRACT_CREATED',
        title,
        message,
        { contractId: contract.contractId }
      );

      // Send email notification
      const emailHtml = `
        <h2>New Contract Initiated</h2>
        <p>A Training Data Consumer has initiated a contract for your dataset.</p>
        <p><strong>Contract ID:</strong> ${contract.contractId}</p>
        <p><strong>Dataset:</strong> ${contract.dataset.name}</p>
        <p><strong>Price:</strong> $${contract.price}</p>
        <p><strong>Duration:</strong> ${contract.duration} days</p>
        <p>Please review and sign the contract in your dashboard.</p>
        <p><a href="${process.env.FRONTEND_URL}/contracts/${contract.contractId}">View Contract</a></p>
      `;

      await this.sendEmail(tdpUser.email, title, emailHtml);
    } catch (error) {
      console.error('Error notifying contract creation:', error);
    }
  }

  async notifyContractSigned(contract, signerUser, signerType) {
    try {
      const title = 'Contract Signed';
      const message = `Contract ${contract.contractId} has been signed by ${signerType}`;
      
      // Notify all parties involved
      const parties = [contract.tdp, contract.tdc];
      if (contract.ccrp) {
        parties.push(contract.ccrp);
      }

      for (const party of parties) {
        if (party.id !== signerUser.id) {
          await this.createNotification(
            party.id,
            'CONTRACT_SIGNED',
            title,
            message,
            { contractId: contract.contractId, signerType }
          );

          const emailHtml = `
            <h2>Contract Signed</h2>
            <p>Contract ${contract.contractId} has been signed by ${signerType}.</p>
            <p><strong>Contract Status:</strong> ${contract.status}</p>
            <p><a href="${process.env.FRONTEND_URL}/contracts/${contract.contractId}">View Contract</a></p>
          `;

          await this.sendEmail(party.email, title, emailHtml);
        }
      }
    } catch (error) {
      console.error('Error notifying contract signing:', error);
    }
  }

  async notifyCCRPSelected(contract, ccrpUser) {
    try {
      const title = 'CCRP Selected for Contract';
      const message = `You have been selected as the CCRP for contract ${contract.contractId}`;
      
      await this.createNotification(
        ccrpUser.id,
        'CCRP_SELECTED',
        title,
        message,
        { contractId: contract.contractId }
      );

      const emailHtml = `
        <h2>CCRP Selection</h2>
        <p>You have been selected as the Confidential Clean Room Provider for contract ${contract.contractId}.</p>
        <p><strong>Dataset:</strong> ${contract.dataset.name}</p>
        <p><strong>Model:</strong> ${contract.modelId}</p>
        <p>Please review and sign the contract in your dashboard.</p>
        <p><a href="${process.env.FRONTEND_URL}/contracts/${contract.contractId}">View Contract</a></p>
      `;

      await this.sendEmail(ccrpUser.email, title, emailHtml);
    } catch (error) {
      console.error('Error notifying CCRP selection:', error);
    }
  }

  async notifyContractCompleted(contract) {
    try {
      const title = 'Contract Completed';
      const message = `Contract ${contract.contractId} has been completed successfully`;
      
      const parties = [contract.tdp, contract.tdc, contract.ccrp];

      for (const party of parties) {
        await this.createNotification(
          party.id,
          'CONTRACT_COMPLETED',
          title,
          message,
          { contractId: contract.contractId }
        );

        const emailHtml = `
          <h2>Contract Completed</h2>
          <p>Contract ${contract.contractId} has been completed successfully.</p>
          <p><strong>Dataset:</strong> ${contract.dataset.name}</p>
          <p><strong>Model:</strong> ${contract.modelId}</p>
          <p><a href="${process.env.FRONTEND_URL}/contracts/${contract.contractId}">View Contract</a></p>
        `;

        await this.sendEmail(party.email, title, emailHtml);
      }
    } catch (error) {
      console.error('Error notifying contract completion:', error);
    }
  }

  async notifyContractCancelled(contract, cancelledBy) {
    try {
      const title = 'Contract Cancelled';
      const message = `Contract ${contract.contractId} has been cancelled by ${cancelledBy.name}`;
      
      const parties = [contract.tdp, contract.tdc];
      if (contract.ccrp) {
        parties.push(contract.ccrp);
      }

      for (const party of parties) {
        if (party.id !== cancelledBy.id) {
          await this.createNotification(
            party.id,
            'CONTRACT_CANCELLED',
            title,
            message,
            { contractId: contract.contractId, cancelledBy: cancelledBy.name }
          );

          const emailHtml = `
            <h2>Contract Cancelled</h2>
            <p>Contract ${contract.contractId} has been cancelled by ${cancelledBy.name}.</p>
            <p><strong>Dataset:</strong> ${contract.dataset.name}</p>
            <p><a href="${process.env.FRONTEND_URL}/contracts/${contract.contractId}">View Contract</a></p>
          `;

          await this.sendEmail(party.email, title, emailHtml);
        }
      }
    } catch (error) {
      console.error('Error notifying contract cancellation:', error);
    }
  }

  async getUserNotifications(userId, limit = 10, offset = 0) {
    try {
      const notifications = await db.Notification.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = await db.Notification.findOne({
        where: { id: notificationId, userId }
      });

      if (notification) {
        notification.isRead = true;
        await notification.save();
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId) {
    try {
      await db.Notification.update(
        { isRead: true },
        { where: { userId, isRead: false } }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadNotificationCount(userId) {
    try {
      const count = await db.Notification.count({
        where: { userId, isRead: false }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService(); 