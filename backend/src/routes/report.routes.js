const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// GET /api/reports/overview
router.get('/overview', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;

    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      totalClasses,
      attendanceToday
    ] = await Promise.all([
      prisma.student.count({ where: { institutionId } }),
      prisma.student.count({ where: { institutionId, status: 'ACTIVE' } }),
      prisma.teacher.count({ where: { institutionId } }),
      prisma.class.count({ where: { institutionId } }),
      prisma.attendance.count({
        where: {
          institutionId,
          date: {
            gte: new Date(new Date().toISOString().split('T')[0]),
            lt: new Date(new Date().getTime() + 86400000)
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        inactiveStudents: totalStudents - activeStudents,
        totalTeachers,
        totalClasses,
        attendanceRecordsToday: attendanceToday
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/academic
router.get('/academic', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), async (req, res, next) => {
  try {
    const { academicYear, term, subjectId } = req.query;

    const where = {};
    if (academicYear) where.academicYear = parseInt(academicYear);
    if (term) where.term = parseInt(term);
    if (subjectId) where.subjectId = subjectId;

    const grades = await prisma.grade.findMany({
      where,
      include: {
        subject: true,
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    const totalGrades = grades.length;
    const averagePercentage = totalGrades > 0
      ? grades.reduce((sum, g) => sum + parseFloat(g.percentage), 0) / totalGrades
      : 0;

    const distribution = {
      A: grades.filter(g => g.letterGrade === 'A').length,
      B: grades.filter(g => g.letterGrade === 'B').length,
      C: grades.filter(g => g.letterGrade === 'C').length,
      D: grades.filter(g => g.letterGrade === 'D').length,
      F: grades.filter(g => g.letterGrade === 'F').length
    };

    res.json({
      success: true,
      data: {
        totalGrades,
        averagePercentage: parseFloat(averagePercentage.toFixed(2)),
        gradeDistribution: distribution
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/attendance
router.get('/attendance', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF', 'TEACHER'), async (req, res, next) => {
  try {
    const { classId, startDate, endDate } = req.query;

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

    const attendance = await prisma.attendance.groupBy({
      by: ['status'],
      where,
      _count: { status: true }
    });

    const summary = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
      SICK: 0
    };

    attendance.forEach(item => {
      summary[item.status] = item._count.status;
    });

    const total = Object.values(summary).reduce((sum, v) => sum + v, 0);
    const attendanceRate = total > 0
      ? parseFloat((((summary.PRESENT + summary.LATE) / total) * 100).toFixed(2))
      : 0;

    res.json({
      success: true,
      data: { summary, total, attendanceRate }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/financial
router.get('/financial', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER'), async (req, res, next) => {
  try {
    const { academicYear, term } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };
    if (academicYear) where.academicYear = parseInt(academicYear);
    if (term) where.term = parseInt(term);

    const payments = await prisma.payment.findMany({ where });

    const totalCollected = payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const totalRefunded = payments
      .filter(p => p.status === 'REFUNDED')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const byMethod = {};
    payments.filter(p => p.status === 'COMPLETED').forEach(p => {
      byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + parseFloat(p.amount);
    });

    const totalOutstanding = await prisma.student.aggregate({
      where: { institutionId: req.user.institutionId },
      _sum: { outstandingBalance: true }
    });

    res.json({
      success: true,
      data: {
        totalCollected: parseFloat(totalCollected.toFixed(2)),
        totalRefunded: parseFloat(totalRefunded.toFixed(2)),
        netCollected: parseFloat((totalCollected - totalRefunded).toFixed(2)),
        totalOutstanding: parseFloat((totalOutstanding._sum.outstandingBalance || 0).toFixed(2)),
        paymentsByMethod: byMethod,
        totalPayments: payments.length
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
