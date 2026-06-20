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
      // Validate required environment variables
      this.validateEnvironmentVariables();
      
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
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
  
  validateEnvironmentVariables() {
    if (this.emailEnabled) {
      const requiredVars = [
        'EMAIL_HOST',
        'EMAIL_PORT',
        'EMAIL_USER',
        'EMAIL_PASS'
      ];
      
      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }
    }
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
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

  /**
   * @param {number|object} userIdOrPayload - Recipient user id, or { userId, type, title, message, metadata }
   */
  async createNotification(userIdOrPayload, type, title, message, metadata = {}) {
    try {
      let userId;
      let resolvedType;
      let resolvedTitle;
      let resolvedMessage;
      let resolvedMeta = metadata;

      if (
        userIdOrPayload &&
        typeof userIdOrPayload === 'object' &&
        !Array.isArray(userIdOrPayload) &&
        'userId' in userIdOrPayload
      ) {
        ({
          userId,
          type: resolvedType,
          title: resolvedTitle,
          message: resolvedMessage,
          metadata: resolvedMeta = {},
        } = userIdOrPayload);
      } else {
        userId = userIdOrPayload;
        resolvedType = type;
        resolvedTitle = title;
        resolvedMessage = message;
      }

      const notification = await db.Notification.create({
        userId,
        type: resolvedType,
        title: resolvedTitle,
        message: resolvedMessage,
        metadata: resolvedMeta,
        isRead: false,
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /** Human-readable dataset line for Ricardian / multi-dataset contracts (no Sequelize include). */
  datasetLabelForContract(contract) {
    const fromRows = (rows) =>
      (Array.isArray(rows) ? rows : [])
        .map((d) => d?.datasetName || d?.name)
        .filter(Boolean);
    const cd = fromRows(contract.contractDatasets);
    if (cd.length) return cd.join(', ');
    const ds = fromRows(contract.datasetSelections);
    if (ds.length) return ds.join(', ');
    if (contract.dataset?.name) return contract.dataset.name;
    return 'your dataset(s)';
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

      const datasetLabel = this.datasetLabelForContract(contract);

      // Send email notification
      const emailHtml = `
        <h2>New Contract Initiated</h2>
        <p>A Training Data Consumer has initiated a contract for your dataset.</p>
        <p><strong>Contract ID:</strong> ${contract.contractId}</p>
        <p><strong>Dataset:</strong> ${datasetLabel}</p>
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
      if (contract.tsp) {
        parties.push(contract.tsp);
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

  async notifyCCRPSelected(contract, tspUser) {
    try {
      const title = 'TSP Selected for Contract';
      const message = `You have been selected as the TSP for contract ${contract.contractId}`;
      
      await this.createNotification(
        tspUser.id,
        'CCRP_SELECTED',
        title,
        message,
        { contractId: contract.contractId }
      );

      const emailHtml = `
        <h2>TSP Selection</h2>
        <p>You have been selected as the Tech Service Provider for contract ${contract.contractId}.</p>
        <p><strong>Dataset:</strong> ${contract.dataset.name}</p>
        <p><strong>Model:</strong> ${contract.modelId}</p>
        <p>Please review and sign the contract in your dashboard.</p>
        <p><a href="${process.env.FRONTEND_URL}/contracts/${contract.contractId}">View Contract</a></p>
      `;

      await this.sendEmail(tspUser.email, title, emailHtml);
    } catch (error) {
      console.error('Error notifying TSP selection:', error);
    }
  }

  async notifyContractCompleted(contract) {
    try {
      const title = 'Contract Completed';
      const message = `Contract ${contract.contractId} has been completed successfully`;
      
      const parties = [contract.tdp, contract.tdc, contract.tsp];

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
      if (contract.tsp) {
        parties.push(contract.tsp);
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
        where: {
          userId,
          isRead: false
        }
      });
      return count;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  // Multi-TDP Contract Notification Methods

  async notifyTdpSigned(contract, tdpUser, tdpDataset) {
    try {
      const title = 'TDP Contract Signed';
      const message = `TDP ${tdpUser.name} has signed the contract for dataset ${tdpDataset.datasetName}`;
      
      // Notify TDC
      const tdcUser = await db.User.findByPk(contract.tdcId);
      if (tdcUser) {
        await this.createNotification(
          tdcUser.id,
          'TDP_SIGNED',
          title,
          message,
          { 
            contractId: contract.contractId, 
            tdpId: tdpUser.id,
            datasetName: tdpDataset.datasetName 
          }
        );

        const emailHtml = `
          <h2>TDP Contract Signed</h2>
          <p>TDP ${tdpUser.name} has signed the contract for dataset ${tdpDataset.datasetName}.</p>
          <p><strong>Contract ID:</strong> ${contract.contractId}</p>
          <p><strong>Dataset:</strong> ${tdpDataset.datasetName}</p>
          <p><strong>Price:</strong> $${tdpDataset.individualPrice}</p>
          <p><a href="${process.env.FRONTEND_URL}/contracts/${contract.contractId}">View Contract</a></p>
        `;

        await this.sendEmail(tdcUser.email, title, emailHtml);
      }

      // Notify other TDPs in the same contract
      const contractDatasets = contract.contractDatasets || [];
      for (const dataset of contractDatasets) {
        if (dataset.tdpId !== tdpUser.id) {
          const otherTdpUser = await db.User.findByPk(dataset.tdpId);
          if (otherTdpUser) {
            await this.createNotification(
              otherTdpUser.id,
              'TDP_SIGNED',
              `TDP ${tdpUser.name} signed contract for ${tdpDataset.datasetName}`,
              `Another TDP has signed the contract. Your dataset ${dataset.datasetName} is still pending.`,
              { 
                contractId: contract.contractId, 
                signedTdpId: tdpUser.id,
                signedDatasetName: tdpDataset.datasetName 
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error notifying TDP signing:', error);
    }
  }

  async notifyCCRPApprovalRequired(contract, tspUser) {
    try {
      const title = 'TSP Approval Required';
      const message = `All TDPs have signed the contract. TSP approval is now required.`;
      
      await this.createNotification(
        tspUser.id,
        'CCRP_APPROVAL_REQUIRED',
        title,
        message,
        { contractId: contract.contractId }
      );

      const emailHtml = `
        <h2>TSP Approval Required</h2>
        <p>All Training Data Providers have signed the contract ${contract.contractId}.</p>
        <p><strong>Total Price:</strong> $${contract.totalPrice}</p>
        <p><strong>Dataset Count:</strong> ${contract.datasetCount}</p>
        <p>Please review and sign the contract in your dashboard.</p>
        <p><a href="${process.env.FRONTEND_URL}/contracts/${contract.contractId}">View Contract</a></p>
      `;

      await this.sendEmail(tspUser.email, title, emailHtml);
    } catch (error) {
      console.error('Error notifying TSP approval required:', error);
    }
  }

  async notifyTdcApprovalRequired(contract, tdcUser) {
    try {
      const title = 'TDC Approval Required';
      const message = `All TDPs have signed the contract. Your final approval is required.`;
      
      await this.createNotification(
        tdcUser.id,
        'TDC_APPROVAL_REQUIRED',
        title,
        message,
        { contractId: contract.contractId }
      );

      const emailHtml = `
        <h2>TDC Approval Required</h2>
        <p>All Training Data Providers have signed the contract ${contract.contractId}.</p>
        <p><strong>Total Price:</strong> $${contract.totalPrice}</p>
        <p><strong>Dataset Count:</strong> ${contract.datasetCount}</p>
        <p>Please review and provide final approval in your dashboard.</p>
        <p><a href="${process.env.FRONTEND_URL}/contracts/${contract.contractId}">View Contract</a></p>
      `;

      await this.sendEmail(tdcUser.email, title, emailHtml);
    } catch (error) {
      console.error('Error notifying TDC approval required:', error);
    }
  }

  async notifyTdpPaymentReceived(contract, tdpUser, paymentAmount) {
    try {
      const title = 'Payment Received';
      const message = `Payment of $${paymentAmount} has been received for your dataset in contract ${contract.contractId}`;
      
      await this.createNotification(
        tdpUser.id,
        'PAYMENT_RECEIVED',
        title,
        message,
        { 
          contractId: contract.contractId, 
          paymentAmount: paymentAmount 
        }
      );

      const emailHtml = `
        <h2>Payment Received</h2>
        <p>Payment of $${paymentAmount} has been received for your dataset in contract ${contract.contractId}.</p>
        <p><strong>Contract ID:</strong> ${contract.contractId}</p>
        <p><strong>Payment Amount:</strong> $${paymentAmount}</p>
        <p><a href="${process.env.FRONTEND_URL}/contracts/${contract.contractId}">View Contract</a></p>
      `;

      await this.sendEmail(tdpUser.email, title, emailHtml);
    } catch (error) {
      console.error('Error notifying TDP payment received:', error);
    }
  }

  async notifyMultiTdpContractCreated(contract, tdpUsers) {
    try {
      const title = 'Multi-TDP Contract Created';
      const message = `A new contract has been created with multiple datasets. Contract ID: ${contract.contractId}`;
      
      // Notify all TDPs
      for (const tdpUser of tdpUsers) {
        await this.createNotification(
          tdpUser.id,
          'MULTI_TDP_CONTRACT_CREATED',
          title,
          message,
          { 
            contractId: contract.contractId,
            datasetCount: contract.datasetCount,
            totalPrice: contract.totalPrice
          }
        );

        const emailHtml = `
          <h2>Multi-TDP Contract Created</h2>
          <p>A new contract has been created with multiple datasets.</p>
          <p><strong>Contract ID:</strong> ${contract.contractId}</p>
          <p><strong>Total Datasets:</strong> ${contract.datasetCount}</p>
          <p><strong>Total Price:</strong> $${contract.totalPrice}</p>
          <p>Please review and sign the contract in your dashboard.</p>
          <p><a href="${process.env.FRONTEND_URL}/contracts/${contract.contractId}">View Contract</a></p>
        `;

        await this.sendEmail(tdpUser.email, title, emailHtml);
      }
    } catch (error) {
      console.error('Error notifying multi-TDP contract creation:', error);
    }
  }
}

module.exports = NotificationService; 