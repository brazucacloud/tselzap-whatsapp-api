// ========================================
// src/services/mobzap.service.ts - Integração com App Android
// ========================================

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { encrypt, decrypt } from '../utils/encryption';
import { cache } from '../config/redis';

const prisma = new PrismaClient();

export interface MobZapTask {
  id: string;
  type: 'chat' | 'media' | 'group' | 'group_message' | 'bulk';
  package: 'normal' | 'business';
  number?: string;
  numbers?: string[];
  text?: string;
  url?: string;
  mediaType?: string;
  link?: string;
  groupId?: string;
  actionChat?: 'send' | 'join' | 'leave';
  delay?: number;
}

export interface MobZapDevice {
  phone_normal?: string;
  phone_business?: string;
  permissions?: string[];
  battery_level?: number;
  is_charging?: boolean;
  whatsapp_version?: string;
  android_version?: string;
  device_model?: string;
}

export interface MobZapCallback {
  taskId: string;
  status: 'completed' | 'failed' | 'processing';
  result?: any;
  error?: string;
  messageId?: string;
  timestamp: string;
  deliveryInfo?: {
    delivered: boolean;
    read: boolean;
    deliveredAt?: string;
    readAt?: string;
  };
}

class MobZapService {
  private activeSessions: Map<string, any> = new Map();

  /**
   * Processar requisição do MobZap para buscar tarefas
   */
  async fetchTasks(
    userId: string,
    deviceData: MobZapDevice
  ): Promise<MobZapTask[]> {
    try {
      // Identificar dispositivo
      const phoneNumber = deviceData.phone_normal || deviceData.phone_business;
      if (!phoneNumber) {
        throw new Error('Phone number required');
      }

      // Buscar ou criar dispositivo
      let device = await prisma.device.findFirst({
        where: {
          userId,
          phoneNumber
        }
      });

      if (!device) {
        // Auto-registrar dispositivo
        device = await prisma.device.create({
          data: {
            userId,
            phoneNumber,
            deviceName: `MobZap ${deviceData.device_model || 'Device'}`,
            deviceType: deviceData.phone_business ? 'BUSINESS' : 'NORMAL',
            status: 'ACTIVE',
            isConnected: true,
            lastSeen: new Date(),
            batteryLevel: deviceData.battery_level,
            isCharging: deviceData.is_charging
          }
        });

        logger.info(`Auto-registered device: ${device.id}`);
      } else {
        // Atualizar status do dispositivo
        await prisma.device.update({
          where: { id: device.id },
          data: {
            isConnected: true,
            lastSeen: new Date(),
            batteryLevel: deviceData.battery_level,
            isCharging: deviceData.is_charging,
            status: 'ACTIVE'
          }
        });
      }

      // Salvar sessão ativa
      this.activeSessions.set(device.id, {
        userId,
        deviceData,
        lastSeen: new Date()
      });

      // Buscar tarefas pendentes
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
        take: 10 // Limitar para não sobrecarregar
      });

      // Converter tarefas para formato MobZap
      const mobzapTasks = await Promise.all(
        tasks.map(async (task) => {
          // Marcar como processando
          await prisma.task.update({
            where: { id: task.id },
            data: {
              status: 'PROCESSING',
              executedAt: new Date()
            }
          });

          return this.convertToMobZapFormat(task, device.deviceType);
        })
      );

      // Cachear tarefas enviadas
      await cache.set(
        `device:${device.id}:active_tasks`,
        mobzapTasks.map(t => t.id),
        300 // 5 minutos TTL
      );

      logger.info(`Sent ${mobzapTasks.length} tasks to device ${device.id}`);

