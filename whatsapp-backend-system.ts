// ========================================
// ESTRUTURA DE PASTAS DO PROJETO
// ========================================
/*
whatsapp-automation-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── winston.ts
│   │   └── swagger.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── device.controller.ts
│   │   ├── task.controller.ts
│   │   ├── message.controller.ts
│   │   ├── group.controller.ts
│   │   ├── media.controller.ts
│   │   ├── webhook.controller.ts
│   │   └── dashboard.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   ├── cors.middleware.ts
│   │   └── error.middleware.ts
│   ├── models/
│   │   ├── User.model.ts
│   │   ├── Device.model.ts
│   │   ├── Task.model.ts
│   │   ├── Message.model.ts
│   │   ├── Group.model.ts
│   │   ├── Media.model.ts
│   │   ├── License.model.ts
│   │   └── Log.model.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── device.service.ts
│   │   ├── task.service.ts
│   │   ├── queue.service.ts
│   │   ├── webhook.service.ts
│   │   ├── license.service.ts
│   │   └── notification.service.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── device.routes.ts
│   │   ├── task.routes.ts
│   │   ├── message.routes.ts
│   │   ├── group.routes.ts
│   │   ├── media.routes.ts
│   │   ├── webhook.routes.ts
│   │   └── dashboard.routes.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── validator.ts
│   │   ├── encryption.ts
│   │   ├── tokenGenerator.ts
│   │   └── helpers.ts
│   ├── types/
│   │   ├── index.d.ts
│   │   ├── task.types.ts
│   │   └── api.types.ts
│   ├── queues/
│   │   ├── messageQueue.ts
│   │   ├── mediaQueue.ts
│   │   └── groupQueue.ts
│   ├── websocket/
│   │   └── socketServer.ts
│   └── app.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
*/

// ========================================
// package.json
// ========================================
const packageJson = {
  "name": "whatsapp-automation-backend",
  "version": "2.0.0",
  "description": "Professional WhatsApp Automation Backend System",
  "main": "dist/app.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "migrate": "prisma migrate dev",
    "generate": "prisma generate",
    "seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    "redis": "^4.6.11",
    "bull": "^4.11.5",
    "socket.io": "^4.6.0",
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^4.7.1",
    "dotenv": "^16.3.1",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "express-rate-limit": "^7.1.5",
    "multer": "^1.4.5-lts.1",
    "axios": "^1.6.2",
    "joi": "^17.11.0",
    "uuid": "^9.0.1",
    "moment": "^2.29.4",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@types/node": "^20.10.4",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/swagger-ui-express": "^4.1.6",
    "@types/bull": "^4.10.0",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.1",
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.16",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "prettier": "^3.1.0"
  }
};

// ========================================
// prisma/schema.prisma - Database Schema
// ========================================
const prismaSchema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String    @id @default(uuid())
  email            String    @unique
  username         String    @unique
  password         String
  fullName         String
  role             UserRole  @default(USER)
  isActive         Boolean   @default(true)
  emailVerified    Boolean   @default(false)
  twoFactorEnabled Boolean   @default(false)
  apiKey           String?   @unique
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  lastLogin        DateTime?
  
  devices          Device[]
  tasks            Task[]
  messages         Message[]
  licenses         License[]
  logs             Log[]
  webhooks         Webhook[]
  notifications    Notification[]
}

model Device {
  id                String       @id @default(uuid())
  userId            String
  phoneNumber       String       @unique
  deviceName        String
  deviceType        DeviceType
  status            DeviceStatus @default(INACTIVE)
  sessionData       Json?
  lastSeen          DateTime?
  isConnected       Boolean      @default(false)
  qrCode            String?
  batteryLevel      Int?
  isCharging        Boolean?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  user              User         @relation(fields: [userId], references: [id])
  tasks             Task[]
  messages          Message[]
  groups            GroupMember[]
}

model Task {
  id               String      @id @default(uuid())
  userId           String
  deviceId         String?
  type             TaskType
  status           TaskStatus  @default(PENDING)
  priority         Int         @default(5)
  scheduledAt      DateTime?
  executedAt       DateTime?
  completedAt      DateTime?
  retryCount       Int         @default(0)
  maxRetries       Int         @default(3)
  data             Json
  result           Json?
  error            String?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  
  user             User        @relation(fields: [userId], references: [id])
  device           Device?     @relation(fields: [deviceId], references: [id])
  messages         Message[]
}

