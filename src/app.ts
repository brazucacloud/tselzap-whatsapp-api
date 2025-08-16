import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/notFound.middleware';
import { initializeQueues } from './queues';
import { initializeSocket } from './config/socket';
import { cache } from './config/redis';

// Import routes
import authRoutes from './routes/auth.routes';
import deviceRoutes from './routes/device.routes';
import messageRoutes from './routes/message.routes';
import dashboardRoutes from './routes/dashboard.routes';
import mobzapRoutes from './routes/mobzap.routes';
import { webRouter as whatsappWebRoutes } from './routes/whatsapp-web.routes';
import webhookRoutes from './routes/webhook.routes';
import userRoutes from './routes/user.routes';
import licenseRoutes from './routes/license.routes';

// Load environment variables
dotenv.config();

class App {
  public app: express.Application;
  public server: any;
  public io: Server;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
    this.initializeSocket();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-User-ID']
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api/', limiter);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
      });
    });
  }

  private initializeRoutes(): void {
    // API Routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/devices', deviceRoutes);
    this.app.use('/api/v1/messages', messageRoutes);
    this.app.use('/api/v1/dashboard', dashboardRoutes);
    this.app.use('/api/v1/mobzap', mobzapRoutes);
    this.app.use('/api/v1/whatsapp', whatsappWebRoutes);
    this.app.use('/api/v1/webhooks', webhookRoutes);
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/licenses', licenseRoutes);

    // Static files for frontend
    this.app.use('/uploads', express.static('uploads'));
  }

  private initializeSwagger(): void {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'WhatsApp Automation API',
          version: '2.0.0',
          description: 'Professional WhatsApp automation platform API documentation',
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
            url: process.env.API_URL || 'http://localhost:3000/api/v1',
            description: 'Development server'
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
          }
        },
        security: [
          {
            bearerAuth: []
          },
          {
            apiKeyAuth: []
          }
        ]
      },
      apis: ['./src/routes/*.ts', './src/controllers/*.ts']
    };

    const specs = swaggerJsdoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'WhatsApp Automation API Documentation'
    }));
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Error handler
    this.app.use(errorHandler);
  }

  private initializeSocket(): void {
    initializeSocket(this.io);
  }

  public async start(): Promise<void> {
    try {
      // Initialize queues
      await initializeQueues();
      logger.info('Queues initialized successfully');

      // Test Redis connection
      await cache.set('health:check', 'ok', 1);
      logger.info('Redis connection established');

      const port = process.env.PORT || 3000;
      
      this.server.listen(port, () => {
        logger.info(`🚀 Server running on port ${port}`);
        logger.info(`📚 API Documentation: http://localhost:${port}/api-docs`);
        logger.info(`🔗 Health Check: http://localhost:${port}/health`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down server...');
    
    try {
      // Close server
      this.server.close();
      
      // Close Redis connection
      await cache.quit();
      
      // Close queues
      // await closeQueues();
      
      logger.info('Server shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start the application
const app = new App();

if (require.main === module) {
  app.start();
}

export default app;
