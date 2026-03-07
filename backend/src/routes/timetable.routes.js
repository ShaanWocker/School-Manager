const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// GET /api/timetables
router.get('/', protect, async (req, res, next) => {
  try {
    const { academicYear, term, isActive } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };

    if (academicYear) where.academicYear = parseInt(academicYear);
    if (term) where.term = parseInt(term);
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const timetables = await prisma.timetable.findMany({
      where,
      include: {
        _count: { select: { slots: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: timetables });
  } catch (error) {
    next(error);
  }
});

// GET /api/timetables/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const timetable = await prisma.timetable.findUnique({
      where: { id: req.params.id },
      include: {
        slots: {
          include: {
            subject: true,
            class: true,
            teacher: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          },
          orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
        }
      }
    });

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    res.json({ success: true, data: timetable });
  } catch (error) {
    next(error);
  }
});

// POST /api/timetables
router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('academicYear').isInt({ min: 2000 }).withMessage('Valid academic year is required'),
  body('term').isInt({ min: 1, max: 4 }).withMessage('Term must be 1-4'),
  body('effectiveFrom').isISO8601().withMessage('Effective from date is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, academicYear, term, effectiveFrom, effectiveTo, isActive = true } = req.body;

    const timetable = await prisma.timetable.create({
      data: {
        institutionId: req.user.institutionId,
        name,
        academicYear: parseInt(academicYear),
        term: parseInt(term),
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        isActive
      }
    });

    res.status(201).json({ success: true, data: timetable, message: 'Timetable created successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/timetables/:id/slots
router.post('/:id/slots', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), [
  body('dayOfWeek').isInt({ min: 1, max: 7 }).withMessage('Day must be 1-7'),
  body('periodNumber').isInt({ min: 1 }).withMessage('Period number is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required'),
  body('subjectId').notEmpty().withMessage('Subject ID is required'),
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('teacherId').notEmpty().withMessage('Teacher ID is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { dayOfWeek, periodNumber, startTime, endTime, subjectId, classId, teacherId, room } = req.body;

    const slot = await prisma.timetableSlot.create({
      data: {
        timetableId: req.params.id,
        dayOfWeek: parseInt(dayOfWeek),
        periodNumber: parseInt(periodNumber),
        startTime,
        endTime,
        subjectId,
        classId,
        teacherId,
        room
      },
      include: {
        subject: true,
        class: true,
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    res.status(201).json({ success: true, data: slot, message: 'Slot added successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/timetables/:id
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const existing = await prisma.timetable.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    await prisma.timetable.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
