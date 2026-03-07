const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// ============================================
// @route   GET /api/attendance/report
// @desc    Generate attendance report
// NOTE: Must be before /:id to avoid conflict
// ============================================

router.get('/report', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), async (req, res, next) => {
  try {
    const {
      classId,
      startDate,
      endDate,
      academicYear,
      term
    } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };

    if (classId) where.classId = classId;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        class: true
      },
      orderBy: { date: 'asc' }
    });

    // Calculate summary statistics
    const summary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      excused: attendance.filter(a => a.status === 'EXCUSED').length,
      sick: attendance.filter(a => a.status === 'SICK').length
    };

    summary.presentPercentage = summary.total > 0
      ? parseFloat(((summary.present / summary.total) * 100).toFixed(2))
      : 0;

    res.json({
      success: true,
      data: { attendance, summary }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/attendance/student/:studentId/summary
// @desc    Get attendance summary for a student
// ============================================

router.get('/student/:studentId/summary', protect, async (req, res, next) => {
  try {
    const { academicYear, term, startDate, endDate } = req.query;

    const where = { studentId: req.params.studentId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const summary = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      excused: attendance.filter(a => a.status === 'EXCUSED').length,
      sick: attendance.filter(a => a.status === 'SICK').length
    };

    summary.attendancePercentage = summary.totalDays > 0
      ? parseFloat((((summary.present + summary.late + summary.excused + summary.sick) / summary.totalDays) * 100).toFixed(2))
      : 0;

    res.json({
      success: true,
      data: { attendance, summary }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/attendance/class/:classId/date/:date
// @desc    Get class attendance for a specific date
// ============================================

router.get('/class/:classId/date/:date', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), async (req, res, next) => {
  try {
    const dateObj = new Date(req.params.date);
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const attendance = await prisma.attendance.findMany({
      where: {
        classId: req.params.classId,
        date: {
          gte: dateObj,
          lt: nextDay
        }
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // Get all students in class to identify who wasn't marked
    const classStudents = await prisma.student.findMany({
      where: { classId: req.params.classId },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    const markedStudentIds = attendance.map(a => a.studentId);
    const unmarkedStudents = classStudents.filter(s => !markedStudentIds.includes(s.id));

    res.json({
      success: true,
      data: {
        date: req.params.date,
        attendance,
        unmarkedStudents,
        summary: {
          total: classStudents.length,
          marked: attendance.length,
          unmarked: unmarkedStudents.length,
          present: attendance.filter(a => a.status === 'PRESENT').length,
          absent: attendance.filter(a => a.status === 'ABSENT').length,
          late: attendance.filter(a => a.status === 'LATE').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/attendance
// @desc    Get all attendance records with filter and pagination
// @access  Private
// ============================================

router.get('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER', 'PARENT', 'STUDENT'), async (req, res, next) => {
  try {
    const {
      studentId,
      classId,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };

    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Students can only view their own attendance
    if (req.user.role === 'STUDENT' && req.user.studentProfile) {
      where.studentId = req.user.studentProfile.id;
    }

    // Parents can only view their children's attendance
    if (req.user.role === 'PARENT' && req.user.parentProfile) {
      const childIds = req.user.parentProfile.students.map(s => s.id);
      where.studentId = { in: childIds };
    }

    const total = await prisma.attendance.count({ where });

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        class: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: attendance,
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

// ============================================
// @route   GET /api/attendance/:id
// @desc    Get single attendance record by ID
// @access  Private
// ============================================

router.get('/:id', protect, async (req, res, next) => {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: req.params.id },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        class: true
      }
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/attendance
// @desc    Mark attendance for a student
// @access  Private (Teacher, Principal, Admin Staff)
// ============================================

router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('status')
    .isIn(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'])
    .withMessage('Invalid attendance status'),
  body('date').optional().isISO8601().withMessage('Valid date is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      studentId,
      classId,
      status,
      date,
      checkInTime,
      checkOutTime,
      remarks
    } = req.body;

    const attendanceDate = date ? new Date(date) : new Date();

    // Check for existing attendance record for this student on this date
    const existing = await prisma.attendance.findFirst({
      where: {
        studentId,
        date: {
          gte: new Date(attendanceDate.toISOString().split('T')[0]),
          lt: new Date(new Date(attendanceDate.toISOString().split('T')[0]).getTime() + 86400000)
        }
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this student on this date'
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        classId,
        institutionId: req.user.institutionId,
        date: attendanceDate,
        status,
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        remarks
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        class: true
      }
    });

    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/attendance/:id
// @desc    Update attendance record
// @access  Private (Teacher, Principal, Admin Staff)
// ============================================

router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), async (req, res, next) => {
  try {
    const existing = await prisma.attendance.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const { status, checkInTime, checkOutTime, remarks } = req.body;

    const attendance = await prisma.attendance.update({
      where: { id: req.params.id },
      data: {
        status,
        checkInTime: checkInTime ? new Date(checkInTime) : undefined,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
        remarks
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        class: true
      }
    });

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record
// @access  Private (Principal, Admin Staff)
// ============================================

router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: req.params.id }
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    await prisma.attendance.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/attendance/bulk
// @desc    Mark attendance for entire class
// @access  Private (Teacher, Principal)
// ============================================

router.post('/bulk', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), [
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('records').isArray({ min: 1 }).withMessage('Attendance records array is required'),
  body('records.*.studentId').notEmpty().withMessage('Student ID is required for each record'),
  body('records.*.status')
    .isIn(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'])
    .withMessage('Invalid status for one or more records')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { classId, date, records } = req.body;
    const attendanceDate = date ? new Date(date) : new Date();
    const dateStart = new Date(attendanceDate.toISOString().split('T')[0]);
    const dateEnd = new Date(dateStart.getTime() + 86400000);

    // Check for any existing records
    const studentIds = records.map(r => r.studentId);
    const existingRecords = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        classId,
        date: { gte: dateStart, lt: dateEnd }
      }
    });

    if (existingRecords.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Attendance already marked for ${existingRecords.length} student(s) on this date`
      });
    }

    const attendanceData = records.map(record => ({
      studentId: record.studentId,
      classId,
      institutionId: req.user.institutionId,
      date: attendanceDate,
      status: record.status,
      remarks: record.remarks || null
    }));

    const result = await prisma.attendance.createMany({
      data: attendanceData
    });

    res.status(201).json({
      success: true,
      data: { count: result.count },
      message: `Attendance marked for ${result.count} students`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
