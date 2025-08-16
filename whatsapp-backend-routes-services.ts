// ========================================
// src/routes/device.routes.ts
// ========================================
import { Router } from 'express';
import { body, query, param } from 'express-validator';
import deviceController from '../controllers/device.controller';
import { authenticate, authenticateApiKey } from '../middlewares/auth.middleware';
import { validate } from '../utils/validator';
import { deviceSchemas } from '../utils/validator';

const router = Router();

/**
 * @swagger
 * /api/v1/devices:
 *   get:
 *     summary: Get user's devices
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BANNED, DISCONNECTED]
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *           enum: [NORMAL, BUSINESS]
 *     responses:
 *       200:
 *         description: List of devices
 */
router.get(
  '/',
  authenticate,
  query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'BANNED', 'DISCONNECTED']),
  query('deviceType').optional().isIn(['NORMAL', 'BUSINESS']),
  deviceController.getDevices
);

/**
 * @swagger
 * /api/v1/devices:
 *   post:
 *     summary: Register new device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - deviceName
 *               - deviceType
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               deviceName:
 *                 type: string
 *               deviceType:
 *                 type: string
 *                 enum: [NORMAL, BUSINESS]
 */
router.post(
  '/',
  authenticate,
  validate(deviceSchemas.register),
  deviceController.registerDevice
);

/**
 * @swagger
 * /api/v1/devices/{deviceId}:
 *   get:
 *     summary: Get device by ID
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  '/:deviceId',
  authenticate,
  param('deviceId').isUUID(),
  deviceController.getDevice
);

/**
 * @swagger
 * /api/v1/devices/{deviceId}:
 *   put:
 *     summary: Update device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:deviceId',
  authenticate,
  param('deviceId').isUUID(),
  validate(deviceSchemas.update),
  deviceController.updateDevice
);

/**
 * @swagger
 * /api/v1/devices/{deviceId}:
 *   delete:
 *     summary: Delete device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:deviceId',
  authenticate,
  param('deviceId').isUUID(),
  deviceController.deleteDevice
);

/**
 * @swagger
 * /api/v1/devices/{deviceId}/qr:
 *   post:
 *     summary: Generate QR code for device connection
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:deviceId/qr',
  authenticate,
  param('deviceId').isUUID(),
  deviceController.generateQRCode
);

/**
 * @swagger
 * /api/v1/devices/{deviceId}/status:
 *   put:
 *     summary: Update device status (Mobile API)
 *     tags: [Devices]
 *     security:
 *       - apiKeyAuth: []
 */
router.put(
  '/:deviceId/status',
  authenticateApiKey,
  param('deviceId').isUUID(),
  body('isConnected').isBoolean(),
  body('batteryLevel').optional().isInt({ min: 0, max: 100 }),
  body('isCharging').optional().isBoolean(),
  body('sessionData').optional().isObject(),
  deviceController.updateDeviceStatus
);

export default router;

// ========================================
// src/routes/message.routes.ts
// ========================================
import { Router } from 'express';
import { body, query, param } from 'express-validator';
import messageController from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../utils/validator';
import { messageSchemas } from '../utils/validator';

const router = Router();

/**
 * @swagger
 * /api/v1/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  validate(messageSchemas.send),
  messageController.sendMessage
);

/**
 * @swagger
 * /api/v1/messages:
 *   get:
 *     summary: Get messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: phoneNumber
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SENT, DELIVERED, READ, FAILED]
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [INCOMING, OUTGOING]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 */
router.get(
  '/',
  authenticate,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  messageController.getMessages
);

