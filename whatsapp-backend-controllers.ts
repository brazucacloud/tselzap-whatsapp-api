// ========================================
// src/controllers/device.controller.ts
// ========================================
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { generateDeviceId } from '../utils/tokenGenerator';
import { cache } from '../config/redis';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

export class DeviceController {
  // Register new device
  async registerDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).userId;
      const { phoneNumber, deviceName, deviceType } = req.body;

      // Check if device already exists
      const existingDevice = await prisma.device.findUnique({
        where: { phoneNumber }
      });

      if (existingDevice) {
        return res.status(409).json({
          success: false,
          message: 'Device with this phone number already exists'
        });
      }

      // Check device limit based on license
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          licenses: {
            where: {
              status: 'ACTIVE',
              expiresAt: { gt: new Date() }
            }
          },
          devices: true
        }
      });

      if (!user?.licenses[0]) {
        return res.status(403).json({
          success: false,
          message: 'No active license found'
        });
      }

      const license = user.licenses[0];
      if (user.devices.length >= license.deviceLimit) {
        return res.status(403).json({
          success: false,
          message: `Device limit reached (${license.deviceLimit} devices allowed)`
        });
      }

      // Create device
      const device = await prisma.device.create({
        data: {
          id: generateDeviceId(),
          userId,
          phoneNumber,
          deviceName,
          deviceType,
          status: 'INACTIVE'
        }
      });

      logger.info(`New device registered: ${device.id}`);

      res.status(201).json({
        success: true,
        message: 'Device registered successfully',
        data: device
      });
    } catch (error) {
      logger.error('Device registration error:', error);
      next(error);
    }
  }

  // Get user's devices
  async getDevices(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { status, deviceType } = req.query;

      const where: any = { userId };
      if (status) where.status = status;
      if (deviceType) where.deviceType = deviceType;

      const devices = await prisma.device.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      // Add cached connection status
      for (const device of devices) {
        const cachedStatus = await cache.get(`device:${device.id}:status`);
        if (cachedStatus) {
          device.isConnected = cachedStatus.isConnected;
          device.batteryLevel = cachedStatus.batteryLevel;
        }
      }

      res.json({
        success: true,
        data: devices
      });
    } catch (error) {
      logger.error('Get devices error:', error);
      next(error);
    }
  }

  // Get device by ID
  async getDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { deviceId } = req.params;

      const device = await prisma.device.findFirst({
        where: {
          id: deviceId,
          userId
        },
        include: {
          _count: {
            select: {
              tasks: true,
              messages: true
            }
          }
        }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      res.json({
        success: true,
        data: device
      });
    } catch (error) {
      logger.error('Get device error:', error);
      next(error);
    }
  }

  // Update device
  async updateDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { deviceId } = req.params;
      const { deviceName, status } = req.body;

      const device = await prisma.device.findFirst({
        where: {
          id: deviceId,
          userId
        }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      const updatedDevice = await prisma.device.update({
        where: { id: deviceId },
        data: {
          ...(deviceName && { deviceName }),
          ...(status && { status })
        }
      });

      logger.info(`Device ${deviceId} updated`);

      res.json({
        success: true,
        message: 'Device updated successfully',
        data: updatedDevice
      });
    } catch (error) {
      logger.error('Update device error:', error);
      next(error);
    }
  }

  // Delete device
  async deleteDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { deviceId } = req.params;

      const device = await prisma.device.findFirst({
        where: {
          id: deviceId,
          userId
        }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Check for pending tasks
      const pendingTasks = await prisma.task.count({
        where: {
          deviceId,
          status: { in: ['PENDING', 'PROCESSING'] }
        }
      });

      if (pendingTasks > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete device with ${pendingTasks} pending tasks`
        });
      }

      await prisma.device.delete({
        where: { id: deviceId }
      });

      logger.info(`Device ${deviceId} deleted`);

      res.json({
        success: true,
        message: 'Device deleted successfully'
      });
    } catch (error) {
      logger.error('Delete device error:', error);
      next(error);
    }
  }

  // Generate QR code for device connection
  async generateQRCode(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { deviceId } = req.params;

      const device = await prisma.device.findFirst({
        where: {
          id: deviceId,
          userId
        }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Generate QR code data
      const qrData = {
        deviceId: device.id,
        timestamp: Date.now(),
        token: generateDeviceId() // Temporary token for connection
      };

      // Generate QR code image
      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Store QR code temporarily
      await prisma.device.update({
        where: { id: deviceId },
        data: {
          qrCode: qrCodeImage,
          status: 'INACTIVE'
        }
      });

      // Cache QR data for validation
      await cache.set(`qr:${device.id}`, qrData, 300); // 5 minutes TTL

      res.json({
        success: true,
        data: {
          qrCode: qrCodeImage,
          expiresIn: 300
        }
      });
    } catch (error) {
      logger.error('Generate QR code error:', error);
      next(error);
    }
  }

  // Update device status from mobile app
  async updateDeviceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { deviceId } = req.params;
      const { isConnected, batteryLevel, isCharging, sessionData } = req.body;

      const device = await prisma.device.update({
        where: { id: deviceId },
        data: {
          isConnected,
          batteryLevel,
          isCharging,
          sessionData,
          lastSeen: new Date(),
          status: isConnected ? 'ACTIVE' : 'INACTIVE'
        }
      });

      // Cache device status
      await cache.set(`device:${deviceId}:status`, {
        isConnected,
        batteryLevel,
        isCharging,
        lastSeen: new Date()
      }, 60); // 1 minute TTL

      res.json({
        success: true,
        message: 'Device status updated',
        data: device
      });
    } catch (error) {
      logger.error('Update device status error:', error);
      next(error);
    }
  }
}

export default new DeviceController();

// ========================================
// src/controllers/message.controller.ts
// ========================================
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { addToQueue } from '../services/queue.service';
import { generateMessageId } from '../utils/tokenGenerator';

const prisma = new PrismaClient();

export class MessageController {
  // Send message
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).userId;
      const { deviceId, phoneNumber, messageType, content, mediaUrl, location } = req.body;

      // Verify device ownership
      const device = await prisma.device.findFirst({
        where: {
          id: deviceId,
          userId,
          status: 'ACTIVE'
        }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Active device not found'
        });
      }

      // Create task for message
      const task = await prisma.task.create({
        data: {
          userId,
          deviceId,
          type: 'MESSAGE',
          data: {
            phoneNumber,
            messageType,
            content,
            mediaUrl,
            location
          }
        }
      });

      // Create message record
      const message = await prisma.message.create({
        data: {
          id: generateMessageId(),
          userId,
          deviceId,
          taskId: task.id,
          phoneNumber,
          messageType,
          content,
          mediaUrl,
          status: 'PENDING',
          direction: 'OUTGOING'
        }
      });

      // Add to queue
      await addToQueue(task);

      logger.info(`Message queued: ${message.id}`);

      res.status(201).json({
        success: true,
        message: 'Message queued successfully',
        data: message
      });
    } catch (error) {
      logger.error('Send message error:', error);
      next(error);
    }
  }

  // Get messages
  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { 
        deviceId, 
        phoneNumber, 
        status, 
        direction, 
        messageType,
        startDate,
        endDate,
        page = 1, 
        limit = 20 
      } = req.query;

      const where: any = { userId };
      if (deviceId) where.deviceId = deviceId;
      if (phoneNumber) where.phoneNumber = phoneNumber;
      if (status) where.status = status;
      if (direction) where.direction = direction;
      if (messageType) where.messageType = messageType;
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where,
          include: {
            device: {
              select: {
                phoneNumber: true,
                deviceName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit)
        }),
        prisma.message.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Get messages error:', error);
      next(error);
    }
  }

  // Get message by ID
  async getMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { messageId } = req.params;

      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          userId
        },
        include: {
          device: true,
          task: true
        }
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      logger.error('Get message error:', error);
      next(error);
    }
  }

  // Get conversation
  async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { phoneNumber } = req.params;
      const { deviceId, page = 1, limit = 50 } = req.query;

      const where: any = {
        userId,
        phoneNumber
      };
      if (deviceId) where.deviceId = deviceId;

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where,
          orderBy: { createdAt: 'asc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit)
        }),
        prisma.message.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          phoneNumber,
          messages,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Get conversation error:', error);
      next(error);
    }
  }

  // Mark message as read
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { messageId } = req.params;

      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          userId,
          direction: 'INCOMING'
        }
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Message marked as read',
        data: updatedMessage
      });
    } catch (error) {
      logger.error('Mark as read error:', error);
      next(error);
    }
  }

  // Bulk send messages
  async bulkSendMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).userId;
      const { deviceId, phoneNumbers, content, delay = 5000 } = req.body;

      // Verify device
      const device = await prisma.device.findFirst({
        where: {
          id: deviceId,
          userId,
          status: 'ACTIVE'
        }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Active device not found'
        });
      }

      // Check message limit
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          licenses: {
            where: {
              status: 'ACTIVE',
              expiresAt: { gt: new Date() }
            }
          }
        }
      });

      const license = user?.licenses[0];
      if (license?.messageLimit) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const messageCount = await prisma.message.count({
          where: {
            userId,
            createdAt: { gte: today }
          }
        });

        if (messageCount + phoneNumbers.length > license.messageLimit) {
          return res.status(429).json({
            success: false,
            message: `Daily message limit would be exceeded (${license.messageLimit} messages allowed)`
          });
        }
      }

      // Create bulk task
      const task = await prisma.task.create({
        data: {
          userId,
          deviceId,
          type: 'BULK_MESSAGE',
          data: {
            phoneNumbers,
            message: content,
            delay
          }
        }
      });

      // Add to queue
      await addToQueue(task);

      logger.info(`Bulk message task created: ${task.id} for ${phoneNumbers.length} recipients`);

      res.status(201).json({
        success: true,
        message: `Bulk message queued for ${phoneNumbers.length} recipients`,
        data: {
          taskId: task.id,
          recipientCount: phoneNumbers.length,
          estimatedTime: (phoneNumbers.length * delay) / 1000
        }
      });
    } catch (error) {
      logger.error('Bulk send messages error:', error);
      next(error);
    }
  }

  // Get message statistics
  async getMessageStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { deviceId, period = '7d' } = req.query;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const where: any = {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };
      if (deviceId) where.deviceId = deviceId;

      // Get statistics
      const [
        totalMessages,
        sentMessages,
        receivedMessages,
        deliveredMessages,
        readMessages,
        failedMessages
      ] = await Promise.all([
        prisma.message.count({ where }),
        prisma.message.count({ 
          where: { ...where, direction: 'OUTGOING' } 
        }),
        prisma.message.count({ 
          where: { ...where, direction: 'INCOMING' } 
        }),
        prisma.message.count({ 
          where: { ...where, status: 'DELIVERED' } 
        }),
        prisma.message.count({ 
          where: { ...where, status: 'READ' } 
        }),
        prisma.message.count({ 
          where: { ...where, status: 'FAILED' } 
        })
      ]);

      // Get daily breakdown
      const dailyStats = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total,
          COUNT(CASE WHEN direction = 'OUTGOING' THEN 1 END) as sent,
          COUNT(CASE WHEN direction = 'INCOMING' THEN 1 END) as received,
          COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
        FROM "Message"
        WHERE user_id = ${userId}
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
          ${deviceId ? `AND device_id = ${deviceId}` : ''}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      res.json({
        success: true,
        data: {
          period,
          summary: {
            total: totalMessages,
            sent: sentMessages,
            received: receivedMessages,
            delivered: deliveredMessages,
            read: readMessages,
            failed: failedMessages,
            deliveryRate: sentMessages > 0 
              ? ((deliveredMessages / sentMessages) * 100).toFixed(2) + '%'
              : '0%',
            readRate: deliveredMessages > 0
              ? ((readMessages / deliveredMessages) * 100).toFixed(2) + '%'
              : '0%'
          },
          daily: dailyStats
        }
      });
    } catch (error) {
      logger.error('Get message stats error:', error);
      next(error);
    }
  }
}

export default new MessageController();

// ========================================
// src/controllers/dashboard.controller.ts
// ========================================
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { getQueueStats } from '../services/queue.service';
import { cache } from '../config/redis';

const prisma = new PrismaClient();

export class DashboardController {
  // Get dashboard overview
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;

      // Get current date ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      // Get counts
      const [
        activeDevices,
        totalDevices,
        todayMessages,
        yesterdayMessages,
        todayTasks,
        pendingTasks,
        license,
        queueStats
      ] = await Promise.all([
        prisma.device.count({
          where: {
            userId,
            status: 'ACTIVE',
            isConnected: true
          }
        }),
        prisma.device.count({
          where: { userId }
        }),
        prisma.message.count({
          where: {
            userId,
            createdAt: { gte: today }
          }
        }),
        prisma.message.count({
          where: {
            userId,
            createdAt: {
              gte: yesterday,
              lt: today
            }
          }
        }),
        prisma.task.count({
          where: {
            userId,
            createdAt: { gte: today }
          }
        }),
        prisma.task.count({
          where: {
            userId,
            status: { in: ['PENDING', 'PROCESSING'] }
          }
        }),
        prisma.license.findFirst({
          where: {
            userId,
            status: 'ACTIVE',
            expiresAt: { gt: new Date() }
          }
        }),
        getQueueStats()
      ]);

      // Calculate changes
      const messageChange = yesterdayMessages > 0 
        ? ((todayMessages - yesterdayMessages) / yesterdayMessages * 100).toFixed(1)
        : '0';

      // Get success rate for today
      const [successfulTasks, totalTasks] = await Promise.all([
        prisma.task.count({
          where: {
            userId,
            createdAt: { gte: today },
            status: 'COMPLETED'
          }
        }),
        prisma.task.count({
          where: {
            userId,
            createdAt: { gte: today },
            status: { in: ['COMPLETED', 'FAILED'] }
          }
        })
      ]);

      const successRate = totalTasks > 0 
        ? ((successfulTasks / totalTasks) * 100).toFixed(1)
        : '0';

      res.json({
        success: true,
        data: {
          devices: {
            active: activeDevices,
            total: totalDevices,
            percentage: totalDevices > 0 
              ? ((activeDevices / totalDevices) * 100).toFixed(1)
              : '0'
          },
          messages: {
            today: todayMessages,
            change: messageChange,
            trend: Number(messageChange) >= 0 ? 'up' : 'down'
          },
          tasks: {
            today: todayTasks,
            pending: pendingTasks,
            successRate: successRate
          },
          queues: queueStats,
          license: license ? {
            type: license.type,
            expiresIn: Math.ceil((license.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            deviceLimit: license.deviceLimit,
            messageLimit: license.messageLimit,
            messagesUsedToday: todayMessages
          } : null
        }
      });
    } catch (error) {
      logger.error('Get dashboard overview error:', error);
      next(error);
    }
  }

  // Get activity chart data
  async getActivityChart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { period = '7d', deviceId } = req.query;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      let groupBy = 'day';
      switch (period) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          groupBy = 'hour';
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          groupBy = 'day';
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          groupBy = 'day';
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          groupBy = 'week';
          break;
      }

      // Try to get from cache first
      const cacheKey = `activity:${userId}:${period}:${deviceId || 'all'}`;
      const cachedData = await cache.get(cacheKey);
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData
        });
      }

      // Get activity data
      const where: any = {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };
      if (deviceId) where.deviceId = deviceId;

      const messages = await prisma.message.groupBy({
        by: ['createdAt', 'direction'],
        where,
        _count: true
      });

      // Process data for chart
      const chartData = processChartData(messages, startDate, endDate, groupBy);

      // Cache for 5 minutes
      await cache.set(cacheKey, chartData, 300);

      res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      logger.error('Get activity chart error:', error);
      next(error);
    }
  }

  // Get recent activity
  async getRecentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { limit = 10 } = req.query;

      // Get recent logs
      const logs = await prisma.log.findMany({
        where: {
          userId,
          level: { in: ['INFO', 'WARN', 'ERROR'] }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit)
      });

      // Get recent messages
      const messages = await prisma.message.findMany({
        where: { userId },
        include: {
          device: {
            select: {
              deviceName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit)
      });

      // Get recent tasks
      const tasks = await prisma.task.findMany({
        where: { userId },
        include: {
          device: {
            select: {
              deviceName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit)
      });

      // Combine and sort by date
      const activities = [
        ...logs.map(log => ({
          type: 'log',
          level: log.level,
          message: log.message,
          timestamp: log.createdAt
        })),
        ...messages.map(msg => ({
          type: 'message',
          direction: msg.direction,
          phoneNumber: msg.phoneNumber,
          device: msg.device?.deviceName,
          status: msg.status,
          timestamp: msg.createdAt
        })),
        ...tasks.map(task => ({
          type: 'task',
          taskType: task.type,
          device: task.device?.deviceName,
          status: task.status,
          timestamp: task.createdAt
        }))
      ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, Number(limit));

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      logger.error('Get recent activity error:', error);
      next(error);
    }
  }

  // Get system health
  async getSystemHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        dbStatus,
        redisStatus,
        queueStats
      ] = await Promise.all([
        checkDatabaseHealth(),
        checkRedisHealth(),
        getQueueStats()
      ]);

      const health = {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date(),
        services: {
          database: dbStatus,
          redis: redisStatus,
          queues: {
            status: queueStats.total.failed < 100 ? 'healthy' : 'degraded',
            ...queueStats.total
          }
        },
        system: {
          memory: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal,
            percentage: ((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100).toFixed(2)
          },
          cpu: process.cpuUsage(),
          node: process.version,
          platform: process.platform
        }
      };

      // Determine overall health
      if (dbStatus !== 'healthy' || redisStatus !== 'healthy') {
        health.status = 'unhealthy';
      } else if (queueStats.total.failed > 50) {
        health.status = 'degraded';
      }

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Get system health error:', error);
      res.status(503).json({
        success: false,
        message: 'System health check failed',
        data: {
          status: 'unhealthy',
          error: error.message
        }
      });
    }
  }
}

// Helper functions
function processChartData(messages: any[], startDate: Date, endDate: Date, groupBy: string) {
  // Implementation of chart data processing
  // Group messages by time period and direction
  const data: any[] = [];
  
  // This is a simplified version - you'd implement proper grouping logic
  return data;
}

async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'healthy';
  } catch (error) {
    return 'unhealthy';
  }
}

async function checkRedisHealth() {
  try {
    const client = cache;
    await client.set('health:check', 'ok', 1);
    return 'healthy';
  } catch (error) {
    return 'unhealthy';
  }
}

export default new DashboardController();