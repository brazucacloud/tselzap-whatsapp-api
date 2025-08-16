// ========================================
// src/routes/mobzap.routes.ts - Rotas específicas para MobZap
// ========================================

import { Router } from 'express';
import { body, header, param } from 'express-validator';
import { authenticateApiKey } from '../middlewares/auth.middleware';
import MobZapService from '../services/mobzap.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @api {post} /api/v1/mobzap/fetch Buscar tarefas (MobZap)
 * @apiName FetchTasks
 * @apiGroup MobZap
 * @apiVersion 2.0.0
 * 
 * @apiHeader {String} X-API-Key API key do usuário
 * @apiHeader {String} X-User-ID ID do usuário
 * 
 * @apiParam {String} [phone_normal] Número WhatsApp normal
 * @apiParam {String} [phone_business] Número WhatsApp Business
 * @apiParam {String[]} [permissions] Permissões do dispositivo
 * @apiParam {Number} [battery_level] Nível da bateria
 * @apiParam {Boolean} [is_charging] Se está carregando
 * @apiParam {String} [whatsapp_version] Versão do WhatsApp
 * @apiParam {String} [android_version] Versão do Android
 * @apiParam {String} [device_model] Modelo do dispositivo
 * 
 * @apiSuccess {Object[]} tasks Array de tarefas
 * @apiSuccess {String} tasks.id ID da tarefa
 * @apiSuccess {String} tasks.type Tipo da tarefa (chat/media/group)
 * @apiSuccess {String} tasks.package Pacote (normal/business)
 * @apiSuccess {String} tasks.number Número de telefone
 * @apiSuccess {String} tasks.text Texto da mensagem
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "id": "task_123",
 *         "type": "chat",
 *         "package": "normal",
 *         "number": "5511999887766",
 *         "text": "Olá! Esta é uma mensagem automática.",
 *         "actionChat": "send"
 *       }
 *     ]
 */
router.post(
  '/fetch',
  authenticateApiKey,
  body('phone_normal').optional().isMobilePhone('any'),
  body('phone_business').optional().isMobilePhone('any'),
  body('permissions').optional().isArray(),
  body('battery_level').optional().isInt({ min: 0, max: 100 }),
  body('is_charging').optional().isBoolean(),
  async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      const tasks = await MobZapService.fetchTasks(userId, req.body);
      
      // Log para auditoria
      logger.info(`MobZap fetch: ${tasks.length} tasks sent to user ${userId}`);
      
      res.json(tasks);
    } catch (error) {
      logger.error('MobZap fetch error:', error);
      next(error);
    }
  }
);

/**
 * @api {post} /api/v1/mobzap/callback Callback de status (MobZap)
 * @apiName TaskCallback
 * @apiGroup MobZap
 * @apiVersion 2.0.0
 */
router.post(
  '/callback',
  authenticateApiKey,
  body('taskId').isString(),
  body('status').isIn(['completed', 'failed', 'processing']),
  body('result').optional(),
  body('error').optional().isString(),
  body('messageId').optional().isString(),
  body('timestamp').isISO8601(),
  async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      await MobZapService.processCallback(userId, req.body);
      
      res.json({ success: true, message: 'Callback processed' });
    } catch (error) {
      logger.error('MobZap callback error:', error);
      next(error);
    }
  }
);

/**
 * @api {post} /api/v1/mobzap/message/receive Receber mensagem (MobZap)
 * @apiName ReceiveMessage
 * @apiGroup MobZap
 * @apiVersion 2.0.0
 */
router.post(
  '/message/receive',
  authenticateApiKey,
  body('deviceId').isString(),
  body('from').isMobilePhone('any'),
  body('message').optional().isString(),
  body('mediaUrl').optional().isURL(),
  body('mediaType').optional().isString(),
  body('timestamp').isISO8601(),
  async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { deviceId, ...messageData } = req.body;
      
      await MobZapService.receiveMessage(userId, deviceId, messageData);
      
      res.json({ success: true, message: 'Message received' });
    } catch (error) {
      logger.error('MobZap receive message error:', error);
      next(error);
    }
  }
);

/**
 * @api {get} /api/v1/mobzap/devices Status dos dispositivos
 * @apiName GetDevicesStatus
 * @apiGroup MobZap
 * @apiVersion 2.0.0
 */
