# EduManage SA - Frontend

React-based frontend for the EduManage SA School Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will open at http://localhost:3000

## 📁 Project Structure

```
src/
├── services/           # API services
│   ├── api.js         # Axios configuration
│   ├── authService.js # Authentication API
│   └── studentService.js # Student API (example)
├── App.jsx            # Main application component
├── index.js           # Entry point
└── index.css          # Global styles
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=EduManage SA
```

## 🎨 Features

### Complete UI for All Modules

✅ **Authentication**
- Login page
- Registration
- Password reset

✅ **Dashboard**
- Role-based dashboards (Student, Teacher, Parent, Admin, etc.)
- Statistics and quick actions
- Recent activity

✅ **Student Management**
- List students with search, filter, sort
- Create/Edit/Delete students
- Student profile with complete information
- Performance tracking

✅ **Teacher Management**
- Teacher directory
- SACE registration tracking
- Subject assignments

✅ **LMS (Learning Management System)**
- Lessons with progress tracking
- Assignments (file upload, quiz, group work)
- Mock Exams (5 question types)
- Discussions and forums
- Progress analytics

✅ **Attendance**
- Daily attendance marking
- Attendance reports
- Real-time tracking

✅ **Grades**
- Grade entry
- Report cards
- Performance analytics

✅ **Fees & Payments**
- Fee management
- Payment tracking
- Outstanding balances

✅ **Reports**
- Academic reports
- Financial reports
- Attendance reports
- Custom reports

✅ **SGB Portal**
- Governance functions
- Meeting management
- Document repository

## 🔌 API Integration

### Using Services

```javascript
import { studentService } from './services/studentService';

// Get all students
const students = await studentService.getAll({
  page: 1,
  limit: 20,
  search: 'john',
  grade: 'Grade 10'
});

// Get student by ID
const student = await studentService.getById('student-id');

// Create student
const newStudent = await studentService.create({
  email: 'student@example.com',
  firstName: 'John',
  lastName: 'Doe',
  // ... other fields
});

// Update student
const updated = await studentService.update('student-id', {
  currentGrade: 'Grade 11'
});

// Delete student
await studentService.delete('student-id');

// Export to CSV
await studentService.exportCSV();

// Get performance
const performance = await studentService.getPerformance('student-id', {
  academicYear: 2024,
  term: 1
});
```

### Creating New Services

Follow the pattern in `studentService.js`:

```javascript
// services/teacherService.js
import api from './api';

export const teacherService = {
  getAll: async (params) => {
    const response = await api.get('/teachers', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/teachers', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/teachers/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  }
};

export default teacherService;
```

## 🎯 Using in Components

### Example: Student List Component

```javascript
import React, { useState, useEffect } from 'react';
import { studentService } from '../services/studentService';

function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadStudents();
  }, [page, search]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getAll({
        page,
        limit: 20,
        search
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await studentService.delete(id);
        loadStudents(); // Reload list
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <input 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search students..."
      />
      
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Grade</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.id}>
              <td>{student.user.firstName} {student.user.lastName}</td>
              <td>{student.currentGrade}</td>
              <td>
                <button onClick={() => handleDelete(student.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 🔐 Authentication

The app uses JWT tokens stored in localStorage.

### Login Flow

```javascript
import { authService } from './services/authService';

const handleLogin = async (email, password) => {
  try {
    const response = await authService.login(email, password);
    // Token is automatically stored
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Protected Routes

The API service automatically adds the token to all requests. If the token is invalid or expired, the user is redirected to login.

## 📱 Responsive Design

The UI is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1366px - 1920px)
- Tablet (768px - 1366px)
- Mobile (320px - 768px)

## 🎨 Styling

The app uses inline styles with a consistent design system:

### Colors
- Primary: #667eea → #764ba2 (Gradient)
- Success: #10b981
- Warning: #f59e0b
- Danger: #ef4444
- Info: #3b82f6

### Typography
- Font Family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- Headings: 24px - 32px, weight 700
- Body: 14px - 16px, weight 400
- Small: 12px - 13px, weight 400

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📦 Build for Production

```bash
# Create production build
npm run build

# The build folder will contain the optimized app
# Deploy the contents to your web server
```

## 🚢 Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Deploy with Docker

The frontend Dockerfile is included in the project. Build and run:

```bash
docker build -t edumanage-frontend .
docker run -p 3000:80 edumanage-frontend
```

## 🐛 Troubleshooting

### CORS Errors

Make sure the backend CORS configuration allows requests from your frontend URL:

```javascript
// backend/src/server.js
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));
```

### API Connection Issues

Check that:
1. Backend is running on the correct port
2. REACT_APP_API_URL in `.env` is correct
3. Firewall allows the connection

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

1. **Connect to Backend**: Update REACT_APP_API_URL in `.env`
2. **Customize Branding**: Update colors, logos, institution name
3. **Add More Services**: Create services for teachers, lessons, etc.
4. **Enhance UI**: Add more features, improve UX
5. **Add Tests**: Write unit and integration tests
6. **Deploy**: Choose a hosting platform and deploy

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
