import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse>('/auth/login', { email, password }),

  register: (userData: {
    email: string;
    username: string;
    password: string;
    fullName: string;
  }) => api.post<ApiResponse>('/auth/register', userData),

  logout: () => api.post<ApiResponse>('/auth/logout'),

  getProfile: () => api.get<ApiResponse>('/auth/me'),

  refreshApiKey: () => api.post<ApiResponse>('/auth/refresh-api-key'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    }),
};

// Device API
export interface Device {
  id: string;
  userId: string;
  phoneNumber: string;
  deviceName: string;
  deviceType: 'NORMAL' | 'BUSINESS';
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DISCONNECTED';
  isConnected: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
  qrCode?: string;
  _count?: {
    tasks: number;
    messages: number;
  };
}

export const deviceApi = {
  getDevices: (params?: {
    status?: string;
    deviceType?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<Device[]>>('/devices', { params }),

  getDevice: (deviceId: string) =>
    api.get<ApiResponse<Device>>(`/devices/${deviceId}`),

  registerDevice: (deviceData: {
    phoneNumber: string;
    deviceName: string;
    deviceType: 'NORMAL' | 'BUSINESS';
  }) => api.post<ApiResponse<Device>>('/devices', deviceData),

  updateDevice: (deviceId: string, deviceData: {
    deviceName?: string;
    status?: string;
  }) => api.put<ApiResponse<Device>>(`/devices/${deviceId}`, deviceData),

  deleteDevice: (deviceId: string) =>
    api.delete<ApiResponse>(`/devices/${deviceId}`),

  generateQRCode: (deviceId: string) =>
    api.post<ApiResponse<{ qrCode: string; expiresIn: number }>>(
      `/devices/${deviceId}/qr`
    ),

  updateDeviceStatus: (deviceId: string, statusData: {
    isConnected: boolean;
    batteryLevel?: number;
    isCharging?: boolean;
    sessionData?: any;
  }) => api.put<ApiResponse<Device>>(`/devices/${deviceId}/status`, statusData),
};

// Message API
export interface Message {
  id: string;
  userId: string;
  deviceId: string;
  phoneNumber: string;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LOCATION';
  content?: string;
  mediaUrl?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  direction: 'INCOMING' | 'OUTGOING';
  isRead: boolean;
  readAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
  metadata?: any;
  device?: {
    phoneNumber: string;
    deviceName: string;
  };
}

export const messageApi = {
  getMessages: (params?: {
    deviceId?: string;
    phoneNumber?: string;
    status?: string;
    direction?: string;
    messageType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<PaginatedResponse<Message>>>('/messages', { params }),

  getMessage: (messageId: string) =>
    api.get<ApiResponse<Message>>(`/messages/${messageId}`),

  sendMessage: (messageData: {
    deviceId: string;
    phoneNumber: string;
    messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LOCATION';
    content?: string;
    mediaUrl?: string;
    location?: {
      latitude: number;
      longitude: number;
      description?: string;
    };
  }) => api.post<ApiResponse<Message>>('/messages', messageData),

  bulkSendMessages: (bulkData: {
    deviceId: string;
    phoneNumbers: string[];
    content: string;
    delay?: number;
  }) => api.post<ApiResponse>('/messages/bulk', bulkData),

  getConversation: (phoneNumber: string, params?: {
    deviceId?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<ApiResponse<{
      phoneNumber: string;
      messages: Message[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    }>>(`/messages/conversation/${phoneNumber}`, { params }),

  markAsRead: (messageId: string) =>
    api.put<ApiResponse<Message>>(`/messages/${messageId}/read`),

  getMessageStats: (params?: {
    deviceId?: string;
    period?: '24h' | '7d' | '30d' | '90d';
  }) => api.get<ApiResponse>('/messages/stats', { params }),
};

// Dashboard API
export interface DashboardOverview {
  devices: {
    active: number;
    total: number;
    percentage: string;
  };
  messages: {
    today: number;
    change: string;
    trend: 'up' | 'down';
  };
  tasks: {
    today: number;
    pending: number;
    successRate: string;
  };
  queues: {
    total: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
  };
  license?: {
    type: string;
    expiresIn: number;
    deviceLimit: number;
    messageLimit: number;
    messagesUsedToday: number;
  };
}

export const dashboardApi = {
  getOverview: () =>
    api.get<ApiResponse<DashboardOverview>>('/dashboard/overview'),

  getActivityChart: (params?: {
    period?: '24h' | '7d' | '30d' | '90d';
    deviceId?: string;
  }) => api.get<ApiResponse>('/dashboard/activity-chart', { params }),

  getRecentActivity: (params?: { limit?: number }) =>
    api.get<ApiResponse>('/dashboard/recent-activity', { params }),

  getSystemHealth: () =>
    api.get<ApiResponse>('/dashboard/health'),
};

// MobZap API (for mobile integration)
export const mobzapApi = {
  fetchTasks: (deviceData: {
    phone_normal?: string;
    phone_business?: string;
    permissions?: string[];
    battery_level?: number;
    is_charging?: boolean;
    whatsapp_version?: string;
    android_version?: string;
    device_model?: string;
  }) => api.post('/mobzap/fetch', deviceData),

  processCallback: (callbackData: {
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
  }) => api.post('/mobzap/callback', callbackData),

  receiveMessage: (messageData: {
    deviceId: string;
    from: string;
    message?: string;
    mediaUrl?: string;
    mediaType?: string;
    timestamp: string;
  }) => api.post('/mobzap/message/receive', messageData),

  getDevicesStatus: () => api.get<ApiResponse>('/mobzap/devices'),
};

// WhatsApp Web API
export const whatsappWebApi = {
  initSession: (deviceId: string) =>
    api.post<ApiResponse>(`/whatsapp/session/${deviceId}/init`),

  destroySession: (deviceId: string) =>
    api.delete<ApiResponse>(`/whatsapp/session/${deviceId}`),

  getSessionsStatus: () =>
    api.get<ApiResponse>('/whatsapp/sessions'),
};

// Webhook API
export interface Webhook {
  id: string;
  userId: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const webhookApi = {
  getWebhooks: () => api.get<ApiResponse<Webhook[]>>('/webhooks'),

  createWebhook: (webhookData: {
    name: string;
    url: string;
    events: string[];
  }) => api.post<ApiResponse<Webhook>>('/webhooks', webhookData),

  updateWebhook: (webhookId: string, webhookData: {
    name?: string;
    url?: string;
    events?: string[];
    isActive?: boolean;
  }) => api.put<ApiResponse<Webhook>>(`/webhooks/${webhookId}`, webhookData),

  deleteWebhook: (webhookId: string) =>
    api.delete<ApiResponse>(`/webhooks/${webhookId}`),

  testWebhook: (webhookId: string) =>
    api.post<ApiResponse>(`/webhooks/${webhookId}/test`),
};

export default api;
