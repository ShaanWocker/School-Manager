const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// Helper: Calculate letter grade from percentage
const getLetterGrade = (percentage) => {
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

// ============================================
// @route   GET /api/grades/calculate/:studentId
// @desc    Calculate averages and GPA for student
// NOTE: Must be before /:id to avoid conflict
// ============================================

router.get('/calculate/:studentId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'), async (req, res, next) => {
  try {
    const { academicYear, term } = req.query;

    const where = { studentId: req.params.studentId };
    if (academicYear) where.academicYear = parseInt(academicYear);
    if (term) where.term = parseInt(term);

    const grades = await prisma.grade.findMany({
      where,
      include: { subject: true }
    });

    if (grades.length === 0) {
      return res.json({
        success: true,
        data: {
          overallAverage: 0,
          termAverage: 0,
          subjectAverages: [],
          gpa: 0,
          letterGrade: 'N/A',
          totalAssessments: 0
        }
      });
    }

    // Group by subject
    const subjectMap = {};
    grades.forEach(grade => {
      const subjectName = grade.subject.name;
      if (!subjectMap[subjectName]) {
        subjectMap[subjectName] = { totalPercent: 0, count: 0, grades: [] };
      }
      subjectMap[subjectName].totalPercent += parseFloat(grade.percentage);
      subjectMap[subjectName].count += 1;
      subjectMap[subjectName].grades.push(grade);
    });

    const subjectAverages = Object.entries(subjectMap).map(([subject, data]) => {
      const avg = data.totalPercent / data.count;
      return {
        subject,
        average: parseFloat(avg.toFixed(2)),
        letterGrade: getLetterGrade(avg),
        totalAssessments: data.count
      };
    });

    const overallPercentage = grades.reduce((sum, g) => sum + parseFloat(g.percentage), 0) / grades.length;
    const overallAverage = parseFloat(overallPercentage.toFixed(2));

    // Simple GPA calculation (4.0 scale)
    let gpa = 0;
    if (overallPercentage >= 80) gpa = 4.0;
    else if (overallPercentage >= 70) gpa = 3.0;
    else if (overallPercentage >= 60) gpa = 2.0;
    else if (overallPercentage >= 50) gpa = 1.0;

    res.json({
      success: true,
      data: {
        overallAverage,
        letterGrade: getLetterGrade(overallPercentage),
        gpa,
        subjectAverages,
        totalAssessments: grades.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/grades/student/:studentId
// @desc    Get all grades for a specific student
// ============================================

router.get('/student/:studentId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'), async (req, res, next) => {
  try {
    const { academicYear, term } = req.query;

    const where = { studentId: req.params.studentId };
    if (academicYear) where.academicYear = parseInt(academicYear);
    if (term) where.term = parseInt(term);

    const grades = await prisma.grade.findMany({
      where,
      include: { subject: true },
      orderBy: { recordedAt: 'desc' }
    });

    res.json({
      success: true,
      data: grades
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/grades/student/:studentId/subject/:subjectId
// @desc    Get subject-specific grades for student
// ============================================

router.get('/student/:studentId/subject/:subjectId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'), async (req, res, next) => {
  try {
    const { academicYear, term } = req.query;

    const where = {
      studentId: req.params.studentId,
      subjectId: req.params.subjectId
    };
    if (academicYear) where.academicYear = parseInt(academicYear);
    if (term) where.term = parseInt(term);

    const grades = await prisma.grade.findMany({
      where,
      include: { subject: true },
      orderBy: { recordedAt: 'desc' }
    });

    const average = grades.length > 0
      ? grades.reduce((sum, g) => sum + parseFloat(g.percentage), 0) / grades.length
      : 0;

    res.json({
      success: true,
      data: {
        grades,
        average: parseFloat(average.toFixed(2)),
        letterGrade: getLetterGrade(average)
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/grades/class/:classId/subject/:subjectId
// @desc    Get class performance for a subject
// ============================================

router.get('/class/:classId/subject/:subjectId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const { academicYear, term } = req.query;

    // Get students in the class
    const students = await prisma.student.findMany({
      where: { classId: req.params.classId },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    const studentIds = students.map(s => s.id);

    const where = {
      studentId: { in: studentIds },
      subjectId: req.params.subjectId
    };
    if (academicYear) where.academicYear = parseInt(academicYear);
    if (term) where.term = parseInt(term);

    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    // Group by student
    const studentPerformance = students.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const avgPercentage = studentGrades.length > 0
        ? studentGrades.reduce((sum, g) => sum + parseFloat(g.percentage), 0) / studentGrades.length
        : null;

      return {
        studentId: student.id,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        average: avgPercentage !== null ? parseFloat(avgPercentage.toFixed(2)) : null,
        letterGrade: avgPercentage !== null ? getLetterGrade(avgPercentage) : 'N/A',
        totalAssessments: studentGrades.length
      };
    });

    const classAverage = studentPerformance
      .filter(s => s.average !== null)
      .reduce((sum, s, _, arr) => sum + s.average / arr.length, 0);

    res.json({
      success: true,
      data: {
        classAverage: parseFloat(classAverage.toFixed(2)),
        studentPerformance,
        totalStudents: students.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/grades
// @desc    Get all grades with filter and pagination
// @access  Private
// ============================================

router.get('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'), async (req, res, next) => {
  try {
    const {
      studentId,
      subjectId,
      academicYear,
      term,
      page = 1,
      limit = 20,
      sortBy = 'recordedAt',
      sortOrder = 'desc'
    } = req.query;

    const where = {};

    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;
    if (academicYear) where.academicYear = parseInt(academicYear);
    if (term) where.term = parseInt(term);

    // Students can only view their own grades
    if (req.user.role === 'STUDENT' && req.user.studentProfile) {
      where.studentId = req.user.studentProfile.id;
    }

    const total = await prisma.grade.count({ where });

    const grades = await prisma.grade.findMany({
      where,
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
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: grades,
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
// @route   GET /api/grades/:id
// @desc    Get single grade by ID
// @access  Private
// ============================================

router.get('/:id', protect, async (req, res, next) => {
  try {
    const grade = await prisma.grade.findUnique({
      where: { id: req.params.id },
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
    });

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    res.json({
      success: true,
      data: grade
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/grades
// @desc    Record a grade
// @access  Private (Teacher, Principal)
// ============================================

router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('subjectId').notEmpty().withMessage('Subject ID is required'),
  body('academicYear').isInt({ min: 2000 }).withMessage('Valid academic year is required'),
  body('term').isInt({ min: 1, max: 4 }).withMessage('Term must be 1, 2, 3, or 4'),
  body('assessmentType').notEmpty().withMessage('Assessment type is required'),
  body('assessmentName').notEmpty().withMessage('Assessment name is required'),
  body('score').isFloat({ min: 0 }).withMessage('Score must be a positive number'),
  body('maxScore').isFloat({ min: 0 }).withMessage('Max score must be a positive number')
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
      subjectId,
      academicYear,
      term,
      assessmentType,
      assessmentName,
      score,
      maxScore,
      weight,
      remarks
    } = req.body;

    // Validate score <= maxScore
    if (parseFloat(score) > parseFloat(maxScore)) {
      return res.status(400).json({
        success: false,
        message: 'Score cannot exceed maximum score'
      });
    }

    const percentage = (parseFloat(score) / parseFloat(maxScore)) * 100;
    const letterGrade = getLetterGrade(percentage);

    const grade = await prisma.grade.create({
      data: {
        studentId,
        subjectId,
        academicYear: parseInt(academicYear),
        term: parseInt(term),
        assessmentType,
        assessmentName,
        score: parseFloat(score),
        maxScore: parseFloat(maxScore),
        percentage: parseFloat(percentage.toFixed(2)),
        letterGrade,
        weight: weight ? parseFloat(weight) : null,
        remarks
      },
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
    });

    res.status(201).json({
      success: true,
      data: grade,
      message: 'Grade recorded successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/grades/:id
// @desc    Update grade (Teacher within 7 days, Principal any time)
// @access  Private (Teacher, Principal)
// ============================================

router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const existing = await prisma.grade.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    // Teachers can only update within 7 days
    if (req.user.role === 'TEACHER') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (existing.recordedAt < sevenDaysAgo) {
        return res.status(403).json({
          success: false,
          message: 'Cannot update grade older than 7 days. Contact a Principal.'
        });
      }
    }

    const { score, maxScore, remarks } = req.body;

    let updateData = { remarks };

    if (score !== undefined && maxScore !== undefined) {
      if (parseFloat(score) > parseFloat(maxScore)) {
        return res.status(400).json({
          success: false,
          message: 'Score cannot exceed maximum score'
        });
      }
      const percentage = (parseFloat(score) / parseFloat(maxScore)) * 100;
      updateData = {
        ...updateData,
        score: parseFloat(score),
        maxScore: parseFloat(maxScore),
        percentage: parseFloat(percentage.toFixed(2)),
        letterGrade: getLetterGrade(percentage)
      };
    }

    const grade = await prisma.grade.update({
      where: { id: req.params.id },
      data: updateData,
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
    });

    res.json({
      success: true,
      data: grade,
      message: 'Grade updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   DELETE /api/grades/:id
// @desc    Delete grade (Principal only)
// @access  Private (Principal)
// ============================================

router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const grade = await prisma.grade.findUnique({
      where: { id: req.params.id }
    });

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    await prisma.grade.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Grade deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
