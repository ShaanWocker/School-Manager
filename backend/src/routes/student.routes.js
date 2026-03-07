const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize, checkInstitutionAccess, checkStudentAccess } = require('../middleware/auth.middleware');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ============================================
// @route   GET /api/students
// @desc    Get all students with search, filter, pagination
// @access  Private (Admin, Principal, Teacher)
// ============================================

router.get('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), async (req, res, next) => {
  try {
    const {
      search,
      grade,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build where clause
    const where = {
      institutionId: req.user.institutionId
    };

    // Search filter
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
        { user: { idNumber: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Grade filter
    if (grade) {
      where.currentGrade = grade;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.student.count({ where });

    // Get students with pagination
    const students = await prisma.student.findMany({
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
        class: true,
        parents: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: students,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/students/:id
// @desc    Get single student by ID
// @access  Private
// ============================================

router.get('/:id', protect, checkStudentAccess, async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
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
        class: true,
        parents: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        enrollments: {
          include: {
            subject: true,
            class: true
          }
        },
        grades: {
          include: {
            subject: true
          },
          orderBy: { recordedAt: 'desc' },
          take: 10
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/students
// @desc    Create new student
// @access  Private (Admin, Principal)
// ============================================

router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), [
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('idNumber').notEmpty().withMessage('ID number is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').notEmpty().withMessage('Gender is required'),
  body('currentGrade').notEmpty().withMessage('Grade is required'),
  body('admissionDate').isISO8601().withMessage('Valid admission date is required')
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
      dateOfBirth,
      gender,
      nationality = 'South African',
      homeLanguage,
      religion,
      address,
      city,
      province,
      postalCode,
      currentGrade,
      previousSchool,
      classId,
      admissionDate,
      guardianName,
      guardianPhone,
      guardianEmail,
      guardianRelation,
      emergencyContact,
      emergencyPhone,
      medicalConditions,
      allergies,
      medications,
      bloodType,
      feeCategory = 'Standard',
      feeExemption = false,
      exemptionReason
    } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate admission number
    const studentCount = await prisma.student.count({
      where: { institutionId: req.user.institutionId }
    });
    const admissionNumber = `STU${new Date().getFullYear()}${String(studentCount + 1).padStart(4, '0')}`;

    // Generate default password (student can change later)
    const defaultPassword = idNumber.slice(-6) || 'Student123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Create user and student in a transaction
    const student = await prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          idNumber,
          role: 'STUDENT',
          institutionId: req.user.institutionId
        }
      });

      // Create student profile
      const studentProfile = await tx.student.create({
        data: {
          userId: user.id,
          institutionId: req.user.institutionId,
          admissionNumber,
          admissionDate: new Date(admissionDate),
          dateOfBirth: new Date(dateOfBirth),
          gender,
          nationality,
          homeLanguage,
          religion,
          address,
          city,
          province,
          postalCode,
          currentGrade,
          previousSchool,
          classId,
          guardianName,
          guardianPhone,
          guardianEmail,
          guardianRelation,
          emergencyContact,
          emergencyPhone,
          medicalConditions,
          allergies,
          medications,
          bloodType,
          feeCategory,
          feeExemption,
          exemptionReason,
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
          },
          class: true
        }
      });

      return studentProfile;
    });

    res.status(201).json({
      success: true,
      data: student,
      message: 'Student created successfully',
      defaultPassword // Send this only once
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private (Admin, Principal)
// ============================================

router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      nationality,
      homeLanguage,
      religion,
      address,
      city,
      province,
      postalCode,
      currentGrade,
      classId,
      guardianName,
      guardianPhone,
      guardianEmail,
      guardianRelation,
      emergencyContact,
      emergencyPhone,
      medicalConditions,
      allergies,
      medications,
      bloodType,
      feeCategory,
      feeExemption,
      exemptionReason,
      status
    } = req.body;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { user: true }
    });

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update in transaction
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // Update user info
      await tx.user.update({
        where: { id: existingStudent.userId },
        data: {
          firstName,
          lastName,
          phone
        }
      });

      // Update student profile
      const student = await tx.student.update({
        where: { id: req.params.id },
        data: {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          nationality,
          homeLanguage,
          religion,
          address,
          city,
          province,
          postalCode,
          currentGrade,
          classId,
          guardianName,
          guardianPhone,
          guardianEmail,
          guardianRelation,
          emergencyContact,
          emergencyPhone,
          medicalConditions,
          allergies,
          medications,
          bloodType,
          feeCategory,
          feeExemption,
          exemptionReason,
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
          class: true
        }
      });

      return student;
    });

    res.json({
      success: true,
      data: updatedStudent,
      message: 'Student updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   DELETE /api/students/:id
// @desc    Delete student (soft delete)
// @access  Private (Admin, Principal)
// ============================================

router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Soft delete - update status and deactivate user
    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: req.params.id },
        data: { status: 'INACTIVE' }
      });

      await tx.user.update({
        where: { id: student.userId },
        data: { isActive: false }
      });
    });

    res.json({
      success: true,
      message: 'Student deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/students/export/csv
// @desc    Export students to CSV
// @access  Private (Admin, Principal)
// ============================================

router.get('/export/csv', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const students = await prisma.student.findMany({
      where: { institutionId: req.user.institutionId },
      include: {
        user: true,
        class: true
      }
    });

    // Convert to CSV
    const csv = [
      ['Admission Number', 'First Name', 'Last Name', 'ID Number', 'Email', 'Grade', 'Class', 'Status', 'Guardian Name', 'Guardian Phone'].join(','),
      ...students.map(s => [
        s.admissionNumber,
        s.user.firstName,
        s.user.lastName,
        s.user.idNumber || '',
        s.user.email,
        s.currentGrade,
        s.class?.name || '',
        s.status,
        s.guardianName || '',
        s.guardianPhone || ''
      ].join(','))
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename=students_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/students/:id/performance
// @desc    Get student performance summary
// @access  Private
// ============================================

router.get('/:id/performance', protect, checkStudentAccess, async (req, res, next) => {
  try {
    const { academicYear, term } = req.query;

    const where = {
      studentId: req.params.id
    };

    if (academicYear) where.academicYear = parseInt(academicYear);
    if (term) where.term = parseInt(term);

    const grades = await prisma.grade.findMany({
      where,
      include: {
        subject: true
      },
      orderBy: { recordedAt: 'desc' }
    });

    // Calculate statistics
    const subjectAverages = {};
    grades.forEach(grade => {
      if (!subjectAverages[grade.subject.name]) {
        subjectAverages[grade.subject.name] = {
          total: 0,
          count: 0,
          grades: []
        };
      }
      subjectAverages[grade.subject.name].total += parseFloat(grade.percentage);
      subjectAverages[grade.subject.name].count += 1;
      subjectAverages[grade.subject.name].grades.push(grade);
    });

    const performance = Object.entries(subjectAverages).map(([subject, data]) => ({
      subject,
      average: (data.total / data.count).toFixed(2),
      grades: data.grades
    }));

    const overallAverage = grades.length > 0
      ? (grades.reduce((sum, g) => sum + parseFloat(g.percentage), 0) / grades.length).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        overallAverage,
        subjectPerformance: performance,
        totalAssessments: grades.length
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
