const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          institution: true,
          studentProfile: true,
          teacherProfile: true,
          parentProfile: {
            include: {
              students: true
            }
          }
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    next(error);
  }
};

// ============================================
// ROLE-BASED ACCESS CONTROL
// ============================================

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// ============================================
// INSTITUTION ACCESS CONTROL
// ============================================

exports.checkInstitutionAccess = async (req, res, next) => {
  try {
    const institutionId = req.params.institutionId || req.body.institutionId;

    // Super admins have access to all institutions
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Check if user belongs to the institution
    if (req.user.institutionId !== institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this institution'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ============================================
// STUDENT ACCESS CONTROL
// ============================================

exports.checkStudentAccess = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.body.studentId;

    // Admin roles have access to all students
    if (['SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'].includes(req.user.role)) {
      return next();
    }

    // Students can only access their own data
    if (req.user.role === 'STUDENT') {
      if (req.user.studentProfile?.id !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this student'
        });
      }
      return next();
    }

    // Parents can access their children's data
    if (req.user.role === 'PARENT') {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { parents: true }
      });

      const isParent = student?.parents.some(parent => parent.userId === req.user.id);
      
      if (!isParent) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this student'
        });
      }
      return next();
    }

    // Teachers can access students in their classes
    if (req.user.role === 'TEACHER') {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          class: {
            include: {
              classTeacher: true
            }
          }
        }
      });

      if (student?.class?.classTeacher?.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this student'
        });
      }
      return next();
    }

    res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

exports.getTokenFromUser = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

exports.sendTokenResponse = (user, statusCode, res) => {
  const token = exports.getTokenFromUser(user);

  // Remove password from output
  const { password, ...userWithoutPassword } = user;

  res.status(statusCode).json({
    success: true,
    token,
    user: userWithoutPassword
  });
};
