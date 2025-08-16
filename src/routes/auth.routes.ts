import { Router } from 'express';
import { body } from 'express-validator';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { 
  authenticate, 
  generateToken, 
  hashPassword, 
  comparePassword, 
  blacklistToken,
  generateApiKey,
  authRateLimit 
} from '../middlewares/auth.middleware';
import { logger, logSecurity } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *                 minLength: 3
 *               password:
 *                 type: string
 *                 minLength: 8
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post(
  '/register',
  authRateLimit,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('username')
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-30 characters, alphanumeric and underscore only'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
    body('fullName')
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be 2-100 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, username, password, fullName } = req.body;

      // Check if user already exists
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
          message: existingUser.email === email 
            ? 'Email already registered' 
            : 'Username already taken'
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Generate API key
      const apiKey = generateApiKey();

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          fullName,
          apiKey,
          role: 'USER'
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

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Create trial license
      await prisma.license.create({
        data: {
          userId: user.id,
          licenseKey: `TRIAL_${Date.now()}`,
          type: 'TRIAL',
          status: 'ACTIVE',
          deviceLimit: 1,
          messageLimit: 100,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          features: {
            bulkMessaging: false,
            mediaMessaging: true,
            groupMessaging: false,
            webhooks: false,
            apiAccess: true,
            priority: 'low'
          }
        }
      });

      logger.info('New user registered', { userId: user.id, email: user.email });

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
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  authRateLimit,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          password: true,
          role: true,
          isActive: true,
          apiKey: true,
          lastLoginAt: true
        }
      });

      if (!user || !user.isActive) {
        logSecurity('login_failed', { email, reason: 'user_not_found_or_inactive' });
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        logSecurity('login_failed', { email, reason: 'invalid_password' });
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      logger.info('User logged in', { userId: user.id, email: user.email });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post(
  '/logout',
  authenticate,
  async (req, res) => {
    try {
      const token = req.headers.authorization?.substring(7);
      
      if (token) {
        await blacklistToken(token);
      }

      logger.info('User logged out', { userId: (req as any).userId });

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
router.get(
  '/me',
  authenticate,
  async (req, res) => {
    try {
      const userId = (req as any).userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          isActive: true,
          apiKey: true,
          createdAt: true,
          lastLoginAt: true,
          licenses: {
            where: {
              status: 'ACTIVE',
              expiresAt: { gt: new Date() }
            },
            select: {
              id: true,
              type: true,
              status: true,
              deviceLimit: true,
              messageLimit: true,
              expiresAt: true,
              features: true
            }
          },
          _count: {
            select: {
              devices: true,
              messages: true,
              tasks: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/refresh-api-key:
 *   post:
 *     summary: Refresh API key
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API key refreshed successfully
 */
router.post(
  '/refresh-api-key',
  authenticate,
  async (req, res) => {
    try {
      const userId = (req as any).userId;
      const newApiKey = generateApiKey();

      await prisma.user.update({
        where: { id: userId },
        data: { apiKey: newApiKey }
      });

      logger.info('API key refreshed', { userId });

      res.json({
        success: true,
        message: 'API key refreshed successfully',
        data: { apiKey: newApiKey }
      });
    } catch (error) {
      logger.error('Refresh API key error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh API key'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must be at least 8 characters with uppercase, lowercase, number and special character')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = (req as any).userId;
      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      logger.info('Password changed', { userId });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }
);

export default router;