model Message {
  id               String         @id @default(uuid())
  userId           String
  deviceId         String
  taskId           String?
  phoneNumber      String
  messageType      MessageType
  content          String?
  mediaUrl         String?
  mediaType        String?
  status           MessageStatus  @default(PENDING)
  direction        MessageDirection @default(OUTGOING)
  isRead           Boolean        @default(false)
  deliveredAt      DateTime?
  readAt           DateTime?
  error            String?
  metadata         Json?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  
  user             User           @relation(fields: [userId], references: [id])
  device           Device         @relation(fields: [deviceId], references: [id])
  task             Task?          @relation(fields: [taskId], references: [id])
}

model Group {
  id               String         @id @default(uuid())
  groupId          String         @unique
  name             String
  description      String?
  inviteLink       String?
  participantCount Int            @default(0)
  isActive         Boolean        @default(true)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  
  members          GroupMember[]
}

model GroupMember {
  id               String         @id @default(uuid())
  groupId          String
  deviceId         String
  role             GroupRole      @default(MEMBER)
  joinedAt         DateTime       @default(now())
  leftAt           DateTime?
  
  group            Group          @relation(fields: [groupId], references: [id])
  device           Device         @relation(fields: [deviceId], references: [id])
  
  @@unique([groupId, deviceId])
}

model License {
  id               String         @id @default(uuid())
  userId           String
  licenseKey       String         @unique
  type             LicenseType
  status           LicenseStatus  @default(ACTIVE)
  deviceLimit      Int            @default(1)
  messageLimit     Int?
  expiresAt        DateTime
  features         Json?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  
  user             User           @relation(fields: [userId], references: [id])
}

model Webhook {
  id               String         @id @default(uuid())
  userId           String
  url              String
  events           String[]
  secret           String
  isActive         Boolean        @default(true)
  lastTriggered    DateTime?
  failureCount     Int            @default(0)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  
  user             User           @relation(fields: [userId], references: [id])
}

model Log {
  id               String         @id @default(uuid())
  userId           String?
  level            LogLevel
  category         String
  message          String
  data             Json?
  ipAddress        String?
  userAgent        String?
  createdAt        DateTime       @default(now())
  
  user             User?          @relation(fields: [userId], references: [id])
}

model Notification {
  id               String         @id @default(uuid())
  userId           String
  type             NotificationType
  title            String
  message          String
  isRead           Boolean        @default(false)
  data             Json?
  createdAt        DateTime       @default(now())
  readAt           DateTime?
  
  user             User           @relation(fields: [userId], references: [id])
}

enum UserRole {
  ADMIN
  MANAGER
  USER
}

enum DeviceType {
  NORMAL
  BUSINESS
}

enum DeviceStatus {
  ACTIVE
  INACTIVE
  BANNED
  DISCONNECTED
}

enum TaskType {
  MESSAGE
  MEDIA
  GROUP_JOIN
  GROUP_LEAVE
  GROUP_MESSAGE
  BULK_MESSAGE
  SCHEDULED_MESSAGE
}

enum TaskStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
  LOCATION
  CONTACT
  STICKER
}

enum MessageStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
}

enum MessageDirection {
  INCOMING
  OUTGOING
}

enum GroupRole {
  ADMIN
  MEMBER
}

enum LicenseType {
  TRIAL
  BASIC
  PRO
  ENTERPRISE
}

enum LicenseStatus {
  ACTIVE
  EXPIRED
  SUSPENDED
  CANCELLED
}

enum LogLevel {
  DEBUG
  INFO
  WARN
  ERROR
  CRITICAL
}

enum NotificationType {
  INFO
  WARNING
  ERROR
  SUCCESS
}
`;

// ========================================
// src/app.ts - Main Application
// ========================================
const appTs = `
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'redis';
import * as cron from 'node-cron';

// Load environment variables
dotenv.config();

// Import configurations
import { logger } from './utils/logger';
import { setupSwagger } from './config/swagger';
import { connectRedis } from './config/redis';
import { initializeQueues } from './queues';

// Import middlewares
import { errorHandler } from './middlewares/error.middleware';
import { rateLimiter } from './middlewares/rateLimiter.middleware';
import { corsOptions } from './middlewares/cors.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import deviceRoutes from './routes/device.routes';
import taskRoutes from './routes/task.routes';
import messageRoutes from './routes/message.routes';
import groupRoutes from './routes/group.routes';
import mediaRoutes from './routes/media.routes';
import webhookRoutes from './routes/webhook.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Import WebSocket handler
import { setupSocketServer } from './websocket/socketServer';

