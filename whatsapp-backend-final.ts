// ========================================
// tsconfig.json
// ========================================
const tsConfig = {
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "allowJs": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "incremental": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "typeRoots": ["./node_modules/@types", "./src/types"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@config/*": ["src/config/*"],
      "@controllers/*": ["src/controllers/*"],
      "@middlewares/*": ["src/middlewares/*"],
      "@models/*": ["src/models/*"],
      "@routes/*": ["src/routes/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
};

// ========================================
// jest.config.js
// ========================================
const jestConfig = `
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.mock.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  verbose: true,
};
`;

// ========================================
// .eslintrc.js
// ========================================
const eslintConfig = `
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  env: {
    node: true,
    es2020: true,
    jest: true,
  },
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-duplicate-imports': 'error',
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.js'],
};
`;

// ========================================
// .prettierrc
// ========================================
const prettierConfig = {
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
};

// ========================================
// src/queues/index.ts
// ========================================
const queuesIndex = `
import { messageQueue, mediaQueue, groupQueue } from '../services/queue.service';
import { logger } from '../utils/logger';

export const initializeQueues = async () => {
  try {
    // Clear stuck jobs on startup
    await messageQueue.obliterate({ force: true });
    await mediaQueue.obliterate({ force: true });
    await groupQueue.obliterate({ force: true });

    // Set up queue event listeners
    setupQueueListeners();

    logger.info('Queues initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize queues:', error);
    throw error;
  }
};

const setupQueueListeners = () => {
  // Message queue events
  messageQueue.on('active', (job) => {
    logger.info(\`Message job \${job.id} started processing\`);
  });

  messageQueue.on('completed', (job, result) => {
    logger.info(\`Message job \${job.id} completed\`, result);
  });

  messageQueue.on('failed', (job, err) => {
    logger.error(\`Message job \${job.id} failed\`, err);
  });

  messageQueue.on('stalled', (job) => {
    logger.warn(\`Message job \${job.id} stalled\`);
  });

  // Media queue events
  mediaQueue.on('active', (job) => {
    logger.info(\`Media job \${job.id} started processing\`);
  });

  mediaQueue.on('completed', (job, result) => {
    logger.info(\`Media job \${job.id} completed\`, result);
  });

  mediaQueue.on('failed', (job, err) => {
    logger.error(\`Media job \${job.id} failed\`, err);
  });

  // Group queue events
  groupQueue.on('active', (job) => {
    logger.info(\`Group job \${job.id} started processing\`);
  });

  groupQueue.on('completed', (job, result) => {
    logger.info(\`Group job \${job.id} completed\`, result);
  });

  groupQueue.on('failed', (job, err) => {
    logger.error(\`Group job \${job.id} failed\`, err);
  });
};
`;

// ========================================
// src/types/index.d.ts
// ========================================
const typesIndex = `
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      user?: any;
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface TaskData {
  phoneNumber?: string;
  phoneNumbers?: string[];
  message?: string;
  mediaUrl?: string;
  mediaType?: string;
  caption?: string;
  groupId?: string;
  inviteLink?: string;
  delay?: number;
  [key: string]: any;
}

export interface DeviceSession {
  deviceId: string;
  sessionData: any;
  isConnected: boolean;
  lastSeen: Date;
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  signature?: string;
}

export interface QueueJob {
  taskId: string;
  userId: string;
  deviceId: string;
  data: TaskData;
}

export interface MessageFilter {
  userId: string;
  deviceId?: string;
  phoneNumber?: string;
  status?: string;
  direction?: string;
  messageType?: string;
  startDate?: Date;
  endDate?: Date;
}
`;

// ========================================
// PM2 ecosystem.config.js
// ========================================
const pm2Config = `
module.exports = {
  apps: [
    {
      name: 'whatsapp-api',
      script: './dist/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      max_memory_restart: '1G',
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      autorestart: true,
      cron_restart: '0 0 * * *', // Restart daily at midnight
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      kill_timeout: 5000,
      listen_timeout: 5000,
      shutdown_with_message: true
    },
    {
      name: 'whatsapp-worker',
      script: './dist/workers/queue.worker.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      max_memory_restart: '500M',
      autorestart: true
    }
  ]
};
`;

// ========================================
// src/workers/queue.worker.ts
// ========================================
const queueWorker = `
import { PrismaClient } from '@prisma/client';
import { messageQueue, mediaQueue, groupQueue } from '../services/queue.service';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

class QueueWorker {
  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      await prisma.$connect();
      logger.info('Queue worker connected to database');

      // Start processing queues
      this.startProcessing();

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());
    } catch (error) {
      logger.error('Queue worker initialization failed:', error);
      process.exit(1);
    }
  }

  private startProcessing() {
    logger.info('Queue worker started processing jobs');

    // Process jobs with concurrency
    messageQueue.process(10, async (job) => {
      return await this.processMessageJob(job);
    });

    mediaQueue.process(5, async (job) => {
      return await this.processMediaJob(job);
    });

    groupQueue.process(3, async (job) => {
      return await this.processGroupJob(job);
    });
  }

  private async processMessageJob(job: any) {
    const { taskId, data } = job.data;
    
    try {
      logger.info(\`Processing message job for task \${taskId}\`);
      
      // Process message sending logic
      // Update task status
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      return { success: true, taskId };
    } catch (error) {
      logger.error(\`Message job failed for task \${taskId}:\`, error);
      throw error;
    }
  }

  private async processMediaJob(job: any) {
    const { taskId, data } = job.data;
    
    try {
      logger.info(\`Processing media job for task \${taskId}\`);
      
      // Process media sending logic
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      return { success: true, taskId };
    } catch (error) {
      logger.error(\`Media job failed for task \${taskId}:\`, error);
      throw error;
    }
  }

  private async processGroupJob(job: any) {
    const { taskId, data } = job.data;
    
    try {
      logger.info(\`Processing group job for task \${taskId}\`);
      
      // Process group operation logic
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      return { success: true, taskId };
    } catch (error) {
      logger.error(\`Group job failed for task \${taskId}:\`, error);
      throw error;
    }
  }

  private async shutdown() {
    logger.info('Queue worker shutting down...');
    
    try {
      await messageQueue.close();
      await mediaQueue.close();
      await groupQueue.close();
      await prisma.$disconnect();
      
      logger.info('Queue worker shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during queue worker shutdown:', error);
      process.exit(1);
    }
  }
}

// Start worker
new QueueWorker();
`;

// ========================================
// scripts/setup.sh
// ========================================
const setupScript = `#!/bin/bash

echo "🚀 WhatsApp Automation Backend Setup"
echo "====================================="

# Check Node.js version
NODE_VERSION=\$(node -v)
echo "✓ Node.js version: \$NODE_VERSION"

# Check if PostgreSQL is installed
if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL is installed"
else
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Check if Redis is installed
if command -v redis-cli &> /dev/null; then
    echo "✓ Redis is installed"
else
    echo "❌ Redis is not installed. Please install Redis first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created. Please update it with your configuration."
else
    echo "✓ .env file already exists"
fi

# Install dependencies
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate
echo "✓ Prisma client generated"

# Run database migrations
echo "Running database migrations..."
npx prisma migrate dev --name init
echo "✓ Database migrations completed"

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p logs uploads
echo "✓ Directories created"

# Set permissions
chmod +x scripts/*.sh
echo "✓ Permissions set"

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with the correct configuration"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Access the API documentation at http://localhost:3000/api-docs"
echo ""
`;

// ========================================
// scripts/deploy.sh
// ========================================
const deployScript = `#!/bin/bash

echo "🚀 Deploying WhatsApp Automation Backend"
echo "========================================"

# Load environment
ENV=\${1:-production}
echo "Environment: \$ENV"

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Install/update dependencies
echo "Installing dependencies..."
npm ci --only=production

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "Building application..."
npm run build

# Restart services
echo "Restarting services..."
pm2 restart ecosystem.config.js --env \$ENV

# Check service status
pm2 status

echo ""
echo "✅ Deployment completed successfully!"
echo ""
`;

// ========================================
// scripts/backup.sh
// ========================================
const backupScript = `#!/bin/bash

# Database backup script
BACKUP_DIR="/var/backups/whatsapp-api"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
DB_NAME="whatsapp_automation"
BACKUP_FILE="\$BACKUP_DIR/backup_\$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p \$BACKUP_DIR

# Create database backup
echo "Creating database backup..."
pg_dump \$DB_NAME > \$BACKUP_FILE

# Compress backup
gzip \$BACKUP_FILE

# Delete backups older than 30 days
find \$BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "✓ Backup completed: \${BACKUP_FILE}.gz"
`;

// ========================================
// GitHub Actions CI/CD - .github/workflows/ci.yml
// ========================================
const githubActions = `
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js 18.x
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Setup test database
      env:
        DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
      run: |
        npx prisma generate
        npx prisma migrate deploy

    - name: Run tests
      env:
        DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
        REDIS_HOST: localhost
        REDIS_PORT: 6379
        JWT_SECRET: test_secret
        NODE_ENV: test
      run: npm test

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js 18.x
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Build Docker image
      run: docker build -t whatsapp-api:latest .

    - name: Push to Docker Hub
      if: success()
      run: |
        echo \${{ secrets.DOCKER_PASSWORD }} | docker login -u \${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker tag whatsapp-api:latest \${{ secrets.DOCKER_USERNAME }}/whatsapp-api:latest
        docker push \${{ secrets.DOCKER_USERNAME }}/whatsapp-api:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: \${{ secrets.HOST }}
        username: \${{ secrets.USERNAME }}
        key: \${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/whatsapp-api
          git pull origin main
          npm ci --only=production
          npx prisma migrate deploy
          npm run build
          pm2 restart ecosystem.config.js --env production
`;

// ========================================
// API Documentation - openapi.yaml
// ========================================
const openApiSpec = `
openapi: 3.0.0
info:
  title: WhatsApp Automation API
  version: 2.0.0
  description: Professional WhatsApp automation backend system
  contact:
    name: API Support
    email: support@whatsapp-automation.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: http://localhost:3000/api/v1
    description: Development server
  - url: https://api.whatsapp-automation.com/api/v1
    description: Production server

security:
  - bearerAuth: []
  - apiKeyAuth: []

paths:
  /auth/register:
    post:
      summary: Register new user
      tags: [Authentication]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - username
                - password
                - fullName
              properties:
                email:
                  type: string
                  format: email
                username:
                  type: string
                password:
                  type: string
                  minLength: 8
                fullName:
                  type: string
      responses:
        201:
          description: User registered successfully
        409:
          description: User already exists

  /tasks/fetch:
    post:
      summary: Fetch tasks for mobile app
      tags: [Tasks]
      security:
        - apiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                phone_normal:
                  type: string
                phone_business:
                  type: string
                permissions:
                  type: array
                  items:
                    type: string
      responses:
        200:
          description: List of tasks to execute
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
                    type:
                      type: string
                    data:
                      type: object

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        username:
          type: string
        fullName:
          type: string
        role:
          type: string
          enum: [ADMIN, MANAGER, USER]
        createdAt:
          type: string
          format: date-time
`;