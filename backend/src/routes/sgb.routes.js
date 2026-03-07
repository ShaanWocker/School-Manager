const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// GET /api/sgb
router.get('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'SGB_MEMBER'), async (req, res, next) => {
  try {
    const { status } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };

    if (status) where.status = status;

    const members = await prisma.sGBMember.findMany({
      where,
      orderBy: { appointedDate: 'desc' }
    });

    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
});

// GET /api/sgb/:id
router.get('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'SGB_MEMBER'), async (req, res, next) => {
  try {
    const member = await prisma.sGBMember.findUnique({
      where: { id: req.params.id }
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'SGB member not found' });
    }

    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
});

// POST /api/sgb
router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('role').notEmpty().withMessage('Role is required'),
  body('memberType').notEmpty().withMessage('Member type is required'),
  body('appointedDate').isISO8601().withMessage('Valid appointed date is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, role, memberType, email, phone, appointedDate, termEndDate } = req.body;

    const member = await prisma.sGBMember.create({
      data: {
        institutionId: req.user.institutionId,
        name,
        role,
        memberType,
        email,
        phone,
        appointedDate: new Date(appointedDate),
        termEndDate: termEndDate ? new Date(termEndDate) : null
      }
    });

    res.status(201).json({ success: true, data: member, message: 'SGB member added successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/sgb/:id
router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const existing = await prisma.sGBMember.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'SGB member not found' });
    }

    const { name, role, memberType, email, phone, termEndDate, status } = req.body;

    const member = await prisma.sGBMember.update({
      where: { id: req.params.id },
      data: { name, role, memberType, email, phone, termEndDate: termEndDate ? new Date(termEndDate) : undefined, status }
    });

    res.json({ success: true, data: member, message: 'SGB member updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sgb/:id
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const existing = await prisma.sGBMember.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'SGB member not found' });
    }

    await prisma.sGBMember.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'SGB member removed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
