const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// GET /api/transport
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = {
      institutionId: req.user.institutionId
    };

    if (status) where.status = status;

    const total = await prisma.transportRoute.count({ where });

    const routes = await prisma.transportRoute.findMany({
      where,
      include: {
        _count: { select: { assignments: true } }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: routes,
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

// GET /api/transport/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const route = await prisma.transportRoute.findUnique({
      where: { id: req.params.id },
      include: {
        assignments: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true } }
              }
            }
          }
        }
      }
    });

    if (!route) {
      return res.status(404).json({ success: false, message: 'Transport route not found' });
    }

    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
});

// POST /api/transport
router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TRANSPORT_MANAGER'), [
  body('routeNumber').notEmpty().withMessage('Route number is required'),
  body('routeName').notEmpty().withMessage('Route name is required'),
  body('startPoint').notEmpty().withMessage('Start point is required'),
  body('endPoint').notEmpty().withMessage('End point is required'),
  body('monthlyCost').isFloat({ min: 0 }).withMessage('Monthly cost must be a positive number')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { routeNumber, routeName, startPoint, endPoint, stops, distance, estimatedTime, vehicleNumber, driverName, driverPhone, capacity, monthlyCost } = req.body;

    const route = await prisma.transportRoute.create({
      data: {
        institutionId: req.user.institutionId,
        routeNumber,
        routeName,
        startPoint,
        endPoint,
        stops: stops || [],
        distance: distance ? parseFloat(distance) : null,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
        vehicleNumber,
        driverName,
        driverPhone,
        capacity: capacity ? parseInt(capacity) : 40,
        monthlyCost: parseFloat(monthlyCost)
      }
    });

    res.status(201).json({ success: true, data: route, message: 'Transport route created successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/transport/:id
router.put('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TRANSPORT_MANAGER'), async (req, res, next) => {
  try {
    const existing = await prisma.transportRoute.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transport route not found' });
    }

    const { routeName, stops, vehicleNumber, driverName, driverPhone, status, monthlyCost } = req.body;

    const route = await prisma.transportRoute.update({
      where: { id: req.params.id },
      data: {
        routeName,
        stops,
        vehicleNumber,
        driverName,
        driverPhone,
        status,
        monthlyCost: monthlyCost !== undefined ? parseFloat(monthlyCost) : undefined
      }
    });

    res.json({ success: true, data: route, message: 'Transport route updated successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/transport/:id/assign
router.post('/:id/assign', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TRANSPORT_MANAGER'), [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('pickupStop').notEmpty().withMessage('Pickup stop is required'),
  body('dropoffStop').notEmpty().withMessage('Drop-off stop is required'),
  body('startDate').isISO8601().withMessage('Start date is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { studentId, pickupStop, dropoffStop, startDate, endDate } = req.body;

    const assignment = await prisma.transportAssignment.create({
      data: {
        routeId: req.params.id,
        studentId,
        pickupStop,
        dropoffStop,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null
      },
      include: {
        route: true,
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    res.status(201).json({ success: true, data: assignment, message: 'Student assigned to route' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/transport/:id
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    const existing = await prisma.transportRoute.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transport route not found' });
    }

    await prisma.transportRoute.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Transport route deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
