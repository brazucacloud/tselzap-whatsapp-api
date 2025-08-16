// ========================================
// src/utils/logger.ts
// ========================================
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logDir = process.env.LOG_DIR || 'logs';

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'whatsapp-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true
    }),
    // Daily rotate file for all logs
    new DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    // Daily rotate file for errors
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    })
  ],
  exitOnError: false
});

// Create a stream object for Morgan middleware
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

// ========================================
// src/utils/validator.ts
// ========================================
import Joi from 'joi';

// User validation schemas
export const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
    fullName: Joi.string().min(2).max(100).required()
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  update: Joi.object({
    fullName: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    twoFactorEnabled: Joi.boolean()
  })
};

// Task validation schemas
export const taskSchemas = {
  create: Joi.object({
    type: Joi.string().valid('MESSAGE', 'MEDIA', 'GROUP_JOIN', 'GROUP_LEAVE', 'GROUP_MESSAGE', 'BULK_MESSAGE').required(),
    deviceId: Joi.string().uuid(),
    priority: Joi.number().integer().min(1).max(10),
    scheduledAt: Joi.date().iso().min('now'),
    data: Joi.object({
      phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
      phoneNumbers: Joi.array().items(Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)),
      message: Joi.string().max(4096),
      mediaUrl: Joi.string().uri(),
      mediaType: Joi.string().valid('image', 'video', 'audio', 'document'),
      caption: Joi.string().max(1024),
      groupId: Joi.string(),
      inviteLink: Joi.string().uri(),
      delay: Joi.number().integer().min(1000).max(60000)
    }).required()
  }),
  
  bulkCreate: Joi.object({
    tasks: Joi.array().items(Joi.object({
      type: Joi.string().valid('MESSAGE', 'MEDIA').required(),
      deviceId: Joi.string().uuid(),
      data: Joi.object().required()
    })).min(1).max(100).required()
  })
};

// Message validation schemas
export const messageSchemas = {
  send: Joi.object({
    deviceId: Joi.string().uuid().required(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    messageType: Joi.string().valid('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'LOCATION', 'CONTACT').required(),
    content: Joi.string().when('messageType', {
      is: 'TEXT',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    mediaUrl: Joi.string().uri().when('messageType', {
      is: Joi.valid('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180),
      name: Joi.string(),
      address: Joi.string()
    }).when('messageType', {
      is: 'LOCATION',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  })
};

// Device validation schemas
export const deviceSchemas = {
  register: Joi.object({
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    deviceName: Joi.string().min(2).max(50).required(),
    deviceType: Joi.string().valid('NORMAL', 'BUSINESS').required()
  }),
  
  update: Joi.object({
    deviceName: Joi.string().min(2).max(50),
    status: Joi.string().valid('ACTIVE', 'INACTIVE')
  })
};

// Webhook validation schemas
export const webhookSchemas = {
  create: Joi.object({
    url: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
    events: Joi.array().items(
      Joi.string().valid(
        'device.connected',
        'device.disconnected',
        'message.sent',
        'message.delivered',
        'message.read',
        'message.failed',
        'task.created',
        'task.completed',
        'task.failed',
        'group.joined',
        'group.left'
      )
    ).min(1).required(),
    secret: Joi.string().min(16).max(64)
  })
};

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    next();
  };
};

// ========================================
// src/utils/encryption.ts
// ========================================
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32);
const iv = crypto.randomBytes(16);

export const encrypt = (text: string): string => {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

export const decrypt = (encryptedData: string): string => {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

export const hashPassword = (password: string): string => {
  return crypto
    .createHash('sha256')
    .update(password + process.env.PASSWORD_SALT)
    .digest('hex');
};

export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// ========================================
// src/utils/tokenGenerator.ts
// ========================================
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export const generateApiKey = (): string => {
  const prefix = 'wak'; // WhatsApp Automation Key
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(16).toString('hex');
  return `${prefix}_${timestamp}_${randomPart}`;
};

export const generateLicenseKey = (): string => {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return segments.join('-');
};

export const generateSessionToken = (): string => {
  return crypto.randomBytes(32).toString('base64url');
};

export const generateWebhookSecret = (): string => {
  return crypto.randomBytes(24).toString('hex');
};

export const generateDeviceId = (): string => {
  return `device_${uuidv4()}`;
};

export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
};

// ========================================
// src/config/swagger.ts
// ========================================
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsApp Automation API',
      version: '2.0.0',
      description: 'Professional WhatsApp automation backend system with comprehensive features',
      contact: {
        name: 'API Support',
        email: 'support@whatsapp-automation.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.APP_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.whatsapp-automation.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            fullName: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'USER'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['MESSAGE', 'MEDIA', 'GROUP_JOIN'] },
            status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] },
            priority: { type: 'integer', minimum: 1, maximum: 10 },
            data: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            phoneNumber: { type: 'string' },
            messageType: { type: 'string', enum: ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'] },
            content: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'] },
            direction: { type: 'string', enum: ['INCOMING', 'OUTGOING'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Device: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            phoneNumber: { type: 'string' },
            deviceName: { type: 'string' },
            deviceType: { type: 'string', enum: ['NORMAL', 'BUSINESS'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'BANNED', 'DISCONNECTED'] },
            isConnected: { type: 'boolean' },
            lastSeen: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Devices', description: 'Device management endpoints' },
      { name: 'Tasks', description: 'Task management endpoints' },
      { name: 'Messages', description: 'Message management endpoints' },
      { name: 'Groups', description: 'Group management endpoints' },
      { name: 'Media', description: 'Media handling endpoints' },
      { name: 'Webhooks', description: 'Webhook configuration endpoints' },
      { name: 'Dashboard', description: 'Dashboard and analytics endpoints' }
    ]
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js']
};

export const setupSwagger = (app: Application) => {
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'WhatsApp API Documentation',
    customfavIcon: '/favicon.ico'
  }));
  
  // Serve OpenAPI JSON
  app.get('/api-docs/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

// ========================================
// src/config/redis.ts
// ========================================
import { createClient } from 'redis';
import { logger } from '../utils/logger';

let redisClient: any = null;

export const connectRedis = async () => {
  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      },
      password: process.env.REDIS_PASSWORD
    });

    redisClient.on('error', (err: any) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

// Cache helper functions
export const cache = {
  get: async (key: string) => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  set: async (key: string, value: any, ttl: number = 3600) => {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  del: async (key: string) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  },

  flush: async () => {
    try {
      await redisClient.flushAll();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }
};

// ========================================
// src/middlewares/rateLimiter.middleware.ts
// ========================================
import rateLimit from 'express-rate-limit';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

// Create a Redis store for rate limiting
class RedisStore {
  private client: any;

  constructor() {
    this.client = getRedisClient();
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date | undefined }> {
    const now = Date.now();
    const window = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
    const resetTime = new Date(now + window);

    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, Math.ceil(window / 1000));
      const results = await multi.exec();
      
      const totalHits = results[0];
      
      return { totalHits, resetTime };
    } catch (error) {
      logger.error('Rate limiter Redis error:', error);
      throw error;
    }
  }

  async decrement(key: string): Promise<void> {
    await this.client.decr(key);
  }

  async resetKey(key: string): Promise<void> {
    await this.client.del(key);
  }
}

// General rate limiter
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
});

