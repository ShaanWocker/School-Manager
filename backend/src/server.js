const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload
app.use(fileUpload({
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }, // 10MB default
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Static files (uploads)
app.use('/uploads', express.static('uploads'));

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/institutions', require('./routes/institution.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/teachers', require('./routes/teacher.routes'));
app.use('/api/classes', require('./routes/class.routes'));
app.use('/api/subjects', require('./routes/subject.routes'));
app.use('/api/lessons', require('./routes/lesson.routes'));
app.use('/api/assignments', require('./routes/assignment.routes'));
app.use('/api/exams', require('./routes/exam.routes'));
app.use('/api/discussions', require('./routes/discussion.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/grades', require('./routes/grade.routes'));
app.use('/api/fees', require('./routes/fee.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/timetables', require('./routes/timetable.routes'));
app.use('/api/library', require('./routes/library.routes'));
app.use('/api/transport', require('./routes/transport.routes'));
app.use('/api/announcements', require('./routes/announcement.routes'));
app.use('/api/sgb', require('./routes/sgb.routes'));
app.use('/api/reports', require('./routes/report.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║       🎓 EduManage SA Backend Server         ║
║                                               ║
║  Server running on port ${PORT}                  ║
║  Environment: ${process.env.NODE_ENV || 'development'}                   ║
║  Time: ${new Date().toLocaleString()}        ║
║                                               ║
╚═══════════════════════════════════════════════╝
  `);
});

module.exports = app;
