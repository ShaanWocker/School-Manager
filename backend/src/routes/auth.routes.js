const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, sendTokenResponse } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// ============================================
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
// ============================================

router.post('/register', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').notEmpty().withMessage('Role is required'),
  body('institutionId').notEmpty().withMessage('Institution ID is required')
], async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, role, institutionId, phone, idNumber } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        institutionId,
        phone,
        idNumber
      },
      include: {
        institution: true
      }
    });

    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
// ============================================

router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        institution: true,
        studentProfile: true,
        teacherProfile: true,
        parentProfile: {
          include: {
            students: true
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

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
// ============================================

router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        institution: true,
        studentProfile: {
          include: {
            class: true,
            parents: true
          }
        },
        teacherProfile: {
          include: {
            classes: true,
            subjectTeaching: {
              include: {
                subject: true
              }
            }
          }
        },
        parentProfile: {
          include: {
            students: {
              include: {
                class: true
              }
            }
          }
        }
      }
    });

    // Remove password
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/auth/update-password
// @desc    Update password
// @access  Private
// ============================================

router.put('/update-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
// ============================================

router.put('/update-profile', protect, async (req, res, next) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        phone,
        avatar
      },
      include: {
        institution: true
      }
    });

    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
