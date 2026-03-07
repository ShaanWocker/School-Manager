const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// ============================================
// @route   GET /api/assignments
// @desc    Get all assignments with filter and pagination
// @access  Private
// ============================================

router.get('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'), async (req, res, next) => {
  try {
    const {
      subjectId,
      grade,
      type,
      status,
      page = 1,
      limit = 20,
      sortBy = 'dueDate',
      sortOrder = 'asc'
    } = req.query;

    const where = {};

    if (subjectId) where.subjectId = subjectId;
    if (grade) where.grade = grade;
    if (type) where.type = type;
    if (status) where.status = status;

    const total = await prisma.assignment.count({ where });

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        subject: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        _count: { select: { submissions: true } }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: assignments,
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
// @route   GET /api/assignments/:id
// @desc    Get single assignment by ID
// @access  Private
// ============================================

router.get('/:id', protect, async (req, res, next) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: {
        subject: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        submissions: {
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
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/assignments
// @desc    Create new assignment
// @access  Private (Teacher, Principal)
// ============================================

router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('subjectId').notEmpty().withMessage('Subject ID is required'),
  body('grade').notEmpty().withMessage('Grade is required'),
  body('type')
    .isIn(['HOMEWORK', 'PROJECT', 'ESSAY', 'QUIZ', 'PRESENTATION'])
    .withMessage('Invalid assignment type'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('maxGrade').optional().isFloat({ min: 0 }).withMessage('Max grade must be a positive number'),
  body('submissionType').notEmpty().withMessage('Submission type is required'),
  body('groupSize')
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage('Group size must be between 2 and 10')
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
      title,
      description,
      instructions,
      subjectId,
      grade,
      type,
      dueDate,
      maxGrade = 100,
      submissionType,
      allowLateSubmission = false,
      isGroupAssignment = false,
      groupSize
    } = req.body;

    // Validate due date is in the future (allow same-day deadlines)
    if (new Date(dueDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Due date must be in the future'
      });
    }

    // Verify subject exists
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        instructions,
        subjectId,
        grade,
        type,
        dueDate: new Date(dueDate),
        maxGrade: parseFloat(maxGrade),
        submissionType,
        allowLateSubmission,
        isGroupAssignment,
        groupSize: isGroupAssignment && groupSize ? parseInt(groupSize) : null,
        createdById: req.user.id,
        status: 'Active'
      },
      include: {
        subject: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/assignments/:id
// @desc    Update assignment
// @access  Private (Teacher, Principal)
// ============================================

router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const existing = await prisma.assignment.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Teachers can only update their own assignments
    if (req.user.role === 'TEACHER' && existing.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this assignment'
      });
    }

    const {
      title,
      description,
      instructions,
      dueDate,
      maxGrade,
      allowLateSubmission,
      status
    } = req.body;

    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        instructions,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        maxGrade: maxGrade !== undefined ? parseFloat(maxGrade) : undefined,
        allowLateSubmission,
        status
      },
      include: {
        subject: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: assignment,
      message: 'Assignment updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   DELETE /api/assignments/:id
// @desc    Delete assignment
// @access  Private (Teacher own, Principal)
// ============================================

router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (req.user.role === 'TEACHER' && assignment.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this assignment'
      });
    }

    await prisma.assignment.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/assignments/:id/submissions
// @desc    Get all submissions for an assignment
// @access  Private (Teacher, Principal)
// ============================================

router.get('/:id/submissions', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: req.params.id },
      include: {
        student: {
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
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/assignments/:id/submit
// @desc    Student submits assignment
// @access  Private (Student)
// ============================================

router.post('/:id/submit', protect, authorize('STUDENT'), async (req, res, next) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (!req.user.studentProfile) {
      return res.status(400).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: req.params.id,
          studentId: req.user.studentProfile.id
        }
      }
    });

    if (existingSubmission && !assignment.allowLateSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment'
      });
    }

    // Check due date
    if (!assignment.allowLateSubmission && new Date() > assignment.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Assignment due date has passed'
      });
    }

    const { textContent, linkUrl, fileUrls = [] } = req.body;

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: req.params.id,
          studentId: req.user.studentProfile.id
        }
      },
      update: {
        textContent,
        linkUrl,
        fileUrls,
        submittedAt: new Date(),
        status: 'SUBMITTED'
      },
      create: {
        assignmentId: req.params.id,
        studentId: req.user.studentProfile.id,
        textContent,
        linkUrl,
        fileUrls,
        submittedAt: new Date(),
        status: 'SUBMITTED'
      },
      include: {
        assignment: true,
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
      data: submission,
      message: 'Assignment submitted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/assignments/submissions/:submissionId/grade
// @desc    Teacher grades a submission
// @access  Private (Teacher, Principal)
// ============================================

router.put('/submissions/:submissionId/grade', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), [
  body('grade').isFloat({ min: 0 }).withMessage('Grade must be a positive number'),
  body('feedback').optional().isString()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: req.params.submissionId },
      include: { assignment: true }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const { grade, feedback } = req.body;

    // Validate grade doesn't exceed max grade
    if (parseFloat(grade) > parseFloat(submission.assignment.maxGrade)) {
      return res.status(400).json({
        success: false,
        message: `Grade cannot exceed maximum grade of ${submission.assignment.maxGrade}`
      });
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id: req.params.submissionId },
      data: {
        grade: parseFloat(grade),
        feedback,
        gradedAt: new Date(),
        gradedById: req.user.id,
        status: 'GRADED'
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
        assignment: true
      }
    });

    res.json({
      success: true,
      data: updated,
      message: 'Submission graded successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
