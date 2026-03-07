const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// GET /api/institutions
router.get('/', protect, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const institutions = await prisma.institution.findMany({
      include: {
        _count: {
          select: { users: true, students: true, teachers: true }
        }
      }
    });
    res.json({ success: true, data: institutions });
  } catch (error) {
    next(error);
  }
});

// GET /api/institutions/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const institution = await prisma.institution.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { users: true, students: true, teachers: true, classes: true }
        }
      }
    });
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }
    res.json({ success: true, data: institution });
  } catch (error) {
    next(error);
  }
});

// POST /api/institutions
router.post('/', protect, authorize('SUPER_ADMIN'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('type').notEmpty().withMessage('Type is required'),
  body('province').notEmpty().withMessage('Province is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const institution = await prisma.institution.create({
      data: req.body
    });

    res.status(201).json({ success: true, data: institution, message: 'Institution created successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/institutions/:id
router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const existing = await prisma.institution.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    const institution = await prisma.institution.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json({ success: true, data: institution, message: 'Institution updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/institutions/:id
router.delete('/:id', protect, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const existing = await prisma.institution.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    await prisma.institution.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Institution deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