router.get(
  '/devices',
  authenticateApiKey,
  async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      const devices = await MobZapService.getConnectedDevices(userId);
      
      res.json({
        success: true,
        data: devices
      });
    } catch (error) {
      logger.error('Get devices status error:', error);
      next(error);
    }
  }
);

export default router;

// ========================================
// src/routes/whatsapp-web.routes.ts - Rotas WhatsApp Web
// ========================================

import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate } from '../middlewares/auth.middleware';
import WhatsAppWebService from '../services/whatsapp-web.service';
import { logger } from '../utils/logger';

const webRouter = Router();

/**
 * @api {post} /api/v1/whatsapp/session/:deviceId/init Inicializar sessão WhatsApp Web
 * @apiName InitSession
 * @apiGroup WhatsAppWeb
 * @apiVersion 2.0.0
 */
webRouter.post(
  '/session/:deviceId/init',
  authenticate,
  param('deviceId').isUUID(),
  async (req, res, next) => {
    try {
      const { deviceId } = req.params;
      const userId = (req as any).userId;
      
      const result = await WhatsAppWebService.initializeSession(deviceId, userId);
      
      res.json({
        success: true,
        message: result
      });
    } catch (error) {
      logger.error('Init WhatsApp session error:', error);
      next(error);
    }
  }
);

/**
 * @api {delete} /api/v1/whatsapp/session/:deviceId Destruir sessão
 * @apiName DestroySession
 * @apiGroup WhatsAppWeb
 * @apiVersion 2.0.0
 */
webRouter.delete(
  '/session/:deviceId',
  authenticate,
  param('deviceId').isUUID(),
  async (req, res, next) => {
    try {
      const { deviceId } = req.params;
      
      await WhatsAppWebService.destroySession(deviceId);
      
      res.json({
        success: true,
        message: 'Session destroyed'
      });
    } catch (error) {
      logger.error('Destroy WhatsApp session error:', error);
      next(error);
    }
  }
);

/**
 * @api {get} /api/v1/whatsapp/sessions Status das sessões
 * @apiName GetSessionsStatus
 * @apiGroup WhatsAppWeb
 * @apiVersion 2.0.0
 */
webRouter.get(
  '/sessions',
  authenticate,
  async (req, res, next) => {
    try {
      const sessions = WhatsAppWebService.getSessionsStatus();
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      logger.error('Get sessions status error:', error);
      next(error);
    }
  }
);

export { webRouter };

// ========================================
// API Documentation - Postman Collection
// ========================================

const postmanCollection = {
  "info": {
    "name": "WhatsApp Automation API",
    "description": "Complete API collection for WhatsApp automation backend",
    "version": "2.0.0",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{auth_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api/v1",
      "type": "string"
    },
    {
      "key": "auth_token",
      "value": "",
      "type": "string"
    },
    {
      "key": "api_key",
      "value": "",
      "type": "string"
    },
    {
      "key": "user_id",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": JSON.stringify({
                "email": "user@example.com",
                "username": "testuser",
                "password": "Test@123456",
                "fullName": "Test User"
              }, null, 2)
            },
            "url": {
              "raw": "{{base_url}}/auth/register",
              "host": ["{{base_url}}"],
              "path": ["auth", "register"]
            }
          },
          "response": []
        },
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('auth_token', response.data.token);",
                  "    pm.environment.set('api_key', response.data.apiKey);",
                  "    pm.environment.set('user_id', response.data.user.id);",
                  "}"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": JSON.stringify({
                "email": "user@example.com",
                "password": "Test@123456"
              }, null, 2)
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "MobZap Integration",
      "item": [
        {
          "name": "Fetch Tasks",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{api_key}}"
              },
              {
                "key": "X-User-ID",
                "value": "{{user_id}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": JSON.stringify({
                "phone_normal": "+5511999887766",
                "permissions": ["READ_CONTACTS", "READ_MESSAGES"],
                "battery_level": 85,
                "is_charging": false,
                "device_model": "Samsung Galaxy S21"
              }, null, 2)
            },
            "url": {
              "raw": "{{base_url}}/mobzap/fetch",
              "host": ["{{base_url}}"],
              "path": ["mobzap", "fetch"]
            }
          }
        },
        {
          "name": "Task Callback",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{api_key}}"
              },
              {
                "key": "X-User-ID",
                "value": "{{user_id}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": JSON.stringify({
                "taskId": "task_123",
                "status": "completed",
                "result": {
                  "messageId": "msg_456",
                  "deliveredAt": "2024-01-15T10:30:00Z"
                },
                "timestamp": "2024-01-15T10:30:00Z"
              }, null, 2)
            },
            "url": {
              "raw": "{{base_url}}/mobzap/callback",
              "host": ["{{base_url}}"],
              "path": ["mobzap", "callback"]
            }
          }
        }
      ]
    },
    {
      "name": "Messages",
      "item": [
        {
          "name": "Send Message",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": JSON.stringify({
                "deviceId": "{{device_id}}",
                "phoneNumber": "+5511999887766",
                "messageType": "TEXT",
                "content": "Hello from API!"
              }, null, 2)
            },
            "url": {
              "raw": "{{base_url}}/messages",
              "host": ["{{base_url}}"],
              "path": ["messages"]
            }
          }
        },
        {
          "name": "Get Messages",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/messages?page=1&limit=20",
              "host": ["{{base_url}}"],
              "path": ["messages"],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "limit",
                  "value": "20"
                }
              ]
            }
          }
        }
      ]
    }
  ]
};

