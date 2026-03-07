const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// GET /api/announcements
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };

    // Students and parents only see published announcements
    if (['STUDENT', 'PARENT'].includes(req.user.role)) {
      where.isPublished = true;
    }

    const total = await prisma.announcement.count({ where });

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: announcements,
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

// GET /api/announcements/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id }
    });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
});

// POST /api/announcements
router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, content, targetAudience = ['All'], targetGrades = [], priority = 'NORMAL', publishedAt, expiresAt } = req.body;

    const announcement = await prisma.announcement.create({
      data: {
        institutionId: req.user.institutionId,
        title,
        content,
        targetAudience,
        targetGrades,
        priority,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: req.user.id,
        isPublished: !!publishedAt
      }
    });

    res.status(201).json({ success: true, data: announcement, message: 'Announcement created successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/announcements/:id
router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const { title, content, targetAudience, targetGrades, priority, isPublished, expiresAt } = req.body;

    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: {
        title,
        content,
        targetAudience,
        targetGrades,
        priority,
        isPublished,
        publishedAt: isPublished && !existing.publishedAt ? new Date() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      }
    });

    res.json({ success: true, data: announcement, message: 'Announcement updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/announcements/:id
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
