import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { logger, logSecurity } from '../utils/logger';
import { cache } from '../config/redis';

const prisma = new PrismaClient();

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// JWT Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    const isBlacklisted = await cache.get(`blacklist:${token}`);
    if (isBlacklisted) {
      logSecurity('token_blacklisted', { token: token.substring(0, 10) + '...' });
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Add user info to request
    (req as any).userId = user.id;
    (req as any).userRole = user.role;
    (req as any).user = user;

    // Log successful authentication
    logger.debug('User authenticated', { userId: user.id, email: user.email });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logSecurity('invalid_token', { error: error.message });
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      logSecurity('expired_token', { error: error.message });
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// API Key Authentication middleware (for mobile apps)
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (!apiKey || !userId) {
      return res.status(401).json({
        success: false,
        message: 'API key and user ID required'
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        apiKey: apiKey
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        apiKey: true
      }
    });

    if (!user || !user.isActive) {
      logSecurity('invalid_api_key', { userId, apiKey: apiKey.substring(0, 10) + '...' });
      return res.status(401).json({
        success: false,
        message: 'Invalid API key or user inactive'
      });
    }

    // Add user info to request
    (req as any).userId = user.id;
    (req as any).userRole = user.role;
    (req as any).user = user;

    // Log API key usage
    logger.debug('API key authenticated', { userId: user.id, email: user.email });

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(userRole)) {
      logSecurity('unauthorized_access', {
        userId: (req as any).userId,
        userRole,
        requiredRoles: roles,
        endpoint: req.path
      });

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Rate limiting middleware for authentication endpoints
export const authRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  const key = `auth_rate_limit:${ip}`;
  
  try {
    const attempts = await cache.get(key) || 0;
    
    if (attempts >= 5) {
      logSecurity('rate_limit_exceeded', { ip, endpoint: req.path });
      return res.status(429).json({
        success: false,
        message: 'Too many authentication attempts. Please try again later.'
      });
    }

    await cache.set(key, attempts + 1, 300); // 5 minutes
    next();
  } catch (error) {
    logger.error('Rate limiting error:', error);
    next(); // Continue if rate limiting fails
  }
};

// Generate JWT token
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Blacklist token (for logout)
export const blacklistToken = async (token: string): Promise<void> => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (decoded && decoded.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await cache.set(`blacklist:${token}`, true, ttl);
      }
    }
  } catch (error) {
    logger.error('Error blacklisting token:', error);
  }
};

// Generate API key
export const generateApiKey = (): string => {
  return 'wz_' + require('crypto').randomBytes(32).toString('hex');
};
