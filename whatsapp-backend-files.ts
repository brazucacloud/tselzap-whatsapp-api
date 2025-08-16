// ========================================
// src/middlewares/auth.middleware.ts
// ========================================
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication'
      });
    }

    req.userId = user.id;
    req.userRole = user.role;
    req.user = user;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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

    req.userId = user.id;
    req.userRole = user.role;
    req.user = user;

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

// ========================================
// src/services/queue.service.ts
// ========================================
import Bull from 'bull';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { sendWhatsAppMessage } from './whatsapp.service';
import { triggerWebhook } from './webhook.service';

const prisma = new PrismaClient();

// Create queues
const messageQueue = new Bull('messages', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

const mediaQueue = new Bull('media', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
});

const groupQueue = new Bull('groups', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
});

// Process message queue
messageQueue.process(async (job) => {
  const { taskId, userId, deviceId, data } = job.data;
  
  try {
    logger.info(\`Processing message task \${taskId}\`);
    
    // Update task status
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'PROCESSING',
        executedAt: new Date()
      }
    });

    // Send message via WhatsApp service
    const result = await sendWhatsAppMessage(deviceId, data);

    // Update task as completed
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        result
      }
    });

    // Create message record
    await prisma.message.create({
      data: {
        userId,
        deviceId,
        taskId,
        phoneNumber: data.phoneNumber,
        messageType: 'TEXT',
        content: data.message,
        status: 'SENT',
        deliveredAt: new Date()
      }
    });

    // Trigger webhook
    await triggerWebhook(userId, 'message.sent', {
      taskId,
      phoneNumber: data.phoneNumber,
      message: data.message,
      timestamp: new Date()
    });

    logger.info(\`Message task \${taskId} completed successfully\`);
    return result;
  } catch (error) {
    logger.error(\`Message task \${taskId} failed:\`, error);
    
    // Update task as failed
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'FAILED',
        error: (error as Error).message,
        retryCount: {
          increment: 1
        }
      }
    });

    throw error;
  }
});

// Process media queue
mediaQueue.process(async (job) => {
  const { taskId, userId, deviceId, data } = job.data;
  
  try {
    logger.info(\`Processing media task \${taskId}\`);
    
    // Process media upload and sending
    // Implementation here...
    
    return { success: true };
  } catch (error) {
    logger.error(\`Media task \${taskId} failed:\`, error);
    throw error;
  }
});

// Process group queue
groupQueue.process(async (job) => {
  const { taskId, userId, deviceId, data } = job.data;
  
  try {
    logger.info(\`Processing group task \${taskId}\`);
    
    // Process group operations
    // Implementation here...
    
    return { success: true };
  } catch (error) {
    logger.error(\`Group task \${taskId} failed:\`, error);
    throw error;
  }
});

// Queue event listeners
messageQueue.on('completed', (job, result) => {
  logger.info(\`Job \${job.id} completed\`);
});

messageQueue.on('failed', (job, err) => {
  logger.error(\`Job \${job.id} failed:\`, err);
});

// Add task to appropriate queue
export const addToQueue = async (task: any) => {
  const queueData = {
    taskId: task.id,
    userId: task.userId,
    deviceId: task.deviceId,
    data: task.data
  };

  switch (task.type) {
    case 'MESSAGE':
    case 'BULK_MESSAGE':
      await messageQueue.add('process-message', queueData, {
        priority: task.priority,
        delay: 0
      });
      break;
    
    case 'MEDIA':
      await mediaQueue.add('process-media', queueData, {
        priority: task.priority
      });
      break;
    
    case 'GROUP_JOIN':
    case 'GROUP_LEAVE':
    case 'GROUP_MESSAGE':
      await groupQueue.add('process-group', queueData, {
        priority: task.priority
      });
      break;
    
    default:
      logger.warn(\`Unknown task type: \${task.type}\`);
  }
};

// Get queue statistics
export const getQueueStats = async () => {
  const [messageStats, mediaStats, groupStats] = await Promise.all([
    messageQueue.getJobCounts(),
    mediaQueue.getJobCounts(),
    groupQueue.getJobCounts()
  ]);

  return {
    messages: messageStats,
    media: mediaStats,
    groups: groupStats,
    total: {
      active: messageStats.active + mediaStats.active + groupStats.active,
      waiting: messageStats.waiting + mediaStats.waiting + groupStats.waiting,
      completed: messageStats.completed + mediaStats.completed + groupStats.completed,
      failed: messageStats.failed + mediaStats.failed + groupStats.failed
    }
  };
};

// Clean old jobs
export const cleanQueues = async () => {
  const gracePeriod = 24 * 60 * 60 * 1000; // 24 hours
  
  await Promise.all([
    messageQueue.clean(gracePeriod, 'completed'),
    messageQueue.clean(gracePeriod, 'failed'),
    mediaQueue.clean(gracePeriod, 'completed'),
    mediaQueue.clean(gracePeriod, 'failed'),
    groupQueue.clean(gracePeriod, 'completed'),
    groupQueue.clean(gracePeriod, 'failed')
  ]);
  
  logger.info('Queue cleanup completed');
};

export { messageQueue, mediaQueue, groupQueue };

// ========================================
// src/routes/task.routes.ts
// ========================================
import { Router } from 'express';
import { body, query, param } from 'express-validator';
import taskController from '../controllers/task.controller';
import { authenticate, authenticateApiKey } from '../middlewares/auth.middleware';

const router = Router();

// Mobile app endpoint - Get tasks
router.post(
  '/fetch',
  authenticateApiKey,
  body('phone_normal').optional().isMobilePhone('any'),
  body('phone_business').optional().isMobilePhone('any'),
  taskController.getTasks
);

// Update task status (callback from mobile)
router.put(
  '/:taskId/status',
  authenticateApiKey,
  param('taskId').isUUID(),
  body('status').isIn(['PROCESSING', 'COMPLETED', 'FAILED']),
  body('result').optional(),
  body('error').optional(),
  taskController.updateTaskStatus
);

// Web dashboard endpoints
router.post(
  '/',
  authenticate,
  body('type').isIn(['MESSAGE', 'MEDIA', 'GROUP_JOIN', 'GROUP_LEAVE', 'GROUP_MESSAGE', 'BULK_MESSAGE']),
  body('deviceId').optional().isUUID(),
  body('data').isObject(),
  body('priority').optional().isInt({ min: 1, max: 10 }),
  body('scheduledAt').optional().isISO8601(),
  taskController.createTask
);

router.post(
  '/bulk',
  authenticate,
  body('tasks').isArray({ min: 1, max: 100 }),
  taskController.bulkCreateTasks
);

router.get(
  '/',
  authenticate,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']),
  query('type').optional(),
  query('deviceId').optional().isUUID(),
  taskController.getTaskList
);

router.delete(
  '/:taskId',
  authenticate,
  param('taskId').isUUID(),
  taskController.cancelTask
);

export default router;

// ========================================
// src/websocket/socketServer.ts
// ========================================
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  deviceId?: string;
}

export const setupSocketServer = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.userId;
      
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    logger.info(\`User \${socket.userId} connected via WebSocket\`);
    
    // Join user room
    socket.join(\`user:\${socket.userId}\`);

    // Handle device registration
    socket.on('register_device', async (data) => {
      const { deviceId } = data;
      
      try {
        const device = await prisma.device.findFirst({
          where: {
            id: deviceId,
            userId: socket.userId
          }
        });

        if (device) {
          socket.deviceId = deviceId;
          socket.join(\`device:\${deviceId}\`);
          
          // Update device status
          await prisma.device.update({
            where: { id: deviceId },
            data: {
              isConnected: true,
              lastSeen: new Date()
            }
          });

          socket.emit('device_registered', {
            success: true,
            deviceId
          });

          logger.info(\`Device \${deviceId} registered for user \${socket.userId}\`);
        } else {
          socket.emit('device_registered', {
            success: false,
            error: 'Device not found'
          });
        }
      } catch (error) {
        logger.error('Device registration error:', error);
        socket.emit('device_registered', {
          success: false,
          error: 'Registration failed'
        });
      }
    });

    // Handle QR code generation request
    socket.on('request_qr', async (data) => {
      const { deviceId } = data;
      
      // Generate QR code logic here
      // This would integrate with WhatsApp Web API
      
      socket.emit('qr_code', {
        deviceId,
        qrCode: 'base64_encoded_qr_code_here'
      });
    });

    // Handle message status updates
    socket.on('message_status', async (data) => {
      const { messageId, status } = data;
      
      try {
        await prisma.message.update({
          where: { id: messageId },
          data: {
            status,
            deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
            readAt: status === 'READ' ? new Date() : undefined
          }
        });

        // Notify user
        io.to(\`user:\${socket.userId}\`).emit('message_update', {
          messageId,
          status
        });
      } catch (error) {
        logger.error('Message status update error:', error);
      }
    });

    // Handle incoming messages
    socket.on('incoming_message', async (data) => {
      const { deviceId, from, message, mediaUrl, messageType } = data;
      
      try {
        const newMessage = await prisma.message.create({
          data: {
            userId: socket.userId!,
            deviceId,
            phoneNumber: from,
            messageType: messageType || 'TEXT',
            content: message,
            mediaUrl,
            status: 'DELIVERED',
            direction: 'INCOMING',
            deliveredAt: new Date()
          }
        });

        // Notify user through all connected clients
        io.to(\`user:\${socket.userId}\`).emit('new_message', newMessage);
        
        logger.info(\`Incoming message from \${from} on device \${deviceId}\`);
      } catch (error) {
        logger.error('Incoming message error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      logger.info(\`User \${socket.userId} disconnected\`);
      
      if (socket.deviceId) {
        await prisma.device.update({
          where: { id: socket.deviceId },
          data: {
            isConnected: false,
            lastSeen: new Date()
          }
        });
      }
    });
  });

  // Emit events to specific users/devices
  return {
    emitToUser: (userId: string, event: string, data: any) => {
      io.to(\`user:\${userId}\`).emit(event, data);
    },
    emitToDevice: (deviceId: string, event: string, data: any) => {
      io.to(\`device:\${deviceId}\`).emit(event, data);
    },
    emitToAll: (event: string, data: any) => {
      io.emit(event, data);
    }
  };
};

// ========================================
// .env.example
// ========================================
const envExample = \`
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/whatsapp_automation"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets
JWT_SECRET=your_jwt_secret_key_here_change_this
JWT_REFRESH_SECRET=your_refresh_secret_key_here_change_this
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# WhatsApp API (if using official API)
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_TOKEN=your_whatsapp_token

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Sentry (Optional - for error tracking)
SENTRY_DSN=

# AWS S3 (Optional - for media storage)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Webhook Security
WEBHOOK_TIMEOUT=10000
WEBHOOK_MAX_RETRIES=3
\`;

// ========================================
// docker-compose.yml
// ========================================
const dockerCompose = \`
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: whatsapp_postgres
    environment:
      POSTGRES_USER: whatsapp_user
      POSTGRES_PASSWORD: whatsapp_pass
      POSTGRES_DB: whatsapp_automation
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U whatsapp_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: whatsapp_redis
    command: redis-server --appendonly yes --requirepass redis_password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: whatsapp_app
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://whatsapp_user:whatsapp_pass@postgres:5432/whatsapp_automation
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: redis_password
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  # Nginx Reverse Proxy (Optional)
  nginx:
    image: nginx:alpine
    container_name: whatsapp_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

  # pgAdmin (Optional - for database management)
  pgadmin:
    image: dpage/pgadmin4
    container_name: whatsapp_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
\`;

// ========================================
// Dockerfile
// ========================================
const dockerfile = \`
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Create necessary directories
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]
\`;

// ========================================
// README.md
// ========================================
const readme = \`
# WhatsApp Automation Backend System

A professional, scalable backend system for WhatsApp automation with enterprise-grade features.

## 🚀 Features

- **Multi-device Management**: Support for WhatsApp Business and regular WhatsApp
- **Task Queue System**: Reliable message processing with Bull queue
- **Real-time Updates**: WebSocket support for instant notifications
- **RESTful API**: Well-documented API with Swagger/OpenAPI
- **Authentication & Authorization**: JWT-based auth with role management
- **License Management**: Flexible licensing system with limits
- **Webhook Support**: Event-driven architecture for integrations
- **Rate Limiting**: Protect API from abuse
- **Comprehensive Logging**: Winston logger with rotation
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for performance optimization
- **Docker Support**: Easy deployment with Docker Compose
- **Testing**: Unit, integration, and E2E tests
- **TypeScript**: Type-safe development

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (optional)

## 🛠️ Installation

### Using Docker (Recommended)

1. Clone the repository
\`\`\`bash
git clone https://github.com/your-org/whatsapp-automation-backend.git
cd whatsapp-automation-backend
\`\`\`

2. Configure environment variables
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

3. Start services with Docker Compose
\`\`\`bash
docker-compose up -d
\`\`\`

4. Run database migrations
\`\`\`bash
docker-compose exec app npx prisma migrate deploy
\`\`\`

### Manual Installation

1. Install dependencies
\`\`\`bash
npm install
\`\`\`

2. Configure environment variables
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

3. Run database migrations
\`\`\`bash
npx prisma migrate dev
\`\`\`

4. Start development server
\`\`\`bash
npm run dev
\`\`\`

## 📚 API Documentation

Once the server is running, access the API documentation at:
- Swagger UI: http://localhost:3000/api-docs
- OpenAPI JSON: http://localhost:3000/api-docs/json

## 🔧 Configuration

Key configuration options in \`.env\`:

- \`PORT\`: Server port (default: 3000)
- \`DATABASE_URL\`: PostgreSQL connection string
- \`REDIS_HOST/PORT\`: Redis connection
- \`JWT_SECRET\`: Secret for JWT tokens
- \`RATE_LIMIT_MAX_REQUESTS\`: API rate limiting

## 📱 Mobile App Integration

The system provides endpoints for mobile app integration:

### Authentication
\`\`\`http
POST /api/v1/auth/verify-api-key
Headers:
  X-API-Key: your_api_key
  X-User-ID: user_id
\`\`\`

### Fetch Tasks
\`\`\`http
POST /api/v1/tasks/fetch
Body:
{
  "phone_normal": "+5511999999999",
  "phone_business": null,
  "permissions": ["READ_CONTACTS", "READ_MESSAGES"]
}
\`\`\`

### Update Task Status
\`\`\`http
PUT /api/v1/tasks/{taskId}/status
Body:
{
  "status": "COMPLETED",
  "result": {...}
}
\`\`\`

## 🔐 Security Features

- JWT authentication with refresh tokens
- API key authentication for mobile apps
- Rate limiting per IP/user
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection (Helmet.js)
- CORS configuration
- Environment variable encryption

## 📊 Monitoring & Logging

- Winston logger with daily rotation
- Error tracking ready (Sentry integration)
- Health check endpoint
- Queue monitoring dashboard
- Database query logging

## 🧪 Testing

Run tests with:
\`\`\`bash
# Unit tests
npm run test

# Test coverage
npm run test:coverage

# Watch mode
npm run test:watch
\`\`\`

## 📈 Performance

- Redis caching for frequently accessed data
- Database query optimization with Prisma
- Compression middleware
- Connection pooling
- Horizontal scaling support

## 🚀 Deployment

### Production Deployment Checklist

- [ ] Set \`NODE_ENV=production\`
- [ ] Configure strong JWT secrets
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Set up monitoring (PM2, New Relic, etc.)
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up log aggregation

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 💬 Support

For support, email support@your-domain.com or open an issue.

## 🏗️ Architecture

\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │────▶│   Backend   │────▶│  PostgreSQL │
│     App     │     │   API       │     │   Database  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐     ┌─────────────┐
                    │    Redis    │     │    Bull     │
                    │    Cache    │────▶│   Queues    │
                    └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  WebSocket  │
                    │   Server    │
                    └─────────────┘
\`\`\`

## 🗺️ Roadmap

- [ ] WhatsApp Web integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] AI-powered message templates
- [ ] Bulk import/export features
- [ ] Payment gateway integration
- [ ] Advanced scheduling features
- [ ] Custom webhook templates
\`;

export default readme;