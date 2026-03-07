const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// ============================================
// @route   GET /api/exams
// @desc    Get all exams with filter and pagination
// @access  Private
// ============================================

router.get('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'), async (req, res, next) => {
  try {
    const {
      subjectId,
      grade,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where = {};

    if (subjectId) where.subjectId = subjectId;
    if (grade) where.grade = grade;
    if (status) where.status = status;

    // Students only see published exams
    if (req.user.role === 'STUDENT' || req.user.role === 'PARENT') {
      where.status = 'Published';
    }

    const total = await prisma.exam.count({ where });

    const exams = await prisma.exam.findMany({
      where,
      include: {
        subject: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: { questions: true, attempts: true }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: exams,
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
// @route   GET /api/exams/:id
// @desc    Get single exam by ID with questions and attempts
// @access  Private
// ============================================

router.get('/:id', protect, async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        subject: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        questions: {
          orderBy: { questionNumber: 'asc' }
        },
        attempts: {
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

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Students: hide correct answers if exam is in progress
    if (req.user.role === 'STUDENT') {
      exam.questions = exam.questions.map(q => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
    }

    res.json({
      success: true,
      data: exam
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/exams
// @desc    Create new exam
// @access  Private (Teacher, Principal)
// ============================================

router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('subjectId').notEmpty().withMessage('Subject ID is required'),
  body('grade').notEmpty().withMessage('Grade is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer in minutes'),
  body('totalMarks').isFloat({ min: 0 }).withMessage('Total marks must be a positive number'),
  body('passingMarks').isFloat({ min: 0 }).withMessage('Passing marks must be a positive number')
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
      subjectId,
      grade,
      duration,
      totalMarks = 100,
      passingMarks = 50,
      scheduledDate,
      status = 'Draft'
    } = req.body;

    // Verify subject exists
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Validate passing marks <= total marks
    if (parseFloat(passingMarks) > parseFloat(totalMarks)) {
      return res.status(400).json({
        success: false,
        message: 'Passing marks cannot exceed total marks'
      });
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        subjectId,
        grade,
        duration: parseInt(duration),
        totalMarks: parseFloat(totalMarks),
        passingMarks: parseFloat(passingMarks),
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        createdById: req.user.id,
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

    res.status(201).json({
      success: true,
      data: exam,
      message: 'Exam created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/exams/:id
// @desc    Update exam
// @access  Private (Teacher own, Principal)
// ============================================

router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const existing = await prisma.exam.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (req.user.role === 'TEACHER' && existing.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this exam'
      });
    }

    const {
      title,
      description,
      duration,
      totalMarks,
      passingMarks,
      scheduledDate,
      status
    } = req.body;

    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        duration: duration !== undefined ? parseInt(duration) : undefined,
        totalMarks: totalMarks !== undefined ? parseFloat(totalMarks) : undefined,
        passingMarks: passingMarks !== undefined ? parseFloat(passingMarks) : undefined,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
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
      data: exam,
      message: 'Exam updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   DELETE /api/exams/:id
// @desc    Delete exam
// @access  Private (Teacher own, Principal)
// ============================================

router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (req.user.role === 'TEACHER' && exam.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this exam'
      });
    }

    await prisma.exam.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/exams/:id/questions
// @desc    Add question to exam
// @access  Private (Teacher own exam, Principal)
// ============================================

router.post('/:id/questions', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), [
  body('questionNumber').isInt({ min: 1 }).withMessage('Question number must be a positive integer'),
  body('type')
    .isIn(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER', 'ESSAY'])
    .withMessage('Invalid question type'),
  body('question').notEmpty().withMessage('Question text is required'),
  body('marks').isFloat({ min: 0 }).withMessage('Marks must be a positive number')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (req.user.role === 'TEACHER' && exam.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add questions to this exam'
      });
    }

    const { questionNumber, type, question, options = [], correctAnswer, marks = 1 } = req.body;

    // Validate based on question type
    if (type === 'MULTIPLE_CHOICE' && options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Multiple choice questions must have at least 2 options'
      });
    }

    if (['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK'].includes(type) && !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: `Correct answer is required for ${type} questions`
      });
    }

    const examQuestion = await prisma.examQuestion.create({
      data: {
        examId: req.params.id,
        questionNumber: parseInt(questionNumber),
        type,
        question,
        options,
        correctAnswer,
        marks: parseFloat(marks)
      }
    });

    res.status(201).json({
      success: true,
      data: examQuestion,
      message: 'Question added successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/exams/questions/:questionId
// @desc    Update exam question
// @access  Private (Teacher, Principal)
// ============================================

router.put('/questions/:questionId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const question = await prisma.examQuestion.findUnique({
      where: { id: req.params.questionId },
      include: { exam: true }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (req.user.role === 'TEACHER' && question.exam.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this question'
      });
    }

    const { questionText, options, correctAnswer, marks } = req.body;

    const updated = await prisma.examQuestion.update({
      where: { id: req.params.questionId },
      data: {
        question: questionText,
        options,
        correctAnswer,
        marks: marks !== undefined ? parseFloat(marks) : undefined
      }
    });

    res.json({
      success: true,
      data: updated,
      message: 'Question updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   DELETE /api/exams/questions/:questionId
// @desc    Delete exam question
// @access  Private (Teacher, Principal)
// ============================================

router.delete('/questions/:questionId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const question = await prisma.examQuestion.findUnique({
      where: { id: req.params.questionId },
      include: { exam: true }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (req.user.role === 'TEACHER' && question.exam.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this question'
      });
    }

    await prisma.examQuestion.delete({
      where: { id: req.params.questionId }
    });

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/exams/:id/start
// @desc    Student starts exam
// @access  Private (Student)
// ============================================

router.post('/:id/start', protect, authorize('STUDENT'), async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (exam.status !== 'Published') {
      return res.status(400).json({
        success: false,
        message: 'Exam is not available'
      });
    }

    if (!req.user.studentProfile) {
      return res.status(400).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Check if already attempted
    const existingAttempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentId: {
          examId: req.params.id,
          studentId: req.user.studentProfile.id
        }
      }
    });

    if (existingAttempt) {
      return res.status(400).json({
        success: false,
        message: 'You have already started or completed this exam'
      });
    }

    const attempt = await prisma.examAttempt.create({
      data: {
        examId: req.params.id,
        studentId: req.user.studentProfile.id,
        startedAt: new Date(),
        answers: {},
        status: 'InProgress'
      }
    });

    // Return exam questions without correct answers
    const questionsForStudent = exam.questions.map(q => {
      const { correctAnswer, ...rest } = q;
      return rest;
    });

    res.status(201).json({
      success: true,
      data: {
        attempt,
        exam: { ...exam, questions: questionsForStudent }
      },
      message: 'Exam started successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/exams/:id/submit
// @desc    Student submits exam
// @access  Private (Student)
// ============================================

router.post('/:id/submit', protect, authorize('STUDENT'), async (req, res, next) => {
  try {
    if (!req.user.studentProfile) {
      return res.status(400).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const attempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentId: {
          examId: req.params.id,
          studentId: req.user.studentProfile.id
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'No active exam attempt found'
      });
    }

    if (attempt.status !== 'InProgress') {
      return res.status(400).json({
        success: false,
        message: 'Exam has already been submitted'
      });
    }

    const { answers } = req.body;

    // Get exam questions for auto-grading
    const questions = await prisma.examQuestion.findMany({
      where: { examId: req.params.id }
    });

    // Auto-grade eligible questions
    let autoGradedScore = 0;
    let autoGradedTotal = 0;
    let needsManualGrading = false;

    questions.forEach(q => {
      const studentAnswer = answers[q.id];
      if (['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK'].includes(q.type)) {
        autoGradedTotal += parseFloat(q.marks);
        if (studentAnswer !== undefined && studentAnswer !== null &&
            String(studentAnswer).toLowerCase() === String(q.correctAnswer).toLowerCase()) {
          autoGradedScore += parseFloat(q.marks);
        }
      } else {
        needsManualGrading = true;
      }
    });

    const updated = await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        answers: answers || {},
        submittedAt: new Date(),
        autoGradedScore,
        status: needsManualGrading ? 'Submitted' : 'Graded',
        totalScore: needsManualGrading ? null : autoGradedScore
      }
    });

    res.json({
      success: true,
      data: updated,
      message: needsManualGrading
        ? 'Exam submitted successfully. Awaiting manual grading for some questions.'
        : `Exam submitted and graded. Your score: ${autoGradedScore}`
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/exams/:id/grade/:attemptId
// @desc    Grade exam attempt (auto or manual)
// @access  Private (Teacher, Principal)
// ============================================

router.post('/:id/grade/:attemptId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: req.params.attemptId },
      include: {
        exam: {
          include: { questions: true }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found'
      });
    }

    const { manualGrades, feedback } = req.body;

    // Calculate manual graded score
    let manualGradedScore = 0;
    if (manualGrades && typeof manualGrades === 'object') {
      Object.values(manualGrades).forEach(score => {
        manualGradedScore += parseFloat(score) || 0;
      });
    }

    const autoGradedScore = parseFloat(attempt.autoGradedScore) || 0;
    const totalScore = autoGradedScore + manualGradedScore;

    const updated = await prisma.examAttempt.update({
      where: { id: req.params.attemptId },
      data: {
        manualGradedScore,
        totalScore,
        feedback,
        status: 'Graded'
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

    res.json({
      success: true,
      data: updated,
      message: 'Exam graded successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
