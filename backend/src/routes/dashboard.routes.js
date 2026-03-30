const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

const ADMIN_ROLES = ['SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'FINANCE_OFFICER'];

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary statistics
// @access  Private (admin roles only)
router.get(
  '/summary',
  protect,
  authorize(...ADMIN_ROLES),
  async (req, res) => {
    try {
      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
      const where = isSuperAdmin ? {} : { institutionId: req.user.institutionId };

      const [
        studentsCount,
        teachersCount,
        classesCount,
        subjectsCount,
        paymentsAgg,
        outstandingAgg,
        institutionsCount,
      ] = await Promise.all([
        prisma.student.count({ where }),
        prisma.teacher.count({ where }),
        prisma.class.count({ where }),
        prisma.subject.count({ where }),
        prisma.payment.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { amount: true },
        }),
        prisma.student.aggregate({
          where,
          _sum: { outstandingBalance: true },
        }),
        isSuperAdmin ? prisma.institution.count() : Promise.resolve(null),
      ]);

      const summary = {
        studentsCount,
        teachersCount,
        classesCount,
        subjectsCount,
        paymentsTotal: Number(paymentsAgg._sum.amount ?? 0),
        outstandingBalanceTotal: Number(outstandingAgg._sum.outstandingBalance ?? 0),
      };

      if (isSuperAdmin) {
        summary.institutionsCount = institutionsCount;
      }

      res.json({ success: true, data: summary });
    } catch (err) {
      console.error('Dashboard summary error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary' });
    }
  }
);

module.exports = router;