/**
 * @swagger
 * /api/v1/messages/bulk:
 *   post:
 *     summary: Send bulk messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/bulk',
  authenticate,
  body('deviceId').isUUID(),
  body('phoneNumbers').isArray({ min: 1, max: 1000 }),
  body('phoneNumbers.*').isMobilePhone('any'),
  body('content').isString().isLength({ min: 1, max: 4096 }),
  body('delay').optional().isInt({ min: 1000, max: 60000 }),
  messageController.bulkSendMessages
);

/**
 * @swagger
 * /api/v1/messages/stats:
 *   get:
 *     summary: Get message statistics
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/stats',
  authenticate,
  query('deviceId').optional().isUUID(),
  query('period').optional().isIn(['24h', '7d', '30d', '90d']),
  messageController.getMessageStats
);

/**
 * @swagger
 * /api/v1/messages/{messageId}:
 *   get:
 *     summary: Get message by ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:messageId',
  authenticate,
  param('messageId').isString(),
  messageController.getMessage
);

/**
 * @swagger
 * /api/v1/messages/{messageId}/read:
 *   put:
 *     summary: Mark message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:messageId/read',
  authenticate,
  param('messageId').isString(),
  messageController.markAsRead
);

/**
 * @swagger
 * /api/v1/messages/conversation/{phoneNumber}:
 *   get:
 *     summary: Get conversation with phone number
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/conversation/:phoneNumber',
  authenticate,
  param('phoneNumber').isMobilePhone('any'),
  query('deviceId').optional().isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  messageController.getConversation
);

export default router;

// ========================================
// src/routes/dashboard.routes.ts
// ========================================
import { Router } from 'express';
import { query } from 'express-validator';
import dashboardController from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/overview',
  authenticate,
  dashboardController.getOverview
);

/**
 * @swagger
 * /api/v1/dashboard/activity-chart:
 *   get:
 *     summary: Get activity chart data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/activity-chart',
  authenticate,
  query('period').optional().isIn(['24h', '7d', '30d', '90d']),
  query('deviceId').optional().isUUID(),
  dashboardController.getActivityChart
);

/**
 * @swagger
 * /api/v1/dashboard/recent-activity:
 *   get:
 *     summary: Get recent activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/recent-activity',
  authenticate,
  query('limit').optional().isInt({ min: 1, max: 50 }),
  dashboardController.getRecentActivity
);

/**
 * @swagger
 * /api/v1/dashboard/health:
 *   get:
 *     summary: Get system health status
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/health',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  dashboardController.getSystemHealth
);

export default router;

// ========================================
// src/services/whatsapp.service.ts
// ========================================
import axios from 'axios';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';

const prisma = new PrismaClient();

export class WhatsAppService {
  private apiUrl: string;
  private apiToken: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || '';
    this.apiToken = process.env.WHATSAPP_API_TOKEN || '';
  }

  // Send text message
  async sendTextMessage(deviceId: string, phoneNumber: string, message: string) {
    try {
      const device = await this.getDevice(deviceId);
      
      if (!device || !device.sessionData) {
        throw new Error('Device not connected');
      }

      // Decrypt session data
      const sessionData = JSON.parse(decrypt(device.sessionData as string));

      // Send message through WhatsApp Web API
      // This would integrate with your WhatsApp Web library
      const response = await this.sendViaWhatsAppWeb(sessionData, phoneNumber, message);

      logger.info(`Message sent to ${phoneNumber} via device ${deviceId}`);
      return response;
    } catch (error) {
      logger.error('Send text message error:', error);
      throw error;
    }
  }

  // Send media message
  async sendMediaMessage(
    deviceId: string, 
    phoneNumber: string, 
    mediaUrl: string, 
    mediaType: string,
    caption?: string
  ) {
    try {
      const device = await this.getDevice(deviceId);
      
      if (!device || !device.sessionData) {
        throw new Error('Device not connected');
      }

      // Download media file
      const mediaBuffer = await this.downloadMedia(mediaUrl);

      // Send media through WhatsApp
      const response = await this.sendMediaViaWhatsAppWeb(
        JSON.parse(decrypt(device.sessionData as string)),
        phoneNumber,
        mediaBuffer,
        mediaType,
        caption
      );

      logger.info(`Media sent to ${phoneNumber} via device ${deviceId}`);
      return response;
    } catch (error) {
      logger.error('Send media message error:', error);
      throw error;
    }
  }

  // Join WhatsApp group
  async joinGroup(deviceId: string, inviteLink: string) {
    try {
      const device = await this.getDevice(deviceId);
      
      if (!device || !device.sessionData) {
        throw new Error('Device not connected');
      }

      // Extract group code from invite link
      const groupCode = this.extractGroupCode(inviteLink);

      // Join group through WhatsApp
      const response = await this.joinGroupViaWhatsAppWeb(
        JSON.parse(decrypt(device.sessionData as string)),
        groupCode
      );

      logger.info(`Joined group ${groupCode} via device ${deviceId}`);
      return response;
    } catch (error) {
      logger.error('Join group error:', error);
      throw error;
    }
  }

  // Get device information
  private async getDevice(deviceId: string) {
    return await prisma.device.findUnique({
      where: { id: deviceId }
    });
  }

  // Download media from URL
  private async downloadMedia(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024 // 50MB max
      });
      
      return Buffer.from(response.data);
    } catch (error) {
      logger.error('Download media error:', error);
      throw new Error('Failed to download media');
    }
  }

  // Extract group code from invite link
  private extractGroupCode(inviteLink: string): string {
    const match = inviteLink.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
    if (!match) {
      throw new Error('Invalid group invite link');
    }
    return match[1];
  }

  // WhatsApp Web API integration methods
  private async sendViaWhatsAppWeb(sessionData: any, phoneNumber: string, message: string) {
    // Implement WhatsApp Web API integration
    // This would use libraries like whatsapp-web.js or baileys
    return { success: true, messageId: 'msg_' + Date.now() };
  }

  private async sendMediaViaWhatsAppWeb(
    sessionData: any,
    phoneNumber: string,
    mediaBuffer: Buffer,
    mediaType: string,
    caption?: string
  ) {
    // Implement WhatsApp Web media sending
    return { success: true, messageId: 'msg_' + Date.now() };
  }

  private async joinGroupViaWhatsAppWeb(sessionData: any, groupCode: string) {
    // Implement WhatsApp Web group joining
    return { success: true, groupId: 'group_' + Date.now() };
  }
}

export const sendWhatsAppMessage = async (deviceId: string, data: any) => {
  const service = new WhatsAppService();
  
  if (data.mediaUrl) {
    return await service.sendMediaMessage(
      deviceId,
      data.phoneNumber,
      data.mediaUrl,
      data.mediaType,
      data.caption
    );
  } else {
    return await service.sendTextMessage(
      deviceId,
      data.phoneNumber,
      data.message
    );
  }
};

export default new WhatsAppService();

// ========================================
// src/services/notification.service.ts
// ========================================
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Send email
  async sendEmail(options: {
    to: string;
    subject: string;
    template?: string;
    data?: any;
    html?: string;
    text?: string;
  }) {
    try {
      let htmlContent = options.html || '';
      let textContent = options.text || '';

      // Load template if specified
      if (options.template) {
        const templateContent = await this.loadTemplate(options.template, options.data);
        htmlContent = templateContent.html;
        textContent = templateContent.text;
      }

      const mailOptions = {
        from: `"WhatsApp Automation" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: textContent,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent to ${options.to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Send email error:', error);
      throw error;
    }
  }

  // Send push notification
  async sendPushNotification(userId: string, title: string, message: string, data?: any) {
    try {
      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'INFO',
          title,
          message,
          data
        }
      });

      // If user has push tokens, send push notification
      // This would integrate with FCM, APNS, etc.

      logger.info(`Push notification created for user ${userId}`);
      return notification;
    } catch (error) {
      logger.error('Send push notification error:', error);
      throw error;
    }
  }

  // Send SMS notification
  async sendSMS(phoneNumber: string, message: string) {
    try {
      // Integrate with SMS provider (Twilio, etc.)
      logger.info(`SMS sent to ${phoneNumber}`);
      return { success: true };
    } catch (error) {
      logger.error('Send SMS error:', error);
      throw error;
    }
  }

  // Send webhook notification
  async sendWebhookNotification(url: string, data: any) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      logger.info(`Webhook notification sent to ${url}`);
      return await response.json();
    } catch (error) {
      logger.error('Send webhook notification error:', error);
      throw error;
    }
  }

  // Load email template
  private async loadTemplate(templateName: string, data: any) {
    const templates = {
      welcome: {
        html: `
          <h1>Welcome to WhatsApp Automation Platform!</h1>
          <p>Hello ${data.fullName},</p>
          <p>Your account has been created successfully.</p>
          <p>Your API Key: <code>${data.apiKey}</code></p>
          <p>Please keep this key secure and do not share it with anyone.</p>
          <p>Best regards,<br>WhatsApp Automation Team</p>
        `,
        text: `Welcome to WhatsApp Automation Platform!
        
Hello ${data.fullName},

Your account has been created successfully.
Your API Key: ${data.apiKey}

Please keep this key secure and do not share it with anyone.

Best regards,
WhatsApp Automation Team`
      },
      licenseExpiring: {
        html: `
          <h1>License Expiring Soon</h1>
          <p>Hello ${data.fullName},</p>
          <p>Your license will expire in ${data.daysRemaining} days.</p>
          <p>Please renew your license to continue using our services.</p>
          <p>Best regards,<br>WhatsApp Automation Team</p>
        `,
        text: `License Expiring Soon
        
Hello ${data.fullName},

Your license will expire in ${data.daysRemaining} days.
Please renew your license to continue using our services.

Best regards,
WhatsApp Automation Team`
      },
      deviceDisconnected: {
        html: `
          <h1>Device Disconnected</h1>
          <p>Your device "${data.deviceName}" has been disconnected.</p>
          <p>Phone: ${data.phoneNumber}</p>
          <p>Please reconnect your device to continue sending messages.</p>
        `,
        text: `Device Disconnected
        
Your device "${data.deviceName}" has been disconnected.
Phone: ${data.phoneNumber}

Please reconnect your device to continue sending messages.`
      }
    };

    return templates[templateName] || { html: '', text: '' };
  }

  // Notify license expiration
  async notifyLicenseExpiration(userId: string, daysRemaining: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return;

    // Send email
    await this.sendEmail({
      to: user.email,
      subject: 'License Expiring Soon',
      template: 'licenseExpiring',
      data: {
        fullName: user.fullName,
        daysRemaining
      }
    });

    // Create in-app notification
    await this.sendPushNotification(
      userId,
      'License Expiring',
      `Your license will expire in ${daysRemaining} days`
    );
  }

  // Notify device disconnection
  async notifyDeviceDisconnection(deviceId: string) {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { user: true }
    });

    if (!device) return;

    // Send email
    await this.sendEmail({
      to: device.user.email,
      subject: 'Device Disconnected',
      template: 'deviceDisconnected',
      data: {
        deviceName: device.deviceName,
        phoneNumber: device.phoneNumber
      }
    });

    // Create in-app notification
    await this.sendPushNotification(
      device.userId,
      'Device Disconnected',
      `Your device "${device.deviceName}" has been disconnected`
    );
  }
}

export const sendEmail = async (options: any) => {
  const service = new NotificationService();
  return await service.sendEmail(options);
};

export default new NotificationService();

// ========================================
// src/services/license.service.ts
// ========================================
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { generateLicenseKey } from '../utils/tokenGenerator';
import notificationService from './notification.service';

const prisma = new PrismaClient();

class LicenseService {
  // Create license
  async createLicense(userId: string, type: string, duration: number) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration);

      const features = this.getLicenseFeatures(type);

      const license = await prisma.license.create({
        data: {
          userId,
          licenseKey: generateLicenseKey(),
          type: type as any,
          status: 'ACTIVE',
          deviceLimit: features.deviceLimit,
          messageLimit: features.messageLimit,
          expiresAt,
          features: features.additional
        }
      });

      logger.info(`License created for user ${userId}: ${license.licenseKey}`);
      return license;
    } catch (error) {
      logger.error('Create license error:', error);
      throw error;
    }
  }

  // Get license features based on type
  private getLicenseFeatures(type: string) {
    const features = {
      TRIAL: {
        deviceLimit: 1,
        messageLimit: 100,
        additional: {
          bulkMessaging: false,
          mediaMessaging: true,
          groupMessaging: false,
          webhooks: false,
          apiAccess: true,
          priority: 'low'
        }
      },
      BASIC: {
        deviceLimit: 2,
        messageLimit: 1000,
        additional: {
          bulkMessaging: true,
          mediaMessaging: true,
          groupMessaging: true,
          webhooks: true,
          apiAccess: true,
          priority: 'normal'
        }
      },
      PRO: {
        deviceLimit: 5,
        messageLimit: 10000,
        additional: {
          bulkMessaging: true,
          mediaMessaging: true,
          groupMessaging: true,
          webhooks: true,
          apiAccess: true,
          priority: 'high',
          customBranding: true,
          advancedAnalytics: true
        }
      },
      ENTERPRISE: {
        deviceLimit: 999,
        messageLimit: null, // Unlimited
        additional: {
          bulkMessaging: true,
          mediaMessaging: true,
          groupMessaging: true,
          webhooks: true,
          apiAccess: true,
          priority: 'highest',
          customBranding: true,
          advancedAnalytics: true,
          dedicatedSupport: true,
          sla: true
        }
      }
    };

    return features[type] || features.BASIC;
  }

  // Check and notify expiring licenses
  async checkExpiringLicenses() {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const expiringLicenses = await prisma.license.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lte: sevenDaysFromNow,
            gt: new Date()
          }
        },
        include: {
          user: true
        }
      });

      for (const license of expiringLicenses) {
        const daysRemaining = Math.ceil(
          (license.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        await notificationService.notifyLicenseExpiration(
          license.userId,
          daysRemaining
        );
      }

      logger.info(`Checked ${expiringLicenses.length} expiring licenses`);
    } catch (error) {
      logger.error('Check expiring licenses error:', error);
    }
  }

  // Verify license
  async verifyLicense(userId: string): Promise<boolean> {
    const license = await prisma.license.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      }
    });

    return !!license;
  }

  // Get license limits
  async getLicenseLimits(userId: string) {
    const license = await prisma.license.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      }
    });

    if (!license) {
      return null;
    }

    return {
      deviceLimit: license.deviceLimit,
      messageLimit: license.messageLimit,
      features: license.features
    };
  }
}

export default new LicenseService();