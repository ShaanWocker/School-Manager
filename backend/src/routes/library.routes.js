const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// GET /api/library
router.get('/', protect, async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };

    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } }
      ];
    }

    const total = await prisma.libraryBook.count({ where });

    const books = await prisma.libraryBook.findMany({
      where,
      orderBy: { title: 'asc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: books,
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

// GET /api/library/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const book = await prisma.libraryBook.findUnique({
      where: { id: req.params.id },
      include: {
        borrows: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true } }
              }
            }
          },
          orderBy: { borrowDate: 'desc' }
        }
      }
    });

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
});

// POST /api/library
router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'LIBRARIAN'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('author').notEmpty().withMessage('Author is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('totalCopies').optional().isInt({ min: 1 }).withMessage('Total copies must be positive')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { isbn, title, author, publisher, publicationYear, category, subject, totalCopies = 1, location } = req.body;

    const book = await prisma.libraryBook.create({
      data: {
        institutionId: req.user.institutionId,
        isbn,
        title,
        author,
        publisher,
        publicationYear: publicationYear ? parseInt(publicationYear) : null,
        category,
        subject,
        totalCopies: parseInt(totalCopies),
        availableCopies: parseInt(totalCopies),
        location
      }
    });

    res.status(201).json({ success: true, data: book, message: 'Book added successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/library/:id/borrow
router.post('/:id/borrow', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'LIBRARIAN'), [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('dueDate').isISO8601().withMessage('Due date is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const book = await prisma.libraryBook.findUnique({ where: { id: req.params.id } });

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (book.availableCopies < 1) {
      return res.status(400).json({ success: false, message: 'No copies available' });
    }

    const { studentId, dueDate } = req.body;

    const borrow = await prisma.$transaction(async (tx) => {
      const newBorrow = await tx.libraryBorrow.create({
        data: {
          bookId: req.params.id,
          studentId,
          dueDate: new Date(dueDate)
        },
        include: {
          book: true,
          student: {
            include: { user: { select: { firstName: true, lastName: true } } }
          }
        }
      });

      await tx.libraryBook.update({
        where: { id: req.params.id },
        data: { availableCopies: { decrement: 1 } }
      });

      return newBorrow;
    });

    res.status(201).json({ success: true, data: borrow, message: 'Book borrowed successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/library/borrows/:borrowId/return
router.post('/borrows/:borrowId/return', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'LIBRARIAN'), async (req, res, next) => {
  try {
    const borrow = await prisma.libraryBorrow.findUnique({ where: { id: req.params.borrowId } });

    if (!borrow) {
      return res.status(404).json({ success: false, message: 'Borrow record not found' });
    }

    if (borrow.status === 'RETURNED') {
      return res.status(400).json({ success: false, message: 'Book already returned' });
    }

    const returned = await prisma.$transaction(async (tx) => {
      const updated = await tx.libraryBorrow.update({
        where: { id: req.params.borrowId },
        data: { returnDate: new Date(), status: 'RETURNED' }
      });

      await tx.libraryBook.update({
        where: { id: borrow.bookId },
        data: { availableCopies: { increment: 1 } }
      });

      return updated;
    });

    res.json({ success: true, data: returned, message: 'Book returned successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/library/:id
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'LIBRARIAN'), async (req, res, next) => {
  try {
    const existing = await prisma.libraryBook.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    await prisma.libraryBook.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
