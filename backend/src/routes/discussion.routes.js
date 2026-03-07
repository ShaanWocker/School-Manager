const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// GET /api/discussions
router.get('/', protect, async (req, res, next) => {
  try {
    const { subjectId, category, page = 1, limit = 20 } = req.query;

    const where = {};
    if (subjectId) where.subjectId = subjectId;
    if (category) where.category = category;

    const total = await prisma.discussion.count({ where });

    const discussions = await prisma.discussion.findMany({
      where,
      include: {
        author: {
          select: { firstName: true, lastName: true, avatar: true }
        },
        _count: { select: { replies: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: discussions,
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

// GET /api/discussions/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const discussion = await prisma.discussion.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: { firstName: true, lastName: true, avatar: true }
        },
        replies: {
          include: {
            author: {
              select: { firstName: true, lastName: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    res.json({ success: true, data: discussion });
  } catch (error) {
    next(error);
  }
});

// POST /api/discussions
router.post('/', protect, [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category')
    .isIn(['QUESTION', 'STUDY_GROUP', 'GROUP_PROJECT', 'ANNOUNCEMENT', 'GENERAL'])
    .withMessage('Invalid category')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, content, category, subjectId } = req.body;

    const discussion = await prisma.discussion.create({
      data: {
        title,
        content,
        category,
        subjectId: subjectId || null,
        authorId: req.user.id
      },
      include: {
        author: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    res.status(201).json({ success: true, data: discussion, message: 'Discussion created successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/discussions/:id/reply
router.post('/:id/reply', protect, [
  body('content').notEmpty().withMessage('Content is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const discussion = await prisma.discussion.findUnique({ where: { id: req.params.id } });
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    const reply = await prisma.discussionReply.create({
      data: {
        content: req.body.content,
        discussionId: req.params.id,
        authorId: req.user.id
      },
      include: {
        author: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    res.status(201).json({ success: true, data: reply, message: 'Reply added successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/discussions/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const discussion = await prisma.discussion.findUnique({ where: { id: req.params.id } });
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    if (discussion.authorId !== req.user.id && !['SUPER_ADMIN', 'PRINCIPAL'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this discussion' });
    }

    await prisma.discussion.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Discussion deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
