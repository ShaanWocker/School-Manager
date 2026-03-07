const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// GET /api/users
router.get('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const {
      search,
      role,
      page = 1,
      limit = 20
    } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };

    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        idNumber: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        institution: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id
router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const { firstName, lastName, phone, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { firstName, lastName, phone, role, isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true
      }
    });

    res.json({ success: true, data: user, message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id (soft delete)
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
