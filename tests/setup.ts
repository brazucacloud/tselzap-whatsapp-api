import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock Redis for tests
jest.mock('./src/config/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    quit: jest.fn(),
    getClient: jest.fn(),
  },
  default: {
    on: jest.fn(),
    connect: jest.fn(),
  },
}));

// Mock Prisma for tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    device: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    license: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    webhook: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    log: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  })),
}));

// Mock JWT for tests
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ userId: 'test-user-id', email: 'test@example.com', role: 'USER' })),
  decode: jest.fn(() => ({ userId: 'test-user-id', exp: Date.now() / 1000 + 3600 })),
}));

// Mock bcrypt for tests
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => 'hashed-password'),
  compare: jest.fn(() => true),
}));

// Mock nodemailer for tests
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' })),
  })),
}));

// Mock QRCode for tests
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,mock-qr-code')),
}));

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    fullName: 'Test User',
    role: 'USER',
    isActive: true,
    apiKey: 'wz_test_api_key',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  mockDevice: {
    id: 'test-device-id',
    userId: 'test-user-id',
    phoneNumber: '+5511999887766',
    deviceName: 'Test Device',
    deviceType: 'NORMAL',
    status: 'ACTIVE',
    isConnected: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  mockMessage: {
    id: 'test-message-id',
    userId: 'test-user-id',
    deviceId: 'test-device-id',
    phoneNumber: '+5511999887766',
    messageType: 'TEXT',
    content: 'Test message',
    status: 'PENDING',
    direction: 'OUTGOING',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};
