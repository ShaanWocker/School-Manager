const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// ============================================
// @route   GET /api/payments/student/:studentId/balance
// @desc    Calculate student balance
// NOTE: Must be before /:id to avoid conflict
// ============================================

router.get('/student/:studentId/balance', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER', 'PARENT'), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId },
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const { academicYear } = req.query;

    // Get applicable fees
    const feeWhere = {
      institutionId: student.institutionId,
      OR: [
        { grade: student.currentGrade },
        { grade: null }
      ]
    };
    if (academicYear) feeWhere.academicYear = parseInt(academicYear);

    const fees = await prisma.fee.findMany({ where: feeWhere });
    const totalFees = fees.reduce((sum, f) => sum + parseFloat(f.amount), 0);

    // Get total payments
    const paymentWhere = {
      studentId: req.params.studentId,
      status: 'COMPLETED'
    };
    if (academicYear) paymentWhere.academicYear = parseInt(academicYear);

    const payments = await prisma.payment.findMany({ where: paymentWhere });
    const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Apply exemptions
    const effectiveFees = student.feeExemption ? 0 : totalFees;
    const outstandingBalance = effectiveFees - totalPayments;

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          grade: student.currentGrade,
          feeExemption: student.feeExemption
        },
        totalFees: parseFloat(effectiveFees.toFixed(2)),
        totalPayments: parseFloat(totalPayments.toFixed(2)),
        outstandingBalance: parseFloat(outstandingBalance.toFixed(2)),
        paymentCount: payments.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/payments/student/:studentId
// @desc    Get payment history for a student
// ============================================

router.get('/student/:studentId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER', 'PARENT'), async (req, res, next) => {
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

    const { academicYear, term } = req.query;

    const where = { studentId: req.params.studentId };
    if (academicYear) where.academicYear = parseInt(academicYear);
    if (term) where.term = parseInt(term);

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' }
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/payments
// @desc    Get all payments with filter and pagination
// @access  Private
// ============================================

router.get('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER', 'PARENT'), async (req, res, next) => {
  try {
    const {
      studentId,
      academicYear,
      term,
      status,
      paymentMethod,
      page = 1,
      limit = 20,
      sortBy = 'paymentDate',
      sortOrder = 'desc'
    } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };

    if (studentId) where.studentId = studentId;
    if (academicYear) where.academicYear = parseInt(academicYear);
    if (term) where.term = parseInt(term);
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    // Parents can only see their children's payments
    if (req.user.role === 'PARENT' && req.user.parentProfile) {
      const childIds = req.user.parentProfile.students.map(s => s.id);
      where.studentId = { in: childIds };
    }

    const total = await prisma.payment.count({ where });

    const payments = await prisma.payment.findMany({
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
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: payments,
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
// @route   GET /api/payments/:id
// @desc    Get single payment by ID
// @access  Private
// ============================================

router.get('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER', 'PARENT'), async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        student: {
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

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/payments
// @desc    Record a payment
// @access  Private (Admin, Principal, Finance Officer)
// ============================================

router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER'), [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('paymentMethod')
    .isIn(['CASH', 'EFT', 'CARD', 'MOBILE_MONEY', 'CHEQUE'])
    .withMessage('Invalid payment method'),
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
      studentId,
      amount,
      paymentMethod,
      referenceNumber,
      description,
      academicYear,
      term,
      paymentDate,
      status = 'COMPLETED'
    } = req.body;

    // Check student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check for duplicate reference number
    if (referenceNumber) {
      const existingPayment = await prisma.payment.findUnique({ where: { referenceNumber } });
      if (existingPayment) {
        return res.status(400).json({
          success: false,
          message: 'Payment with this reference number already exists'
        });
      }
    }

    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          studentId,
          institutionId: req.user.institutionId,
          amount: parseFloat(amount),
          paymentMethod,
          referenceNumber,
          description,
          academicYear: parseInt(academicYear),
          term: term ? parseInt(term) : null,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          status
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

      // Update student outstanding balance if payment is completed
      if (status === 'COMPLETED') {
        await tx.student.update({
          where: { id: studentId },
          data: {
            outstandingBalance: {
              decrement: parseFloat(amount)
            }
          }
        });
      }

      return newPayment;
    });

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/payments/:id
// @desc    Update payment
// @access  Private (Admin, Principal, Finance Officer)
// ============================================

router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER'), async (req, res, next) => {
  try {
    const existing = await prisma.payment.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const { description, status } = req.body;

    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { description, status }
    });

    res.json({
      success: true,
      data: payment,
      message: 'Payment updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   DELETE /api/payments/:id
// @desc    Delete payment
// @access  Private (Admin, Principal)
// ============================================

router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    await prisma.payment.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/payments/:id/refund
// @desc    Process refund
// @access  Private (Admin, Principal, Finance Officer)
// ============================================

router.post('/:id/refund', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER'), async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'REFUNDED') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been refunded'
      });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    const refundedPayment = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: req.params.id },
        data: { status: 'REFUNDED' }
      });

      // Restore student outstanding balance
      await tx.student.update({
        where: { id: payment.studentId },
        data: {
          outstandingBalance: {
            increment: parseFloat(payment.amount)
          }
        }
      });

      return updated;
    });

    res.json({
      success: true,
      data: refundedPayment,
      message: 'Payment refunded successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