      return mobzapTasks.filter(Boolean) as MobZapTask[];
    } catch (error) {
      logger.error('Error fetching tasks for MobZap:', error);
      throw error;
    }
  }

  /**
   * Converter tarefa do banco para formato MobZap
   */
  private convertToMobZapFormat(task: any, deviceType: string): MobZapTask | null {
    const data = task.data as any;
    const baseTask: MobZapTask = {
      id: task.id,
      type: 'chat',
      package: deviceType.toLowerCase() as 'normal' | 'business'
    };

    switch (task.type) {
      case 'MESSAGE':
        return {
          ...baseTask,
          type: 'chat',
          number: this.formatPhoneNumber(data.phoneNumber),
          text: data.message,
          actionChat: 'send'
        };

      case 'MEDIA':
        return {
          ...baseTask,
          type: 'media',
          number: this.formatPhoneNumber(data.phoneNumber),
          url: data.mediaUrl,
          mediaType: data.mediaType || 'image',
          text: data.caption || ''
        };

      case 'GROUP_JOIN':
        return {
          ...baseTask,
          type: 'group',
          link: data.inviteLink,
          text: data.welcomeMessage || '',
          actionChat: 'join'
        };

      case 'GROUP_LEAVE':
        return {
          ...baseTask,
          type: 'group',
          groupId: data.groupId,
          actionChat: 'leave'
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
          numbers: data.phoneNumbers.map((n: string) => this.formatPhoneNumber(n)),
          text: data.message,
          delay: data.delay || 5000
        };

      default:
        logger.warn(`Unknown task type: ${task.type}`);
        return null;
    }
  }

  /**
   * Formatar número de telefone para padrão internacional
   */
  private formatPhoneNumber(phone: string): string {
    // Remover caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');

    // Adicionar código do país se não tiver
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }

    return cleaned;
  }

  /**
   * Processar callback do MobZap
   */
  async processCallback(
    userId: string,
    callback: MobZapCallback
  ): Promise<void> {
    try {
      const { taskId, status, result, error, messageId, deliveryInfo } = callback;

      // Buscar tarefa
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          userId
        }
      });

      if (!task) {
        logger.warn(`Task not found for callback: ${taskId}`);
        return;
      }

      // Atualizar status da tarefa
      const updateData: any = {
        status: status === 'completed' ? 'COMPLETED' : status === 'failed' ? 'FAILED' : 'PROCESSING',
        result,
        error
      };

      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      await prisma.task.update({
        where: { id: taskId },
        data: updateData
      });

      // Se for mensagem, criar/atualizar registro
      if (task.type === 'MESSAGE' || task.type === 'MEDIA') {
        const taskData = task.data as any;
        
        // Buscar ou criar mensagem
        let message = await prisma.message.findFirst({
          where: { taskId }
        });

        if (!message) {
          message = await prisma.message.create({
            data: {
              userId,
              deviceId: task.deviceId!,
              taskId,
              phoneNumber: taskData.phoneNumber,
              messageType: task.type === 'MEDIA' ? taskData.mediaType?.toUpperCase() : 'TEXT',
              content: taskData.message || taskData.caption,
              mediaUrl: taskData.mediaUrl,
              status: 'PENDING',
              direction: 'OUTGOING'
            }
          });
        }

        // Atualizar status da mensagem
        if (status === 'completed') {
          await prisma.message.update({
            where: { id: message.id },
            data: {
              status: deliveryInfo?.delivered ? 'DELIVERED' : 'SENT',
              deliveredAt: deliveryInfo?.deliveredAt ? new Date(deliveryInfo.deliveredAt) : new Date(),
              readAt: deliveryInfo?.readAt ? new Date(deliveryInfo.readAt) : undefined,
              metadata: { messageId, ...result }
            }
          });
        } else if (status === 'failed') {
          await prisma.message.update({
            where: { id: message.id },
            data: {
              status: 'FAILED',
              error
            }
          });
        }
      }

      // Trigger webhook
      await this.triggerWebhook(userId, `task.${status}`, {
        taskId,
        status,
        result,
        error,
        timestamp: callback.timestamp
      });

      logger.info(`Processed callback for task ${taskId}: ${status}`);
    } catch (error) {
      logger.error('Error processing MobZap callback:', error);
      throw error;
    }
  }

  /**
   * Receber mensagem do WhatsApp via MobZap
   */
  async receiveMessage(
    userId: string,
    deviceId: string,
    messageData: {
      from: string;
      message?: string;
      mediaUrl?: string;
      mediaType?: string;
      groupId?: string;
      timestamp: string;
      isForwarded?: boolean;
      quotedMessage?: any;
    }
  ): Promise<void> {
    try {
      // Criar registro de mensagem recebida
      const message = await prisma.message.create({
        data: {
          userId,
          deviceId,
          phoneNumber: this.formatPhoneNumber(messageData.from),
          messageType: messageData.mediaType ? messageData.mediaType.toUpperCase() as any : 'TEXT',
          content: messageData.message,
          mediaUrl: messageData.mediaUrl,
          status: 'DELIVERED',
          direction: 'INCOMING',
          deliveredAt: new Date(messageData.timestamp),
          metadata: {
            groupId: messageData.groupId,
            isForwarded: messageData.isForwarded,
            quotedMessage: messageData.quotedMessage
          }
        }
      });

      // Notificar via WebSocket
      await this.notifyUser(userId, 'new_message', message);

      // Trigger webhook
      await this.triggerWebhook(userId, 'message.received', message);

      // Auto-responder (se configurado)
      await this.checkAutoResponder(userId, deviceId, message);

      logger.info(`Received message from ${messageData.from}`);
    } catch (error) {
      logger.error('Error receiving message:', error);
      throw error;
    }
  }

  /**
   * Verificar e executar auto-responder
   */
  private async checkAutoResponder(
    userId: string,
    deviceId: string,
    message: any
  ): Promise<void> {
    try {
      // Buscar configurações de auto-resposta do usuário
      const cacheKey = `autoresponder:${userId}`;
      let autoResponder = await cache.get(cacheKey);

      if (!autoResponder) {
        // Buscar do banco se não estiver em cache
        // Implementar lógica de auto-responder aqui
        return;
      }

      // Verificar condições para auto-resposta
      if (autoResponder.enabled && autoResponder.rules) {
        for (const rule of autoResponder.rules) {
          if (this.matchRule(message, rule)) {
            // Criar tarefa de resposta
            await prisma.task.create({
              data: {
                userId,
                deviceId,
                type: 'MESSAGE',
                priority: 8, // Alta prioridade para respostas automáticas
                data: {
                  phoneNumber: message.phoneNumber,
                  message: rule.response
                }
              }
            });

            logger.info(`Auto-response triggered for ${message.phoneNumber}`);
            break;
          }
        }
      }
    } catch (error) {
      logger.error('Error in auto-responder:', error);
    }
  }

  /**
   * Verificar se mensagem corresponde à regra
   */
  private matchRule(message: any, rule: any): boolean {
    const content = message.content?.toLowerCase() || '';
    
    switch (rule.type) {
      case 'contains':
        return rule.keywords.some((kw: string) => content.includes(kw.toLowerCase()));
      case 'exact':
        return rule.keywords.some((kw: string) => content === kw.toLowerCase());
      case 'regex':
        return new RegExp(rule.pattern, 'i').test(content);
      case 'all':
        return true;
      default:
        return false;
    }
  }

  /**
   * Notificar usuário via WebSocket
   */
  private async notifyUser(userId: string, event: string, data: any): Promise<void> {
    // Implementar notificação via WebSocket
    // Isso seria integrado com o socket.io
  }

  /**
   * Trigger webhook
   */
  private async triggerWebhook(userId: string, event: string, data: any): Promise<void> {
    // Implementar trigger de webhook
    // Isso seria integrado com o webhook.service.ts
  }

  /**
   * Obter status de dispositivos conectados
   */
  async getConnectedDevices(userId: string): Promise<any[]> {
    const devices = await prisma.device.findMany({
      where: {
        userId,
        isConnected: true
      },
      select: {
        id: true,
        phoneNumber: true,
        deviceName: true,
        deviceType: true,
        lastSeen: true,
        batteryLevel: true,
        isCharging: true,
        _count: {
          select: {
            tasks: {
              where: {
                status: 'PENDING'
              }
            },
            messages: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
                }
              }
            }
          }
        }
      }
    });

    return devices.map(device => ({
      ...device,
      pendingTasks: device._count.tasks,
      messagesLast24h: device._count.messages,
      session: this.activeSessions.get(device.id)
    }));
  }

  /**
   * Limpar sessões inativas
   */
  async cleanupInactiveSessions(): Promise<void> {
    const inactiveThreshold = 10 * 60 * 1000; // 10 minutos
    const now = Date.now();

    for (const [deviceId, session] of this.activeSessions.entries()) {
      if (now - session.lastSeen.getTime() > inactiveThreshold) {
        this.activeSessions.delete(deviceId);
        
        // Marcar dispositivo como desconectado
        await prisma.device.update({
          where: { id: deviceId },
          data: {
            isConnected: false,
            status: 'INACTIVE'
          }
        });

        logger.info(`Cleaned up inactive session for device ${deviceId}`);
      }
    }
  }
}

