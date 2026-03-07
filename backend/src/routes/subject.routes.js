const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// GET /api/subjects
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      grade,
      isCore,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };

    if (grade) where.grade = grade;
    if (isCore !== undefined) where.isCore = isCore === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    const total = await prisma.subject.count({ where });

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: subjects,
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

// GET /api/subjects/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: req.params.id },
      include: {
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
});

// POST /api/subjects
router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('code').notEmpty().withMessage('Code is required'),
  body('grade').notEmpty().withMessage('Grade is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, code, description, grade, isCore = false, credits } = req.body;

    // Check for unique code
    const existing = await prisma.subject.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Subject code already exists' });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        description,
        grade,
        institutionId: req.user.institutionId,
        isCore,
        credits: credits ? parseInt(credits) : null
      }
    });

    res.status(201).json({ success: true, data: subject, message: 'Subject created successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/subjects/:id
router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const existing = await prisma.subject.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const { name, description, grade, isCore, credits } = req.body;

    const subject = await prisma.subject.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        grade,
        isCore,
        credits: credits !== undefined ? parseInt(credits) : undefined
      }
    });

    res.json({ success: true, data: subject, message: 'Subject updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/subjects/:id
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const existing = await prisma.subject.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
