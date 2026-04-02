const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

/**
 * Check scheduling conflicts for a timetable slot.
 * Returns an array of conflict descriptions (empty if no conflicts).
 *
 * @param {Object} params
 * @param {string} params.timetableId - Timetable ID
 * @param {string} params.teacherId - Teacher ID
 * @param {string} params.classId - Class ID
 * @param {number} params.dayOfWeek - Day of week (1-5)
 * @param {number} params.periodNumber - Period number (1-8)
 * @param {string} [params.room] - Room identifier (optional)
 * @param {string} [params.excludeSlotId] - Slot ID to exclude (for updates)
 * @returns {Promise<Array<{type: string, message: string}>>} Array of conflicts
 */
async function checkConflicts({ timetableId, teacherId, classId, dayOfWeek, periodNumber, room, excludeSlotId }) {
  const conflicts = [];
  const day = parseInt(dayOfWeek);
  const period = parseInt(periodNumber);

  // Base filter: same timetable, same day, same period, excluding current slot if updating
  const baseWhere = {
    timetableId,
    dayOfWeek: day,
    periodNumber: period,
    ...(excludeSlotId ? { id: { not: excludeSlotId } } : {}),
  };

  // Check teacher double-booking
  if (teacherId) {
    const teacherConflict = await prisma.timetableSlot.findFirst({
      where: { ...baseWhere, teacherId },
      include: {
        class: true,
        subject: true,
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (teacherConflict) {
      const name = teacherConflict.teacher?.user
        ? `${teacherConflict.teacher.user.firstName} ${teacherConflict.teacher.user.lastName}`
        : 'Teacher';
      conflicts.push({
        type: 'teacher',
        message: `${name} is already assigned to ${teacherConflict.class?.name || 'another class'} (${teacherConflict.subject?.name || 'a subject'}) at this time.`,
      });
    }
  }

  // Check class double-booking
  if (classId) {
    const classConflict = await prisma.timetableSlot.findFirst({
      where: { ...baseWhere, classId },
      include: { subject: true },
    });
    if (classConflict) {
      conflicts.push({
        type: 'class',
        message: `This class already has ${classConflict.subject?.name || 'a subject'} scheduled at this time.`,
      });
    }
  }

  // Check room double-booking (only if room is specified)
  if (room) {
    const roomConflict = await prisma.timetableSlot.findFirst({
      where: { ...baseWhere, room },
      include: { class: true, subject: true },
    });
    if (roomConflict) {
      conflicts.push({
        type: 'room',
        message: `Room "${room}" is already occupied by ${roomConflict.class?.name || 'another class'} (${roomConflict.subject?.name || 'a subject'}) at this time.`,
      });
    }
  }

  return conflicts;
}

// Slot include for consistent response shape
const slotInclude = {
  subject: true,
  class: true,
  teacher: {
    include: {
      user: { select: { firstName: true, lastName: true } }
    }
  }
};

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
    const { classId, teacherId } = req.query;

    // Build slot filter
    const slotWhere = {};
    if (classId) slotWhere.classId = classId;
    if (teacherId) slotWhere.teacherId = teacherId;

    const timetable = await prisma.timetable.findUnique({
      where: { id: req.params.id },
      include: {
        slots: {
          where: Object.keys(slotWhere).length > 0 ? slotWhere : undefined,
          include: slotInclude,
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

// PUT /api/timetables/:id
router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('academicYear').optional().isInt({ min: 2000 }).withMessage('Valid academic year is required'),
  body('term').optional().isInt({ min: 1, max: 4 }).withMessage('Term must be 1-4'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const existing = await prisma.timetable.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    const { name, academicYear, term, effectiveFrom, effectiveTo, isActive } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (academicYear !== undefined) data.academicYear = parseInt(academicYear);
    if (term !== undefined) data.term = parseInt(term);
    if (effectiveFrom !== undefined) data.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTo !== undefined) data.effectiveTo = effectiveTo ? new Date(effectiveTo) : null;
    if (isActive !== undefined) data.isActive = isActive;

    const timetable = await prisma.timetable.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, data: timetable, message: 'Timetable updated successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/timetables/:id/slots — Create a new slot with conflict checking
router.post('/:id/slots', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), [
  body('dayOfWeek').isInt({ min: 1, max: 5 }).withMessage('Day must be 1-5 (Monday-Friday)'),
  body('periodNumber').isInt({ min: 1, max: 8 }).withMessage('Period number must be 1-8'),
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

    // Verify timetable exists
    const timetable = await prisma.timetable.findUnique({ where: { id: req.params.id } });
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    // Server-side conflict detection
    const conflicts = await checkConflicts({
      timetableId: req.params.id,
      teacherId,
      classId,
      dayOfWeek,
      periodNumber,
      room: room || null,
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Scheduling conflicts detected',
        conflicts,
      });
    }

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
        room: room || null,
      },
      include: slotInclude,
    });

    res.status(201).json({ success: true, data: slot, message: 'Slot added successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/timetables/:id/slots/:slotId — Update an existing slot with conflict checking
router.put('/:id/slots/:slotId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), [
  body('dayOfWeek').optional().isInt({ min: 1, max: 5 }).withMessage('Day must be 1-5 (Monday-Friday)'),
  body('periodNumber').optional().isInt({ min: 1, max: 8 }).withMessage('Period number must be 1-8'),
  body('subjectId').optional().notEmpty().withMessage('Subject ID cannot be empty'),
  body('classId').optional().notEmpty().withMessage('Class ID cannot be empty'),
  body('teacherId').optional().notEmpty().withMessage('Teacher ID cannot be empty'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const existing = await prisma.timetableSlot.findUnique({
      where: { id: req.params.slotId },
    });
    if (!existing || existing.timetableId !== req.params.id) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    const { dayOfWeek, periodNumber, startTime, endTime, subjectId, classId, teacherId, room } = req.body;

    // Merge existing values with updates for conflict checking
    const merged = {
      timetableId: req.params.id,
      teacherId: teacherId || existing.teacherId,
      classId: classId || existing.classId,
      dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : existing.dayOfWeek,
      periodNumber: periodNumber !== undefined ? parseInt(periodNumber) : existing.periodNumber,
      room: room !== undefined ? (room || null) : existing.room,
    };

    // Server-side conflict detection (excluding this slot)
    const conflicts = await checkConflicts({
      ...merged,
      excludeSlotId: req.params.slotId,
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Scheduling conflicts detected',
        conflicts,
      });
    }

    const data = {};
    if (dayOfWeek !== undefined) data.dayOfWeek = parseInt(dayOfWeek);
    if (periodNumber !== undefined) data.periodNumber = parseInt(periodNumber);
    if (startTime !== undefined) data.startTime = startTime;
    if (endTime !== undefined) data.endTime = endTime;
    if (subjectId !== undefined) data.subjectId = subjectId;
    if (classId !== undefined) data.classId = classId;
    if (teacherId !== undefined) data.teacherId = teacherId;
    if (room !== undefined) data.room = room || null;

    const slot = await prisma.timetableSlot.update({
      where: { id: req.params.slotId },
      data,
      include: slotInclude,
    });

    res.json({ success: true, data: slot, message: 'Slot updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/timetables/:id/slots/:slotId — Remove a single slot
router.delete('/:id/slots/:slotId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const existing = await prisma.timetableSlot.findUnique({
      where: { id: req.params.slotId },
    });
    if (!existing || existing.timetableId !== req.params.id) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    await prisma.timetableSlot.delete({ where: { id: req.params.slotId } });
    res.json({ success: true, message: 'Slot deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/timetables/:id/check-conflicts — Real-time conflict check without saving
router.post('/:id/check-conflicts', protect, [
  body('teacherId').notEmpty().withMessage('Teacher ID is required'),
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('dayOfWeek').isInt({ min: 1, max: 5 }).withMessage('Day must be 1-5'),
  body('periodNumber').isInt({ min: 1, max: 8 }).withMessage('Period must be 1-8'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { teacherId, classId, dayOfWeek, periodNumber, room, excludeSlotId } = req.body;

    const conflicts = await checkConflicts({
      timetableId: req.params.id,
      teacherId,
      classId,
      dayOfWeek: parseInt(dayOfWeek),
      periodNumber: parseInt(periodNumber),
      room: room || null,
      excludeSlotId: excludeSlotId || null,
    });

    res.json({ success: true, conflicts, hasConflicts: conflicts.length > 0 });
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