export default new MobZapService();

// ========================================
// src/services/whatsapp-web.service.ts - Integração WhatsApp Web
// ========================================

import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

const prisma = new PrismaClient();

interface WhatsAppSession {
  deviceId: string;
  userId: string;
  client: Client;
  status: 'INITIALIZING' | 'QR_CODE' | 'AUTHENTICATED' | 'READY' | 'DISCONNECTED';
  qrCode?: string;
  phoneNumber?: string;
  retries: number;
}

class WhatsAppWebService extends EventEmitter {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private maxRetries = 3;

  /**
   * Inicializar sessão WhatsApp Web
   */
  async initializeSession(deviceId: string, userId: string): Promise<string> {
    try {
      // Verificar se já existe sessão
      if (this.sessions.has(deviceId)) {
        const session = this.sessions.get(deviceId)!;
        if (session.status === 'READY') {
          return 'Session already active';
        }
      }

      // Criar novo cliente WhatsApp
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: deviceId,
          dataPath: `./sessions/${deviceId}`
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        },
        qrMaxRetries: 3
      });

      // Criar sessão
      const session: WhatsAppSession = {
        deviceId,
        userId,
        client,
        status: 'INITIALIZING',
        retries: 0
      };

      this.sessions.set(deviceId, session);

      // Configurar event listeners
      this.setupClientListeners(client, session);

      // Inicializar cliente
      await client.initialize();

      logger.info(`WhatsApp session initialized for device ${deviceId}`);
      return 'Session initializing';
    } catch (error) {
      logger.error('Error initializing WhatsApp session:', error);
      throw error;
    }
  }

  /**
   * Configurar listeners do cliente WhatsApp
   */
  private setupClientListeners(client: Client, session: WhatsAppSession): void {
    // QR Code
    client.on('qr', async (qr) => {
      try {
        session.status = 'QR_CODE';
        session.qrCode = await QRCode.toDataURL(qr);
        
        // Salvar QR code no banco
        await prisma.device.update({
          where: { id: session.deviceId },
          data: {
            qrCode: session.qrCode,
            status: 'INACTIVE'
          }
        });

        // Emitir evento
        this.emit('qr', {
          deviceId: session.deviceId,
          qrCode: session.qrCode
        });

        logger.info(`QR Code generated for device ${session.deviceId}`);
      } catch (error) {
        logger.error('Error generating QR code:', error);
      }
    });

    // Autenticado
    client.on('authenticated', async () => {
      session.status = 'AUTHENTICATED';
      logger.info(`Device ${session.deviceId} authenticated`);
    });

    // Pronto
    client.on('ready', async () => {
      try {
        session.status = 'READY';
        
        // Obter informações do dispositivo
        const info = client.info;
        session.phoneNumber = info?.wid?.user;

        // Atualizar banco
        await prisma.device.update({
          where: { id: session.deviceId },
          data: {
            status: 'ACTIVE',
            isConnected: true,
            phoneNumber: session.phoneNumber,
            qrCode: null,
            sessionData: JSON.stringify({
              platform: info?.platform,
              pushname: info?.pushname,
              connected: true
            })
          }
        });

        // Emitir evento
        this.emit('ready', {
          deviceId: session.deviceId,
          phoneNumber: session.phoneNumber
        });

        logger.info(`Device ${session.deviceId} ready`);
      } catch (error) {
        logger.error('Error on ready event:', error);
      }
    });

    // Mensagem recebida
    client.on('message', async (message) => {
      try {
        // Processar mensagem recebida
        await this.handleIncomingMessage(session, message);
      } catch (error) {
        logger.error('Error handling incoming message:', error);
      }
    });

    // Mensagem enviada
    client.on('message_create', async (message) => {
      if (message.fromMe) {
        // Processar mensagem enviada
        await this.handleOutgoingMessage(session, message);
      }
    });

    // Status da mensagem
    client.on('message_ack', async (message, ack) => {
      // Atualizar status da mensagem
      await this.updateMessageStatus(session, message, ack);
    });

    // Desconectado
    client.on('disconnected', async (reason) => {
      try {
        session.status = 'DISCONNECTED';
        
        // Atualizar banco
        await prisma.device.update({
          where: { id: session.deviceId },
          data: {
            status: 'INACTIVE',
            isConnected: false
          }
        });

        // Tentar reconectar
        if (session.retries < this.maxRetries) {
          session.retries++;
          logger.info(`Attempting to reconnect device ${session.deviceId} (${session.retries}/${this.maxRetries})`);
          
          setTimeout(() => {
            client.initialize();
          }, 5000 * session.retries); // Backoff exponencial
        } else {
          // Remover sessão após máximo de tentativas
          this.sessions.delete(session.deviceId);
          logger.error(`Device ${session.deviceId} disconnected after max retries`);
        }

        // Emitir evento
        this.emit('disconnected', {
          deviceId: session.deviceId,
          reason
        });
      } catch (error) {
        logger.error('Error on disconnect:', error);
      }
    });

    // Erro de autenticação
    client.on('auth_failure', async (message) => {
      logger.error(`Authentication failure for device ${session.deviceId}: ${message}`);
      
      // Limpar sessão
      await this.destroySession(session.deviceId);
    });
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(
    deviceId: string,
    phoneNumber: string,
    message: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(deviceId);
      if (!session || session.status !== 'READY') {
        throw new Error('Device not connected');
      }

      // Formatar número
      const chatId = this.formatChatId(phoneNumber);
      
      // Enviar mensagem
      const result = await session.client.sendMessage(chatId, message);
      
      logger.info(`Message sent to ${phoneNumber} via device ${deviceId}`);
      return {
        success: true,
        messageId: result.id._serialized,
        timestamp: result.timestamp
      };
    } catch (error) {
      logger.error('Error sending text message:', error);
      throw error;
    }
  }

  /**
   * Enviar mídia
   */
  async sendMediaMessage(
    deviceId: string,
    phoneNumber: string,
    mediaUrl: string,
    caption?: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(deviceId);
      if (!session || session.status !== 'READY') {
        throw new Error('Device not connected');
      }

      // Formatar número
      const chatId = this.formatChatId(phoneNumber);
      
      // Baixar e criar mídia
      const media = await MessageMedia.fromUrl(mediaUrl);
      
      // Enviar mídia
      const result = await session.client.sendMessage(chatId, media, {
        caption: caption || ''
      });
      
      logger.info(`Media sent to ${phoneNumber} via device ${deviceId}`);
      return {
        success: true,
        messageId: result.id._serialized,
        timestamp: result.timestamp
      };
    } catch (error) {
      logger.error('Error sending media message:', error);
      throw error;
    }
  }

  /**
   * Entrar em grupo
   */
  async joinGroup(deviceId: string, inviteLink: string): Promise<any> {
    try {
      const session = this.sessions.get(deviceId);
      if (!session || session.status !== 'READY') {
        throw new Error('Device not connected');
      }

      // Extrair código do convite
      const inviteCode = this.extractInviteCode(inviteLink);
      
      // Aceitar convite
      const result = await session.client.acceptInvite(inviteCode);
      
      logger.info(`Joined group via device ${deviceId}`);
      return {
        success: true,
        groupId: result
      };
    } catch (error) {
      logger.error('Error joining group:', error);
      throw error;
    }
  }

  /**
   * Processar mensagem recebida
   */
  private async handleIncomingMessage(session: WhatsAppSession, message: any): Promise<void> {
    try {
      // Obter contato
      const contact = await message.getContact();
      
      // Obter mídia se houver
      let mediaUrl;
      if (message.hasMedia) {
        const media = await message.downloadMedia();
        // Salvar mídia e obter URL
        // mediaUrl = await this.saveMedia(media);
      }

      // Salvar mensagem no banco
      await prisma.message.create({
        data: {
          userId: session.userId,
          deviceId: session.deviceId,
          phoneNumber: contact.number,
          messageType: message.type?.toUpperCase() || 'TEXT',
          content: message.body,
          mediaUrl,
          status: 'DELIVERED',
          direction: 'INCOMING',
          deliveredAt: new Date(message.timestamp * 1000),
          metadata: {
            messageId: message.id._serialized,
            fromGroup: message.from.includes('@g.us'),
            author: message.author,
            isForwarded: message.isForwarded
          }
        }
      });

      // Emitir evento
      this.emit('message_received', {
        deviceId: session.deviceId,
        from: contact.number,
        message: message.body,
        timestamp: message.timestamp
      });
    } catch (error) {
      logger.error('Error handling incoming message:', error);
    }
  }

  /**
   * Processar mensagem enviada
   */
  private async handleOutgoingMessage(session: WhatsAppSession, message: any): Promise<void> {
    // Implementar lógica similar para mensagens enviadas
  }

  /**
   * Atualizar status da mensagem
   */
  private async updateMessageStatus(session: WhatsAppSession, message: any, ack: number): Promise<void> {
    try {
      // Mapear status ACK
      let status;
      switch (ack) {
        case 0: status = 'PENDING'; break;
        case 1: status = 'SENT'; break;
        case 2: status = 'DELIVERED'; break;
        case 3: status = 'READ'; break;
        default: status = 'FAILED';
      }

      // Atualizar no banco
      await prisma.$executeRaw`
        UPDATE "Message"
        SET status = ${status}
        WHERE metadata->>'messageId' = ${message.id._serialized}
      `;
    } catch (error) {
      logger.error('Error updating message status:', error);
    }
  }

  /**
   * Formatar ID do chat
   */
  private formatChatId(phoneNumber: string): string {
    // Remover caracteres não numéricos
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Adicionar sufixo do WhatsApp
    if (!cleaned.includes('@')) {
      cleaned = `${cleaned}@c.us`;
    }
    
    return cleaned;
  }

  /**
   * Extrair código de convite
   */
  private extractInviteCode(inviteLink: string): string {
    const match = inviteLink.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
    if (!match) {
      throw new Error('Invalid invite link');
    }
    return match[1];
  }

  /**
   * Destruir sessão
   */
  async destroySession(deviceId: string): Promise<void> {
    try {
      const session = this.sessions.get(deviceId);
      if (session) {
        await session.client.destroy();
        this.sessions.delete(deviceId);
      }

      // Atualizar banco
      await prisma.device.update({
        where: { id: deviceId },
        data: {
          status: 'INACTIVE',
          isConnected: false,
          qrCode: null
        }
      });

      logger.info(`Session destroyed for device ${deviceId}`);
    } catch (error) {
      logger.error('Error destroying session:', error);
    }
  }

  /**
   * Obter status de todas as sessões
   */
  getSessionsStatus(): any[] {
    const status = [];
    for (const [deviceId, session] of this.sessions.entries()) {
      status.push({
        deviceId,
        userId: session.userId,
        status: session.status,
        phoneNumber: session.phoneNumber,
        retries: session.retries
      });
    }
    return status;
  }
}

export default new WhatsAppWebService();