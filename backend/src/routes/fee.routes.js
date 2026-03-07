const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// ============================================
// @route   GET /api/fees/outstanding
// @desc    Get all outstanding fees
// NOTE: Must be before /:id to avoid conflict
// ============================================

router.get('/outstanding', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER'), async (req, res, next) => {
  try {
    const { academicYear, grade } = req.query;

    // Get students with outstanding balances
    const where = {
      institutionId: req.user.institutionId,
      outstandingBalance: { gt: 0 }
    };

    if (grade) where.currentGrade = grade;

    const students = await prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { outstandingBalance: 'desc' }
    });

    const totalOutstanding = students.reduce((sum, s) => sum + parseFloat(s.outstandingBalance), 0);

    res.json({
      success: true,
      data: {
        students,
        totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
        count: students.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/fees/student/:studentId
// @desc    Get fees applicable to a student
// ============================================

router.get('/student/:studentId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER', 'PARENT', 'SGB_MEMBER'), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const { academicYear } = req.query;

    const where = {
      institutionId: student.institutionId
    };

    if (academicYear) {
      where.academicYear = parseInt(academicYear);
    }

    // Get fees applicable to student's grade or all grades
    const fees = await prisma.fee.findMany({
      where: {
        ...where,
        OR: [
          { grade: student.currentGrade },
          { grade: null }
        ]
      },
      orderBy: [{ feeType: 'asc' }, { amount: 'desc' }]
    });

    // Apply fee exemptions
    const applicableFees = fees.map(fee => ({
      ...fee,
      applicableAmount: student.feeExemption ? 0 : parseFloat(fee.amount),
      isExempted: student.feeExemption,
      exemptionReason: student.exemptionReason
    }));

    const totalFees = applicableFees.reduce((sum, f) => sum + f.applicableAmount, 0);

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          grade: student.currentGrade,
          feeExemption: student.feeExemption,
          exemptionReason: student.exemptionReason,
          outstandingBalance: parseFloat(student.outstandingBalance)
        },
        fees: applicableFees,
        totalFees: parseFloat(totalFees.toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/fees
// @desc    Get all fees with filter and pagination
// @access  Private
// ============================================

router.get('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER', 'PARENT', 'SGB_MEMBER'), async (req, res, next) => {
  try {
    const {
      feeType,
      academicYear,
      term,
      grade,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };

    if (feeType) where.feeType = feeType;
    if (academicYear) where.academicYear = parseInt(academicYear);
    if (term) where.term = parseInt(term);
    if (grade) where.grade = grade;

    const total = await prisma.fee.count({ where });

    const fees = await prisma.fee.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: fees,
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
// @route   GET /api/fees/:id
// @desc    Get single fee by ID
// @access  Private
// ============================================

router.get('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER', 'PARENT', 'SGB_MEMBER'), async (req, res, next) => {
  try {
    const fee = await prisma.fee.findUnique({
      where: { id: req.params.id }
    });

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee not found'
      });
    }

    res.json({
      success: true,
      data: fee
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/fees
// @desc    Create fee structure
// @access  Private (Admin, Principal, Finance Officer)
// ============================================

router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER'), [
  body('name').notEmpty().withMessage('Fee name is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('feeType')
    .isIn(['TUITION', 'REGISTRATION', 'EXAM', 'TRANSPORT', 'LIBRARY', 'ACTIVITY', 'OTHER'])
    .withMessage('Invalid fee type'),
  body('academicYear').isInt({ min: 2000 }).withMessage('Valid academic year is required'),
  body('term').optional().isInt({ min: 1, max: 4 }).withMessage('Term must be 1, 2, 3, or 4')
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
      description,
      amount,
      feeType,
      grade,
      academicYear,
      term,
      dueDate,
      isCompulsory = true
    } = req.body;

    const fee = await prisma.fee.create({
      data: {
        institutionId: req.user.institutionId,
        name,
        description,
        amount: parseFloat(amount),
        feeType,
        grade,
        academicYear: parseInt(academicYear),
        term: term ? parseInt(term) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        isCompulsory
      }
    });

    res.status(201).json({
      success: true,
      data: fee,
      message: 'Fee created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/fees/:id
// @desc    Update fee
// @access  Private (Admin, Principal, Finance Officer)
// ============================================

router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER'), async (req, res, next) => {
  try {
    const existing = await prisma.fee.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Fee not found'
      });
    }

    const {
      name,
      description,
      amount,
      feeType,
      grade,
      term,
      dueDate,
      isCompulsory
    } = req.body;

    const fee = await prisma.fee.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        feeType,
        grade,
        term: term !== undefined ? parseInt(term) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        isCompulsory
      }
    });

    res.json({
      success: true,
      data: fee,
      message: 'Fee updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   DELETE /api/fees/:id
// @desc    Delete fee
// @access  Private (Admin, Principal)
// ============================================

router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const fee = await prisma.fee.findUnique({
      where: { id: req.params.id }
    });

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee not found'
      });
    }

    await prisma.fee.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Fee deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
