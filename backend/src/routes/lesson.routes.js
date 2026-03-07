const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// ============================================
// @route   GET /api/lessons
// @desc    Get all lessons with filter and pagination
// @access  Private
// ============================================

router.get('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'), async (req, res, next) => {
  try {
    const {
      subjectId,
      grade,
      term,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where = {};

    if (subjectId) where.subjectId = subjectId;
    if (grade) where.grade = grade;
    if (term) where.term = parseInt(term);
    if (status) where.status = status;

    // Students only see published lessons
    if (req.user.role === 'STUDENT' || req.user.role === 'PARENT') {
      where.status = 'Published';
    }

    const total = await prisma.lesson.count({ where });

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        subject: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: lessons,
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
// @route   GET /api/lessons/:id
// @desc    Get single lesson by ID
// @access  Private
// ============================================

router.get('/:id', protect, async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({
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
        progress: {
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

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/lessons
// @desc    Create new lesson
// @access  Private (Teacher, Principal)
// ============================================

router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), [
  body('title').isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('subjectId').notEmpty().withMessage('Subject ID is required'),
  body('grade').notEmpty().withMessage('Grade is required'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer in minutes'),
  body('status').optional().isIn(['Draft', 'Published']).withMessage('Status must be Draft or Published'),
  body('pdfFiles').optional().isArray().withMessage('PDF files must be an array'),
  body('videoUrls').optional().isArray().withMessage('Video URLs must be an array'),
  body('presentationUrls').optional().isArray().withMessage('Presentation URLs must be an array'),
  body('externalLinks').optional().isArray().withMessage('External links must be an array')
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
      content,
      subjectId,
      grade,
      term,
      week,
      pdfFiles = [],
      videoUrls = [],
      presentationUrls = [],
      externalLinks = [],
      duration,
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

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        content,
        subjectId,
        grade,
        term: term ? parseInt(term) : null,
        week: week ? parseInt(week) : null,
        pdfFiles,
        videoUrls,
        presentationUrls,
        externalLinks,
        duration: duration ? parseInt(duration) : null,
        createdById: req.user.id,
        status,
        publishedAt: status === 'Published' ? new Date() : null
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
      data: lesson,
      message: 'Lesson created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/lessons/:id
// @desc    Update lesson
// @access  Private (Teacher own lessons, Principal)
// ============================================

router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const existing = await prisma.lesson.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Teachers can only update their own lessons
    if (req.user.role === 'TEACHER' && existing.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this lesson'
      });
    }

    const {
      title,
      description,
      content,
      grade,
      term,
      week,
      pdfFiles,
      videoUrls,
      presentationUrls,
      externalLinks,
      duration,
      status
    } = req.body;

    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        content,
        grade,
        term: term !== undefined ? parseInt(term) : undefined,
        week: week !== undefined ? parseInt(week) : undefined,
        pdfFiles,
        videoUrls,
        presentationUrls,
        externalLinks,
        duration: duration !== undefined ? parseInt(duration) : undefined,
        status,
        publishedAt: status === 'Published' && !existing.publishedAt ? new Date() : undefined
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
      data: lesson,
      message: 'Lesson updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   DELETE /api/lessons/:id
// @desc    Delete lesson (soft delete based on usage)
// @access  Private (Teacher own lessons, Principal)
// ============================================

router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { progress: true } }
      }
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Teachers can only delete their own lessons
    if (req.user.role === 'TEACHER' && lesson.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this lesson'
      });
    }

    // If lesson has student progress, soft delete by setting status to Draft
    if (lesson._count.progress > 0) {
      await prisma.lesson.update({
        where: { id: req.params.id },
        data: { status: 'Draft' }
      });
      return res.json({
        success: true,
        message: 'Lesson archived (has student progress)'
      });
    }

    await prisma.lesson.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/lessons/:id/publish
// @desc    Publish a lesson (Draft -> Published)
// @access  Private (Teacher own lessons, Principal)
// ============================================

router.put('/:id/publish', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id }
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Teachers can only publish their own lessons
    if (req.user.role === 'TEACHER' && lesson.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to publish this lesson'
      });
    }

    const updated = await prisma.lesson.update({
      where: { id: req.params.id },
      data: {
        status: 'Published',
        publishedAt: new Date()
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
      data: updated,
      message: 'Lesson published successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/lessons/:id/progress
// @desc    Get student progress for a lesson
// @access  Private
// ============================================

router.get('/:id/progress', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id }
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const progress = await prisma.lessonProgress.findMany({
      where: { lessonId: req.params.id },
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
      },
      orderBy: { lastViewedAt: 'desc' }
    });

    const stats = {
      totalStudents: progress.length,
      completed: progress.filter(p => p.completed).length,
      averageProgress: progress.length > 0
        ? Math.round(progress.reduce((sum, p) => sum + p.progress, 0) / progress.length)
        : 0
    };

    res.json({
      success: true,
      data: { progress, stats }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/lessons/:id/view
// @desc    Increment view count and update student progress
// @access  Private
// ============================================

router.post('/:id/view', protect, async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id }
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Increment view count
    await prisma.lesson.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } }
    });

    // Update student progress if viewer is a student
    if (req.user.role === 'STUDENT' && req.user.studentProfile) {
      const { progress = 0, completed = false } = req.body;

      await prisma.lessonProgress.upsert({
        where: {
          studentId_lessonId: {
            studentId: req.user.studentProfile.id,
            lessonId: req.params.id
          }
        },
        update: {
          progress: Math.min(100, parseInt(progress)),
          completed,
          lastViewedAt: new Date()
        },
        create: {
          studentId: req.user.studentProfile.id,
          lessonId: req.params.id,
          progress: Math.min(100, parseInt(progress)),
          completed,
          lastViewedAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      message: 'View recorded successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