class App {
  public app: Application;
  public server: any;
  public io: Server;
  public prisma: PrismaClient;
  public redis: any;
  private PORT: number;

  constructor() {
    this.app = express();
    this.PORT = parseInt(process.env.PORT || '3000');
    this.prisma = new PrismaClient();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: corsOptions
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeServices();
    this.setupCronJobs();
  }

  private initializeMiddlewares(): void {
    // Security middlewares
    this.app.use(helmet());
    this.app.use(cors(corsOptions));
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // Rate limiting
    this.app.use('/api/', rateLimiter);
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(\`\${req.method} \${req.path}\`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API Routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/devices', deviceRoutes);
    this.app.use('/api/v1/tasks', taskRoutes);
    this.app.use('/api/v1/messages', messageRoutes);
    this.app.use('/api/v1/groups', groupRoutes);
    this.app.use('/api/v1/media', mediaRoutes);
    this.app.use('/api/v1/webhooks', webhookRoutes);
    this.app.use('/api/v1/dashboard', dashboardRoutes);

    // Swagger documentation
    setupSwagger(this.app);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async initializeServices(): Promise<void> {
    try {
      // Connect to Redis
      this.redis = await connectRedis();
      logger.info('✅ Redis connected successfully');

      // Initialize message queues
      await initializeQueues();
      logger.info('✅ Message queues initialized');

      // Setup WebSocket server
      setupSocketServer(this.io);
      logger.info('✅ WebSocket server initialized');

      // Test database connection
      await this.prisma.$connect();
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('Failed to initialize services:', error);
      process.exit(1);
    }
  }

  private setupCronJobs(): void {
    // Clean up old logs every day at midnight
    cron.schedule('0 0 * * *', async () => {
      logger.info('Running daily cleanup job');
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        await this.prisma.log.deleteMany({
          where: {
            createdAt: {
              lt: thirtyDaysAgo
            }
          }
        });
        
        logger.info('Daily cleanup completed');
      } catch (error) {
        logger.error('Daily cleanup failed:', error);
      }
    });

    // Check license expiration every hour
    cron.schedule('0 * * * *', async () => {
      logger.info('Checking license expirations');
      try {
        const expiredLicenses = await this.prisma.license.updateMany({
          where: {
            expiresAt: {
              lt: new Date()
            },
            status: 'ACTIVE'
          },
          data: {
            status: 'EXPIRED'
          }
        });
        
        if (expiredLicenses.count > 0) {
          logger.info(\`Expired \${expiredLicenses.count} licenses\`);
        }
      } catch (error) {
        logger.error('License check failed:', error);
      }
    });

    // Process pending tasks every minute
    cron.schedule('* * * * *', async () => {
      try {
        const pendingTasks = await this.prisma.task.findMany({
          where: {
            status: 'PENDING',
            scheduledAt: {
              lte: new Date()
            }
          },
          take: 10
        });

        for (const task of pendingTasks) {
          // Add to appropriate queue based on task type
          logger.info(\`Processing scheduled task \${task.id}\`);
          // Queue processing logic here
        }
      } catch (error) {
        logger.error('Task processing failed:', error);
      }
    });
  }

  public async start(): Promise<void> {
    this.server.listen(this.PORT, () => {
      logger.info(\`
        ################################################
        🚀 Server listening on port: \${this.PORT}
        🌍 Environment: \${process.env.NODE_ENV || 'development'}
        📚 API Docs: http://localhost:\${this.PORT}/api-docs
        ################################################
      \`);
    });
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down server...');
    
    try {
      await this.prisma.$disconnect();
      if (this.redis) {
        await this.redis.quit();
      }
      this.server.close();
      logger.info('Server shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start application
const application = new App();
application.start();

// Graceful shutdown
process.on('SIGTERM', () => application.shutdown());
process.on('SIGINT', () => application.shutdown());
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  application.shutdown();
});
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  application.shutdown();
});

export default application;
`;

// ========================================
// src/controllers/auth.controller.ts
// ========================================
const authController = `
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { generateApiKey } from '../utils/tokenGenerator';
import { sendEmail } from '../services/notification.service';

const prisma = new PrismaClient();

export class AuthController {
  // User registration
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, username, password, fullName } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email or username'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Generate API key
      const apiKey = generateApiKey();

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          fullName,
          apiKey
        },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          apiKey: true,
          createdAt: true
        }
      });

      // Create trial license
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days trial

      await prisma.license.create({
        data: {
          userId: user.id,
          licenseKey: generateApiKey(),
          type: 'TRIAL',
          deviceLimit: 1,
          messageLimit: 100,
          expiresAt: expiryDate
        }
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Send welcome email
      await sendEmail({
        to: user.email,
        subject: 'Welcome to WhatsApp Automation Platform',
        template: 'welcome',
        data: { fullName, apiKey }
      });

      logger.info(\`New user registered: \${user.email}\`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          token,
          apiKey
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  }

  // User login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          licenses: {
            where: {
              status: 'ACTIVE'
            }
          }
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Log activity
      await prisma.log.create({
        data: {
          userId: user.id,
          level: 'INFO',
          category: 'AUTH',
          message: 'User logged in',
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      logger.info(\`User logged in: \${user.email}\`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            hasActiveLicense: user.licenses.length > 0
          },
          token,
          apiKey: user.apiKey
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  // Refresh token
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

      // Generate new access token
      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: {
          token: newToken
        }
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  // Logout
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Log activity
      await prisma.log.create({
        data: {
          userId: (req as any).userId,
          level: 'INFO',
          category: 'AUTH',
          message: 'User logged out',
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      next(error);
    }
  }

  // Verify API Key (for mobile app)
  async verifyApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      const userId = req.headers['x-user-id'] as string;

      if (!apiKey || !userId) {
        return res.status(401).json({
          success: false,
          message: 'API key and user ID required'
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          apiKey: apiKey,
          isActive: true
        },
        include: {
          licenses: {
            where: {
              status: 'ACTIVE',
              expiresAt: {
                gt: new Date()
              }
            }
          }
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid API key or user ID'
        });
      }

      if (user.licenses.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No active license found'
        });
      }

      res.json({
        success: true,
        message: 'API key verified',
        data: {
          userId: user.id,
          hasActiveLicense: true,
          license: user.licenses[0]
        }
      });
    } catch (error) {
      logger.error('API key verification error:', error);
      next(error);
    }
  }
}

export default new AuthController();
`;

// ========================================
// src/controllers/task.controller.ts
// ========================================
const taskController = `
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { addToQueue } from '../services/queue.service';
import { triggerWebhook } from '../services/webhook.service';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class TaskController {
  // Get tasks for mobile app
  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone_normal, phone_business, permissions } = req.body;
      const userId = req.headers['x-user-id'] as string;

      // Verify device
      const device = await prisma.device.findFirst({
        where: {
          userId,
          phoneNumber: phone_normal || phone_business,
          status: 'ACTIVE'
        }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or inactive'
        });
      }

      // Update device status
      await prisma.device.update({
        where: { id: device.id },
        data: {
          lastSeen: new Date(),
          isConnected: true
        }
      });

      // Get pending tasks
      const tasks = await prisma.task.findMany({
        where: {
          userId,
          deviceId: device.id,
          status: 'PENDING',
          OR: [
            { scheduledAt: null },
            { scheduledAt: { lte: new Date() } }
          ]
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ],
        take: 10
      });

      // Format tasks for mobile app
      const formattedTasks = tasks.map(task => {
        const data = task.data as any;
        const baseTask = {
          id: task.id,
          package: device.deviceType.toLowerCase()
        };

        switch (task.type) {
          case 'MESSAGE':
            return {
              ...baseTask,
              type: 'chat',
              number: data.phoneNumber,
              text: data.message,
              actionChat: 'send'
            };
          
          case 'MEDIA':
            return {
              ...baseTask,
              type: 'media',
              url: data.mediaUrl,
              mediaType: data.mediaType,
              text: data.caption || '',
              number: data.phoneNumber
            };
          
          case 'GROUP_JOIN':
            return {
              ...baseTask,
              type: 'group',
              link: data.inviteLink,
              text: data.message || '',
              actionChat: 'join'
            };
          
          case 'GROUP_MESSAGE':
            return {
              ...baseTask,
              type: 'group_message',
              groupId: data.groupId,
              text: data.message
            };
          
          case 'BULK_MESSAGE':
            return {
              ...baseTask,
              type: 'bulk',
              numbers: data.phoneNumbers,
              text: data.message,
              delay: data.delay || 5000
            };
          
          default:
            return null;
        }
      }).filter(Boolean);

      // Update task status
      if (tasks.length > 0) {
        await prisma.task.updateMany({
          where: {
            id: { in: tasks.map(t => t.id) }
          },
          data: {
            status: 'PROCESSING',
            executedAt: new Date()
          }
        });
      }

      res.json(formattedTasks);
    } catch (error) {
      logger.error('Get tasks error:', error);
      next(error);
    }
  }

  // Create new task
  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).userId;
      const { type, deviceId, data, priority, scheduledAt } = req.body;

      // Verify device ownership
      if (deviceId) {
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
      }

      // Check user's message limit
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

      if (!user?.licenses[0]) {
        return res.status(403).json({
          success: false,
          message: 'No active license found'
        });
      }

      const license = user.licenses[0];
      if (license.messageLimit) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const messageCount = await prisma.message.count({
          where: {
            userId,
            createdAt: { gte: today }
          }
        });

        if (messageCount >= license.messageLimit) {
          return res.status(429).json({
            success: false,
            message: 'Daily message limit reached'
          });
        }
      }

      // Create task
      const task = await prisma.task.create({
        data: {
          userId,
          deviceId,
          type,
          data,
          priority: priority || 5,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null
        }
      });

      // Add to queue if not scheduled
      if (!scheduledAt) {
        await addToQueue(task);
      }

      // Trigger webhook
      await triggerWebhook(userId, 'task.created', task);

      logger.info(\`Task created: \${task.id}\`);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task
      });
    } catch (error) {
      logger.error('Create task error:', error);
      next(error);
    }
  }

  // Update task status (callback from mobile app)
  async updateTaskStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const { status, result, error } = req.body;
      const userId = req.headers['x-user-id'] as string;

      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          userId
        }
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          status,
          result,
          error,
          completedAt: status === 'COMPLETED' ? new Date() : null
        }
      });

      // Create message record if task completed
      if (status === 'COMPLETED' && task.type === 'MESSAGE') {
        const taskData = task.data as any;
        await prisma.message.create({
          data: {
            userId,
            deviceId: task.deviceId!,
            taskId: task.id,
            phoneNumber: taskData.phoneNumber,
            messageType: 'TEXT',
            content: taskData.message,
            status: 'SENT',
            deliveredAt: new Date()
          }
        });
      }

      // Trigger webhook
      await triggerWebhook(userId, \`task.\${status.toLowerCase()}\`, updatedTask);

      logger.info(\`Task \${taskId} status updated to \${status}\`);

      res.json({
        success: true,
        message: 'Task status updated',
        data: updatedTask
      });
    } catch (error) {
      logger.error('Update task status error:', error);
      next(error);
    }
  }

  // Get task list
  async getTaskList(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { page = 1, limit = 10, status, type, deviceId } = req.query;

      const where: any = { userId };
      if (status) where.status = status;
      if (type) where.type = type;
      if (deviceId) where.deviceId = deviceId;

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
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
        prisma.task.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          tasks,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Get task list error:', error);
      next(error);
    }
  }

  // Cancel task
  async cancelTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const userId = (req as any).userId;

      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          userId,
          status: 'PENDING'
        }
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found or cannot be cancelled'
        });
      }

      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'CANCELLED' }
      });

      logger.info(\`Task \${taskId} cancelled\`);

      res.json({
        success: true,
        message: 'Task cancelled successfully'
      });
    } catch (error) {
      logger.error('Cancel task error:', error);
      next(error);
    }
  }

  // Bulk create tasks
  async bulkCreateTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).userId;
      const { tasks } = req.body;

      // Validate all tasks
      const tasksToCreate = tasks.map((task: any) => ({
        id: uuidv4(),
        userId,
        type: task.type,
        deviceId: task.deviceId,
        data: task.data,
        priority: task.priority || 5,
        scheduledAt: task.scheduledAt ? new Date(task.scheduledAt) : null,
        status: 'PENDING'
      }));

      // Create all tasks
      const createdTasks = await prisma.task.createMany({
        data: tasksToCreate
      });

      logger.info(\`Bulk created \${createdTasks.count} tasks\`);

      res.status(201).json({
        success: true,
        message: \`Created \${createdTasks.count} tasks successfully\`,
        data: {
          count: createdTasks.count
        }
      });
    } catch (error) {
      logger.error('Bulk create tasks error:', error);
      next(error);
    }
  }
}

export default new TaskController();
`;

// Continue with more implementation files...
// This is a comprehensive backend system structure with all the necessary components