const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// ============================================
// @route   GET /api/classes
// @desc    Get all classes with filter and pagination
// @access  Private
// ============================================

router.get('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), async (req, res, next) => {
  try {
    const {
      grade,
      academicYear,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };

    if (grade) {
      where.grade = grade;
    }

    if (academicYear) {
      where.academicYear = parseInt(academicYear);
    }

    const total = await prisma.class.count({ where });

    const classes = await prisma.class.findMany({
      where,
      include: {
        classTeacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: { students: true, enrollments: true }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: classes,
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
// @route   GET /api/classes/:id
// @desc    Get single class by ID with relations
// @access  Private
// ============================================

router.get('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), async (req, res, next) => {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: {
        classTeacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        students: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        enrollments: {
          include: {
            subject: true,
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
        }
      }
    });

    if (!cls) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      data: cls
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/classes
// @desc    Create new class
// @access  Private (Admin, Principal)
// ============================================

router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), [
  body('name').notEmpty().withMessage('Class name is required'),
  body('grade').notEmpty().withMessage('Grade is required'),
  body('academicYear').isInt({ min: 2000 }).withMessage('Valid academic year is required'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer')
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
      name,
      grade,
      section,
      academicYear,
      classTeacherId,
      capacity = 40,
      room
    } = req.body;

    // Check for duplicate class name in same institution and academic year
    const existing = await prisma.class.findFirst({
      where: {
        name,
        academicYear: parseInt(academicYear),
        institutionId: req.user.institutionId
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A class with this name already exists for this academic year'
      });
    }

    const cls = await prisma.class.create({
      data: {
        name,
        grade,
        section,
        academicYear: parseInt(academicYear),
        institutionId: req.user.institutionId,
        classTeacherId,
        capacity: parseInt(capacity),
        room
      },
      include: {
        classTeacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: cls,
      message: 'Class created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/classes/:id
// @desc    Update class
// @access  Private (Admin, Principal)
// ============================================

router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const {
      name,
      grade,
      section,
      classTeacherId,
      capacity,
      room
    } = req.body;

    const existing = await prisma.class.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const cls = await prisma.class.update({
      where: { id: req.params.id },
      data: {
        name,
        grade,
        section,
        classTeacherId,
        capacity: capacity !== undefined ? parseInt(capacity) : undefined,
        room
      },
      include: {
        classTeacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: cls,
      message: 'Class updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   DELETE /api/classes/:id
// @desc    Delete class
// @access  Private (Admin, Principal)
// ============================================

router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { students: true } }
      }
    });

    if (!cls) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (cls._count.students > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class with active students. Please reassign students first.'
      });
    }

    await prisma.class.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/classes/:id/students
// @desc    Get students in a class
// @access  Private
// ============================================

router.get('/:id/students', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), async (req, res, next) => {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!cls) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      data: cls.students
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/classes/:id/timetable
// @desc    Get class timetable
// @access  Private
// ============================================

router.get('/:id/timetable', protect, async (req, res, next) => {
  try {
    const slots = await prisma.timetableSlot.findMany({
      where: { classId: req.params.id },
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        timetable: true
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
    });

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/classes/:id/enroll
// @desc    Enroll student in class
// @access  Private (Admin, Principal)
// ============================================

router.post('/:id/enroll', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('subjectId').notEmpty().withMessage('Subject ID is required'),
  body('academicYear').isInt({ min: 2000 }).withMessage('Valid academic year is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { studentId, subjectId, academicYear, term } = req.body;

    // Check for duplicate enrollment
    const existing = await prisma.enrollment.findFirst({
      where: {
        studentId,
        subjectId,
        academicYear: parseInt(academicYear)
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this subject for this academic year'
      });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        classId: req.params.id,
        subjectId,
        academicYear: parseInt(academicYear),
        term: term ? parseInt(term) : null
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
        subject: true,
        class: true
      }
    });

    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Student enrolled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   DELETE /api/classes/:id/students/:studentId
// @desc    Remove student from class
// @access  Private (Admin, Principal)
// ============================================

router.delete('/:id/students/:studentId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.classId !== req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Student is not in this class'
      });
    }

    await prisma.student.update({
      where: { id: req.params.studentId },
      data: { classId: null }
    });

    res.json({
      success: true,
      message: 'Student removed from class successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
