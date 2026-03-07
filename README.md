# 🎓 EduManage SA - Complete School Management System

A production-ready, full-stack school management system with integrated Learning Management System (LMS) for South African educational institutions.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### 🎯 Learning Management System (LMS)
- **Lessons**: Create, manage, and deliver lessons with PDFs, videos, presentations
- **Assignments**: File uploads, auto-graded quizzes, group projects
- **Mock Exams**: 5 question types (MCQ, True/False, Fill Blanks, Short Answer, Essay)
- **Discussions**: Forums, study groups, group projects, live Q&A
- **Lesson Planning**: Curriculum organization by terms and themes
- **Progress Tracking**: Visual analytics and performance monitoring

### 🏫 School Management
- **Student Information System (SIS)**: SASA-compliant student records
- **Teacher Management**: SACE registration tracking
- **Attendance Management**: QR codes, biometric integration
- **Timetable Management**: Clash detection, room allocation
- **Grade Management**: CAPS-aligned reporting
- **Fee Management**: SASA Section 39 compliant
- **Communications**: SMS/WhatsApp integration
- **SGB Portal**: Governance functions (SASA Sections 20 & 21)
- **Library Management**: Book cataloging, borrowing system
- **Transport Management**: Route planning, GPS tracking
- **Reports & Analytics**: DBE compliance, financial reports

### 🔐 Security & Access Control
- Role-based access control (RBAC) with 13+ roles
- JWT authentication
- Multi-tenancy support
- Data encryption
- Audit trails

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Express Validator
- **File Upload**: Express FileUpload

### Frontend
- **Framework**: React
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **Styling**: CSS-in-JS
- **Charts**: Recharts

### DevOps
- **Containerization**: Docker
- **Database Migrations**: Prisma Migrate
- **Environment**: dotenv

## 📁 Project Structure

```
fullstack-app/
├── backend/
│   ├── src/
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Custom middleware
│   │   ├── utils/            # Utility functions
│   │   └── server.js         # Express server
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.js           # Database seeder
│   ├── uploads/              # File uploads directory
│   ├── .env.example          # Environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── utils/            # Utility functions
│   │   └── App.jsx           # Main App component
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🚀 Installation

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn
- Docker (optional, for containerized deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/edumanage-sa.git
cd edumanage-sa
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

## 🗄️ Database Setup

### Option 1: Local PostgreSQL

1. **Install PostgreSQL** (if not already installed)

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
```

2. **Create Database**

```bash
sudo -u postgres psql
CREATE DATABASE edumanage_db;
CREATE USER edumanage WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE edumanage_db TO edumanage;
\q
```

3. **Run Migrations**

```bash
cd backend
npx prisma migrate dev
```

### Option 2: Docker PostgreSQL

```bash
docker run --name edumanage-postgres \
  -e POSTGRES_DB=edumanage_db \
  -e POSTGRES_USER=edumanage \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:14
```

## ⚙️ Environment Configuration

### Backend (.env)

Create `.env` file in `backend/` directory:

```env
# Database
DATABASE_URL="postgresql://edumanage:your_password@localhost:5432/edumanage_db?schema=public"

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Optional: Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: SMS Gateway
SMS_API_KEY=your-sms-api-key
SMS_API_URL=https://api.smsprovider.co.za/send
```

### Frontend (.env)

Create `.env` file in `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Prisma Studio**: http://localhost:5555 (run `npm run prisma:studio`)

### Production Mode

```bash
# Backend
cd backend
npm start

# Frontend (build first)
cd frontend
npm run build
# Serve with nginx or other web server
```

## 🐳 Docker Deployment

### Using Docker Compose

1. **Create docker-compose.yml** in project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: edumanage_db
      POSTGRES_USER: edumanage
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://edumanage:your_password@postgres:5432/edumanage_db
      JWT_SECRET: your-secret-key
      NODE_ENV: production
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

2. **Run:**

```bash
docker-compose up -d
```

## 📚 API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "TEACHER",
  "institutionId": "uuid"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Students

#### Get All Students
```http
GET /api/students?page=1&limit=20&search=john&grade=Grade%2010
Authorization: Bearer {token}
```

#### Create Student
```http
POST /api/students
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "student@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "idNumber": "0012345678901",
  "dateOfBirth": "2008-05-15",
  "gender": "Female",
  "currentGrade": "Grade 10",
  "admissionDate": "2024-01-15"
}
```

#### Update Student
```http
PUT /api/students/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentGrade": "Grade 11",
  "classId": "class-uuid"
}
```

#### Delete Student
```http
DELETE /api/students/{id}
Authorization: Bearer {token}
```

### Full API Documentation

For complete API documentation, see [API_DOCS.md](./API_DOCS.md)

## 🌍 Deployment to Production

### 1. Ubuntu Server Deployment

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y nodejs npm postgresql nginx

# Clone repository
git clone https://github.com/yourusername/edumanage-sa.git
cd edumanage-sa

# Setup backend
cd backend
npm install --production
npx prisma migrate deploy

# Setup frontend
cd ../frontend
npm install
npm run build

# Configure nginx
sudo cp nginx.conf /etc/nginx/sites-available/edumanage
sudo ln -s /etc/nginx/sites-available/edumanage /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# Setup PM2 for process management
sudo npm install -g pm2
pm2 start backend/src/server.js --name edumanage-backend
pm2 startup
pm2 save
```

### 2. Cloud Deployment (AWS, Azure, Google Cloud)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed cloud deployment guides.

## 🔒 Security Best Practices

- Change all default passwords
- Use strong JWT secrets
- Enable HTTPS in production
- Regular security updates
- Database backups
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- SQL injection protection (Prisma ORM)
- XSS protection

## 📝 Default Admin Account

After running the database seed:

**Email**: admin@edumanage.co.za
**Password**: Admin@123

⚠️ **IMPORTANT**: Change this password immediately after first login!

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@edumanage.co.za or join our Slack channel.

## 🙏 Acknowledgments

- South African Schools Act (SASA) compliance guidelines
- Department of Basic Education (DBE) standards
- SACE (South African Council for Educators)
- CAPS (Curriculum and Assessment Policy Statement)

---

Built with ❤️ for South African Education
