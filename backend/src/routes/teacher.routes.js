const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ============================================
// @route   GET /api/teachers/export/csv
// @desc    Export teachers to CSV
// @access  Private (Admin, Principal)
// NOTE: This route must be declared before /:id to avoid conflict
// ============================================

router.get('/export/csv', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const teachers = await prisma.teacher.findMany({
      where: { institutionId: req.user.institutionId },
      include: {
        user: true
      }
    });

    const csv = [
      ['Employee Number', 'First Name', 'Last Name', 'Email', 'SACE Number', 'Contract Type', 'Hire Date', 'Status', 'Years Experience'].join(','),
      ...teachers.map(t => [
        t.employeeNumber,
        t.user.firstName,
        t.user.lastName,
        t.user.email,
        t.saceNumber || '',
        t.contractType,
        t.hireDate ? new Date(t.hireDate).toISOString().split('T')[0] : '',
        t.status,
        t.yearsExperience || ''
      ].join(','))
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename=teachers_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/teachers
// @desc    Get all teachers with search, filter, pagination
// @access  Private (Admin, Principal, Admin Staff)
// ============================================

router.get('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const {
      search,
      subject,
      status,
      contractType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (contractType) {
      where.contractType = contractType;
    }

    if (subject) {
      where.subjectTeaching = {
        some: {
          subject: { name: { contains: subject, mode: 'insensitive' } }
        }
      };
    }

    const total = await prisma.teacher.count({ where });

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            idNumber: true,
            avatar: true
          }
        },
        subjectTeaching: {
          include: {
            subject: true
          }
        },
        classes: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: teachers,
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
// @route   GET /api/teachers/:id
// @desc    Get single teacher by ID
// @access  Private
// ============================================

router.get('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), async (req, res, next) => {
  try {
    // Teachers can only view their own profile
    if (req.user.role === 'TEACHER' && req.user.teacherProfile?.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this teacher profile'
      });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            idNumber: true,
            avatar: true,
            isActive: true
          }
        },
        subjectTeaching: {
          include: {
            subject: true
          }
        },
        classes: {
          include: {
            students: {
              select: { id: true }
            }
          }
        },
        timetableSlots: {
          include: {
            subject: true,
            class: true
          }
        }
      }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      data: teacher
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/teachers
// @desc    Create new teacher
// @access  Private (Super Admin, Principal)
// ============================================

router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), [
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('employeeNumber').notEmpty().withMessage('Employee number is required'),
  body('hireDate').isISO8601().withMessage('Valid hire date is required'),
  body('contractType')
    .isIn(['Permanent', 'Contract', 'Temporary'])
    .withMessage('Contract type must be Permanent, Contract, or Temporary'),
  body('yearsExperience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a positive integer')
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
      email,
      firstName,
      lastName,
      phone,
      idNumber,
      employeeNumber,
      saceNumber,
      qualifications,
      specialization,
      yearsExperience,
      hireDate,
      contractType,
      salary,
      address,
      emergencyContact,
      emergencyPhone
    } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if employee number already exists
    const existingEmployee = await prisma.teacher.findUnique({ where: { employeeNumber } });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee number already exists'
      });
    }

    // Check if SACE number already exists (if provided)
    if (saceNumber) {
      const existingSace = await prisma.teacher.findUnique({ where: { saceNumber } });
      if (existingSace) {
        return res.status(400).json({
          success: false,
          message: 'SACE number already exists'
        });
      }
    }

    // Generate default password
    const defaultPassword = idNumber ? idNumber.slice(-6) : 'Teacher123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const teacher = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          idNumber,
          role: 'TEACHER',
          institutionId: req.user.institutionId
        }
      });

      const teacherProfile = await tx.teacher.create({
        data: {
          userId: user.id,
          institutionId: req.user.institutionId,
          employeeNumber,
          saceNumber,
          qualifications,
          specialization,
          yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
          hireDate: new Date(hireDate),
          contractType,
          salary: salary ? parseFloat(salary) : null,
          address,
          emergencyContact,
          emergencyPhone,
          status: 'ACTIVE'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              idNumber: true
            }
          }
        }
      });

      return teacherProfile;
    });

    res.status(201).json({
      success: true,
      data: teacher,
      message: 'Teacher created successfully',
      defaultPassword
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/teachers/:id
// @desc    Update teacher
// @access  Private (Super Admin, Principal, Admin Staff)
// ============================================

router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      qualifications,
      specialization,
      yearsExperience,
      contractType,
      salary,
      address,
      emergencyContact,
      emergencyPhone,
      status
    } = req.body;

    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: { user: true }
    });

    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const updatedTeacher = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingTeacher.userId },
        data: { firstName, lastName, phone }
      });

      const teacher = await tx.teacher.update({
        where: { id: req.params.id },
        data: {
          qualifications,
          specialization,
          yearsExperience: yearsExperience !== undefined ? parseInt(yearsExperience) : undefined,
          contractType,
          salary: salary !== undefined ? parseFloat(salary) : undefined,
          address,
          emergencyContact,
          emergencyPhone,
          status
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              idNumber: true
            }
          },
          subjectTeaching: {
            include: { subject: true }
          },
          classes: true
        }
      });

      return teacher;
    });

    res.json({
      success: true,
      data: updatedTeacher,
      message: 'Teacher updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   DELETE /api/teachers/:id
// @desc    Delete teacher (soft delete - set status to INACTIVE)
// @access  Private (Super Admin, Principal)
// ============================================

router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id: req.params.id },
        data: { status: 'INACTIVE' }
      });

      await tx.user.update({
        where: { id: teacher.userId },
        data: { isActive: false }
      });
    });

    res.json({
      success: true,
      message: 'Teacher deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/teachers/:id/classes
// @desc    Get teacher's assigned classes
// @access  Private
// ============================================

router.get('/:id/classes', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), async (req, res, next) => {
  try {
    if (req.user.role === 'TEACHER' && req.user.teacherProfile?.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this teacher profile'
      });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: {
        classes: {
          include: {
            students: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            enrollments: true
          }
        }
      }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      data: teacher.classes
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/teachers/:id/students
// @desc    Get all students taught by this teacher
// @access  Private
// ============================================

router.get('/:id/students', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), async (req, res, next) => {
  try {
    if (req.user.role === 'TEACHER' && req.user.teacherProfile?.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this teacher profile'
      });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get all students from the teacher's classes
    const classes = await prisma.class.findMany({
      where: { classTeacherId: req.params.id },
      include: {
        students: {
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
        }
      }
    });

    // Flatten and deduplicate students
    const studentMap = new Map();
    classes.forEach(cls => {
      cls.students.forEach(student => {
        if (!studentMap.has(student.id)) {
          studentMap.set(student.id, { ...student, className: cls.name });
        }
      });
    });

    res.json({
      success: true,
      data: Array.from(studentMap.values())
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