// ========================================
// tests/integration/mobzap.test.ts - Testes de Integração
// ========================================

import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateApiKey } from '../../src/utils/tokenGenerator';

const prisma = new PrismaClient();

describe('MobZap Integration Tests', () => {
  let apiKey: string;
  let userId: string;
  let deviceId: string;

  beforeAll(async () => {
    // Criar usuário de teste
    const user = await prisma.user.create({
      data: {
        email: 'mobzap.test@example.com',
        username: 'mobzaptest',
        password: 'hashed_password',
        fullName: 'MobZap Test User',
        apiKey: generateApiKey()
      }
    });

    userId = user.id;
    apiKey = user.apiKey!;

    // Criar dispositivo de teste
    const device = await prisma.device.create({
      data: {
        userId,
        phoneNumber: '+5511999887766',
        deviceName: 'Test Device',
        deviceType: 'NORMAL',
        status: 'ACTIVE'
      }
    });

    deviceId = device.id;

    // Criar tarefa de teste
    await prisma.task.create({
      data: {
        userId,
        deviceId,
        type: 'MESSAGE',
        status: 'PENDING',
        data: {
          phoneNumber: '+5511888776655',
          message: 'Test message'
        }
      }
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.task.deleteMany({ where: { userId } });
    await prisma.device.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/mobzap/fetch', () => {
    it('should fetch tasks for valid device', async () => {
      const response = await request(app.app)
        .post('/api/v1/mobzap/fetch')
        .set('X-API-Key', apiKey)
        .set('X-User-ID', userId)
        .send({
          phone_normal: '+5511999887766',
          battery_level: 85,
          is_charging: false
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('type');
      expect(response.body[0]).toHaveProperty('package');
    });

    it('should reject invalid API key', async () => {
      const response = await request(app.app)
        .post('/api/v1/mobzap/fetch')
        .set('X-API-Key', 'invalid_key')
        .set('X-User-ID', userId)
        .send({
          phone_normal: '+5511999887766'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should auto-register new device', async () => {
      const newPhone = '+5511777665544';
      
      const response = await request(app.app)
        .post('/api/v1/mobzap/fetch')
        .set('X-API-Key', apiKey)
        .set('X-User-ID', userId)
        .send({
          phone_normal: newPhone,
          device_model: 'Samsung Galaxy S21'
        });

      expect(response.status).toBe(200);
      
      // Verificar se dispositivo foi criado
      const device = await prisma.device.findFirst({
        where: { phoneNumber: newPhone }
      });
      
      expect(device).toBeTruthy();
      expect(device?.userId).toBe(userId);
      
      // Limpar
      if (device) {
        await prisma.device.delete({ where: { id: device.id } });
      }
    });
  });

  describe('POST /api/v1/mobzap/callback', () => {
    let taskId: string;

    beforeEach(async () => {
      // Criar tarefa em processamento
      const task = await prisma.task.create({
        data: {
          userId,
          deviceId,
          type: 'MESSAGE',
          status: 'PROCESSING',
          data: {
            phoneNumber: '+5511666554433',
            message: 'Callback test'
          }
        }
      });
      taskId = task.id;
    });

    afterEach(async () => {
      await prisma.task.delete({ where: { id: taskId } }).catch(() => {});
    });

    it('should process successful callback', async () => {
      const response = await request(app.app)
        .post('/api/v1/mobzap/callback')
        .set('X-API-Key', apiKey)
        .set('X-User-ID', userId)
        .send({
          taskId,
          status: 'completed',
          result: {
            messageId: 'msg_123',
            deliveredAt: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar se tarefa foi atualizada
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });
      
      expect(task?.status).toBe('COMPLETED');
      expect(task?.completedAt).toBeTruthy();
    });

    it('should process failed callback', async () => {
      const response = await request(app.app)
        .post('/api/v1/mobzap/callback')
        .set('X-API-Key', apiKey)
        .set('X-User-ID', userId)
        .send({
          taskId,
          status: 'failed',
          error: 'Phone number not on WhatsApp',
          timestamp: new Date().toISOString()
        });

      expect(response.status).toBe(200);

      // Verificar se tarefa foi marcada como falhada
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });
      
      expect(task?.status).toBe('FAILED');
      expect(task?.error).toBeTruthy();
    });
  });

  describe('POST /api/v1/mobzap/message/receive', () => {
    it('should receive and store incoming message', async () => {
      const messageData = {
        deviceId,
        from: '+5511555443322',
        message: 'Hello from WhatsApp!',
        timestamp: new Date().toISOString()
      };

      const response = await request(app.app)
        .post('/api/v1/mobzap/message/receive')
        .set('X-API-Key', apiKey)
        .set('X-User-ID', userId)
        .send(messageData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar se mensagem foi salva
      const message = await prisma.message.findFirst({
        where: {
          userId,
          phoneNumber: '5511555443322', // Formatado
          direction: 'INCOMING'
        }
      });

      expect(message).toBeTruthy();
      expect(message?.content).toBe('Hello from WhatsApp!');
      
      // Limpar
      if (message) {
        await prisma.message.delete({ where: { id: message.id } });
      }
    });
  });
});

// ========================================
// tests/unit/services/mobzap.test.ts - Testes Unitários
// ========================================

import MobZapService from '../../../src/services/mobzap.service';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client');

describe('MobZapService Unit Tests', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  describe('formatPhoneNumber', () => {
    it('should format phone numbers correctly', () => {
      const service = MobZapService as any;
      
      expect(service.formatPhoneNumber('+55 11 99988-7766')).toBe('5511999887766');
      expect(service.formatPhoneNumber('11999887766')).toBe('5511999887766');
      expect(service.formatPhoneNumber('999887766')).toBe('55999887766');
      expect(service.formatPhoneNumber('+5511999887766')).toBe('5511999887766');
    });
  });

  describe('convertToMobZapFormat', () => {
    it('should convert MESSAGE task correctly', () => {
      const service = MobZapService as any;
      
      const task = {
        id: 'task_123',
        type: 'MESSAGE',
        data: {
          phoneNumber: '11999887766',
          message: 'Test message'
        }
      };

      const result = service.convertToMobZapFormat(task, 'NORMAL');
      
      expect(result).toEqual({
        id: 'task_123',
        type: 'chat',
        package: 'normal',
        number: '5511999887766',
        text: 'Test message',
        actionChat: 'send'
      });
    });

    it('should convert MEDIA task correctly', () => {
      const service = MobZapService as any;
      
      const task = {
        id: 'task_456',
        type: 'MEDIA',
        data: {
          phoneNumber: '11888776655',
          mediaUrl: 'https://example.com/image.jpg',
          mediaType: 'image',
          caption: 'Check this out!'
        }
      };

      const result = service.convertToMobZapFormat(task, 'BUSINESS');
      
      expect(result).toEqual({
        id: 'task_456',
        type: 'media',
        package: 'business',
        number: '5511888776655',
        url: 'https://example.com/image.jpg',
        mediaType: 'image',
        text: 'Check this out!'
      });
    });

    it('should convert GROUP_JOIN task correctly', () => {
      const service = MobZapService as any;
      
      const task = {
        id: 'task_789',
        type: 'GROUP_JOIN',
        data: {
          inviteLink: 'https://chat.whatsapp.com/ABC123XYZ',
          welcomeMessage: 'Hello everyone!'
        }
      };

      const result = service.convertToMobZapFormat(task, 'NORMAL');
      
      expect(result).toEqual({
        id: 'task_789',
        type: 'group',
        package: 'normal',
        link: 'https://chat.whatsapp.com/ABC123XYZ',
        text: 'Hello everyone!',
        actionChat: 'join'
      });
    });
  });
});