// Strict rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  }
});

// API key rate limiter (more generous)
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  keyGenerator: (req) => req.headers['x-api-key'] as string || req.ip,
  message: {
    success: false,
    message: 'API rate limit exceeded'
  }
});

// ========================================
// src/middlewares/error.middleware.ts
// ========================================
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as any).userId
  });

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A record with this value already exists'
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode === 500 
      ? 'Internal server error' 
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// ========================================
// src/services/webhook.service.ts
// ========================================
import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const triggerWebhook = async (
  userId: string, 
  event: string, 
  data: any
) => {
  try {
    // Get active webhooks for user and event
    const webhooks = await prisma.webhook.findMany({
      where: {
        userId,
        isActive: true,
        events: {
          has: event
        }
      }
    });

    for (const webhook of webhooks) {
      // Create signature
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(data))
        .digest('hex');

      // Send webhook
      try {
        await axios.post(webhook.url, {
          event,
          data,
          timestamp: new Date().toISOString()
        }, {
          headers: {
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
            'Content-Type': 'application/json'
          },
          timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '10000')
        });

        // Update last triggered
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggered: new Date(),
            failureCount: 0
          }
        });

        logger.info(`Webhook triggered successfully: ${webhook.url} for event ${event}`);
      } catch (error) {
        // Increment failure count
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            failureCount: {
              increment: 1
            }
          }
        });

        logger.error(`Webhook failed: ${webhook.url}`, error);

        // Disable webhook after max retries
        if (webhook.failureCount >= parseInt(process.env.WEBHOOK_MAX_RETRIES || '3')) {
          await prisma.webhook.update({
            where: { id: webhook.id },
            data: { isActive: false }
          });
          
          logger.warn(`Webhook disabled due to repeated failures: ${webhook.url}`);
        }
      }
    }
  } catch (error) {
    logger.error('Webhook service error:', error);
  }
};

// ========================================
// tests/auth.test.ts
// ========================================
import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Authentication', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app.app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Test@123456',
          fullName: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.apiKey).toBeDefined();
    });

    it('should not register user with existing email', async () => {
      const response = await request(app.app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser2',
          password: 'Test@123456',
          fullName: 'Test User 2'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should not login with invalid credentials', async () => {
      const response = await request(app.app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

// ========================================
// nginx.conf
// ========================================
const nginxConfig = `
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml application/atom+xml image/svg+xml text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_status 429;

    # Upstream backend
    upstream backend {
        server app:3000;
    }

    # HTTP server - redirect to HTTPS
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend;
            access_log off;
        }

        # Static files (if any)
        location /static/ {
            alias /usr/share/nginx/html/static/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}
`;