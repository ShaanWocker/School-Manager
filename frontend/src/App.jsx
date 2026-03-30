import React, { useState, useEffect } from 'react';
import authService from './services/authService';
import dashboardService from './services/dashboardService';
import SettingsView from './components/SettingsView';
import StudentsView from './components/StudentsView';
import AttendanceView from './components/AttendanceView';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Users, BookOpen, Calendar, DollarSign, FileText, Settings, Bell, Menu, X, ChevronDown, Search, Plus, Upload, Edit, Trash2, Eye, Clock, CheckCircle, AlertCircle, TrendingUp, Award, GraduationCap, Building, UserCheck, MessageSquare, FileSpreadsheet, Library, Bus, Home, Video, Link, File, Send, Check, Play, ClipboardList, Target, Star, MessageCircle, Filter, Calendar as CalendarIcon, CheckSquare, AlertTriangle } from 'lucide-react';

// Mock Data
const mockLessons = [
  { id: 1, title: 'Introduction to Algebra', subject: 'Mathematics', grade: 'Grade 10', theme: 'Equations & Inequalities', status: 'published', materials: 5, views: 245 },
  { id: 2, title: 'Photosynthesis Process', subject: 'Life Sciences', grade: 'Grade 11', theme: 'Plant Biology', status: 'published', materials: 8, views: 189 },
  { id: 3, title: 'World War II Analysis', subject: 'History', grade: 'Grade 12', theme: '20th Century Conflicts', status: 'draft', materials: 3, views: 0 },
];

const mockAssignments = [
  { id: 1, title: 'Quadratic Equations Worksheet', subject: 'Mathematics', dueDate: '2026-03-15', status: 'active', submissions: 28, totalStudents: 35, type: 'homework' },
  { id: 2, title: 'Cell Structure Essay', subject: 'Life Sciences', dueDate: '2026-03-20', status: 'active', submissions: 31, totalStudents: 35, type: 'assignment' },
  { id: 3, title: 'Mock Exam: Trigonometry', subject: 'Mathematics', dueDate: '2026-03-18', status: 'active', submissions: 22, totalStudents: 35, type: 'exam' },
];

const mockStudentAssignments = [
  { id: 1, title: 'Quadratic Equations Worksheet', subject: 'Mathematics', dueDate: '2026-03-15', status: 'submitted', grade: 85, maxGrade: 100 },
  { id: 2, title: 'Cell Structure Essay', subject: 'Life Sciences', dueDate: '2026-03-20', status: 'pending', grade: null, maxGrade: 100 },
  { id: 3, title: 'Mock Exam: Trigonometry', subject: 'Mathematics', dueDate: '2026-03-18', status: 'overdue', grade: null, maxGrade: 100 },
  { id: 4, title: 'Shakespeare Analysis', subject: 'English', dueDate: '2026-03-10', status: 'graded', grade: 92, maxGrade: 100 },
];

const mockStudentLessons = [
  { id: 1, title: 'Introduction to Algebra', subject: 'Mathematics', progress: 100, completed: true, duration: '45 min' },
  { id: 2, title: 'Photosynthesis Process', subject: 'Life Sciences', progress: 60, completed: false, duration: '38 min' },
  { id: 3, title: 'Chemical Bonding', subject: 'Physical Sciences', progress: 30, completed: false, duration: '42 min' },
  { id: 4, title: 'Poetry Analysis', subject: 'English', progress: 100, completed: true, duration: '35 min' },
];

// Normalise a backend user object so the rest of the UI (which uses lowercase
// role strings and a flat "name" field) works without further changes.
const normaliseUser = (user) => ({
  ...user,
  name: user.name || `${user.firstName} ${user.lastName}`,
  role: (user.role || '').toLowerCase(),
});

// Main App Component
export default function SchoolManagementSystem() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Bootstrap session from a stored token on mount
  useEffect(() => {
    const bootstrap = async () => {
      if (authService.isAuthenticated()) {
        try {
          const data = await authService.getCurrentUser();
          const user = data.data || data;
          setCurrentUser(normaliseUser(user));
        } catch (err) {
          console.error('Session validation failed:', err);
          authService.logout();
        }
      }
      setAuthLoading(false);
    };
    bootstrap();
  }, []);

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '20px',
        fontWeight: 600
      }}>
        Loading…
      </div>
    );
  }

  // If not logged in, show real login form
  if (!currentUser) {
    return (
      <LoginScreen onLogin={(user) => {
        setCurrentUser(normaliseUser(user));
      }} />
    );
  }

  // Role-based module access with LMS additions
  const getModulesForRole = (role) => {
    const allModules = {
      dashboard: { name: 'Dashboard', icon: Home, access: ['super_admin', 'principal', 'teacher', 'parent', 'student', 'finance_officer', 'sgb_member'] },
      // LMS Modules
      lessons: { name: 'Lessons', icon: BookOpen, access: ['teacher', 'student', 'parent', 'principal'] },
      assignments: { name: 'Assignments', icon: ClipboardList, access: ['teacher', 'student', 'parent', 'principal'] },
      exams: { name: 'Mock Exams', icon: FileText, access: ['teacher', 'student', 'parent', 'principal'] },
      planning: { name: 'Lesson Planning', icon: Calendar, access: ['teacher', 'principal'] },
      progress: { name: 'Progress', icon: Target, access: ['student', 'parent', 'teacher', 'principal'] },
      discussions: { name: 'Discussions', icon: MessageCircle, access: ['teacher', 'student', 'principal'] },
      // Original Modules
      students: { name: 'Students', icon: Users, access: ['super_admin', 'principal', 'teacher', 'admin_staff'] },
      teachers: { name: 'Teachers', icon: GraduationCap, access: ['super_admin', 'principal', 'admin_staff'] },
      attendance: { name: 'Attendance', icon: UserCheck, access: ['super_admin', 'principal', 'teacher', 'admin_staff'] },
      timetable: { name: 'Timetable', icon: CalendarIcon, access: ['super_admin', 'principal', 'teacher', 'student', 'parent'] },
      grades: { name: 'Grades', icon: Award, access: ['super_admin', 'principal', 'teacher', 'student', 'parent'] },
      fees: { name: 'Fees', icon: DollarSign, access: ['super_admin', 'principal', 'finance_officer', 'parent', 'sgb_member'] },
      communications: { name: 'Communications', icon: MessageSquare, access: ['super_admin', 'principal', 'teacher', 'parent', 'student', 'sgb_member'] },
      library: { name: 'Library', icon: Library, access: ['super_admin', 'principal', 'teacher', 'student', 'librarian'] },
      reports: { name: 'Reports', icon: FileSpreadsheet, access: ['super_admin', 'principal', 'finance_officer', 'sgb_member'] },
      sgb: { name: 'SGB Portal', icon: Building, access: ['super_admin', 'principal', 'sgb_member'] },
      transport: { name: 'Transport', icon: Bus, access: ['super_admin', 'principal', 'admin_staff', 'parent', 'student'] },
      settings: { name: 'Settings', icon: Settings, access: ['super_admin', 'principal', 'admin_staff'] }
    };

    return Object.entries(allModules)
      .filter(([_, module]) => module.access.includes(role))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  };

  const availableModules = getModulesForRole(currentUser.role);

  return (
    <div className="app-container">
      {/* Global Styles */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden;
        }

        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          position: relative;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 280px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          z-index: 1000;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
        }

        .sidebar.closed {
          transform: translateX(-100%);
        }

        .sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid rgba(102, 126, 234, 0.1);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .logo {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .logo-text {
          flex: 1;
        }

        .logo-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
          line-height: 1.2;
        }

        .logo-subtitle {
          font-size: 11px;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 2px;
        }

        .institution-selector {
          background: white;
          border: 2px solid rgba(102, 126, 234, 0.2);
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .institution-selector:hover {
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
        }

        .institution-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
        }

        .institution-info {
          flex: 1;
          min-width: 0;
        }

        .institution-name {
          font-size: 13px;
          font-weight: 600;
          color: #1a202c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .institution-type {
          font-size: 11px;
          color: #718096;
        }

        .nav-menu {
          flex: 1;
          padding: 16px 12px;
        }

        .nav-section {
          margin-bottom: 24px;
        }

        .nav-section-title {
          font-size: 11px;
          font-weight: 700;
          color: #a0aec0;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 0 16px 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          margin-bottom: 4px;
          border-radius: 10px;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 500;
        }

        .nav-item:hover {
          background: rgba(102, 126, 234, 0.05);
          color: #667eea;
        }

        .nav-item.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .nav-item svg {
          width: 20px;
          height: 20px;
        }

        .user-profile {
          padding: 16px 20px;
          border-top: 1px solid rgba(102, 126, 234, 0.1);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a202c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 12px;
          color: #718096;
          text-transform: capitalize;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 280px;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .main-content.full {
          margin-left: 0;
        }

        .top-bar {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 20px 32px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .menu-toggle {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: white;
          border: 2px solid rgba(102, 126, 234, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .menu-toggle:hover {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }

        .search-bar {
          flex: 1;
          max-width: 500px;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 2px solid rgba(102, 126, 234, 0.2);
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #a0aec0;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-button {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: white;
          border: 2px solid rgba(102, 126, 234, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .icon-button:hover {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: white;
          border: 2px solid white;
        }

        .logout-button {
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .content-area {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-title {
          font-size: 32px;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .page-subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
        }

        /* Dashboard Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
          animation: slideUp 0.5s ease-out;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .stat-icon.blue {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .stat-icon.green {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .stat-icon.orange {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .stat-icon.red {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .stat-icon.purple {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .stat-trend.up {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .stat-trend.down {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .stat-label {
          font-size: 14px;
          color: #718096;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #1a202c;
          line-height: 1;
        }

        .chart-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          margin-bottom: 24px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .chart-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
        }

        .chart-actions {
          display: flex;
          gap: 8px;
        }

        .action-button {
          padding: 8px 16px;
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .action-button:hover {
          background: rgba(102, 126, 234, 0.2);
        }

        .action-button.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .action-button.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        /* Tables */
        .data-table {
          width: 100%;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .table-header {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid rgba(102, 126, 234, 0.1);
        }

        .table-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 16px 24px;
          font-size: 13px;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: rgba(102, 126, 234, 0.02);
        }

        td {
          padding: 16px 24px;
          font-size: 14px;
          color: #4a5568;
          border-top: 1px solid rgba(102, 126, 234, 0.05);
        }

        tr:hover td {
          background: rgba(102, 126, 234, 0.02);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge.success {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .badge.warning {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .badge.danger {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .badge.info {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .badge.purple {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .table-actions {
          display: flex;
          gap: 8px;
        }

        .table-action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .table-action-btn.view {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .table-action-btn.edit {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .table-action-btn.delete {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .table-action-btn:hover {
          transform: scale(1.1);
        }

        /* LMS-specific styles */
        .lesson-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
          cursor: pointer;
          margin-bottom: 20px;
        }

        .lesson-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .lesson-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 16px;
        }

        .lesson-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 4px;
        }

        .lesson-meta {
          display: flex;
          gap: 12px;
          font-size: 13px;
          color: #718096;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 12px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
        }

        .assignment-status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
        }

        .assignment-status-indicator.submitted {
          background: #10b981;
        }

        .assignment-status-indicator.pending {
          background: #f59e0b;
        }

        .assignment-status-indicator.overdue {
          background: #ef4444;
        }

        .assignment-status-indicator.graded {
          background: #667eea;
        }

        .grade-display {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
        }

        .grade-display.excellent {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .grade-display.good {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .grade-display.average {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .grade-display.poor {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .content-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 2px solid rgba(102, 126, 234, 0.1);
          padding-bottom: 8px;
        }

        .tab-button {
          padding: 10px 20px;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #718096;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-button:hover {
          background: rgba(102, 126, 234, 0.05);
          color: #667eea;
        }

        .tab-button.active {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          padding: 32px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease-out;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 700;
          color: #1a202c;
        }

        .modal-close {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(102, 126, 234, 0.1);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(102, 126, 234, 0.2);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 8px;
        }

        .form-input, .form-textarea, .form-select {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid rgba(102, 126, 234, 0.2);
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }

        .form-input:focus, .form-textarea:focus, .form-select:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .main-content {
            margin-left: 0;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .content-area {
            padding: 16px;
          }

          .page-title {
            font-size: 24px;
          }
        }

        /* Notification Panel */
        .notification-panel {
          position: fixed;
          right: 20px;
          top: 80px;
          width: 360px;
          max-height: 500px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          overflow: hidden;
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notification-header {
          padding: 20px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          border-bottom: 2px solid rgba(102, 126, 234, 0.1);
        }

        .notification-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a202c;
        }

        .notification-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(102, 126, 234, 0.05);
          cursor: pointer;
          transition: all 0.2s;
        }

        .notification-item:hover {
          background: rgba(102, 126, 234, 0.02);
        }

        .notification-item.unread {
          background: rgba(102, 126, 234, 0.05);
        }

        .notification-content {
          font-size: 14px;
          color: #4a5568;
          margin-bottom: 4px;
        }

        .notification-time {
          font-size: 12px;
          color: #a0aec0;
        }
      `}</style>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo">🎓</div>
            <div className="logo-text">
              <div className="logo-title">EduManage SA</div>
              <div className="logo-subtitle">Learning & Management</div>
            </div>
          </div>
          
          {currentUser.institution && (
            <div className="institution-selector">
              <div className="institution-icon">
                <Building size={16} />
              </div>
              <div className="institution-info">
                <div className="institution-name">{currentUser.institution.name}</div>
                <div className="institution-type">{currentUser.institution.type}</div>
              </div>
              <ChevronDown size={16} />
            </div>
          )}
        </div>

        <div className="nav-menu">
          {/* LMS Section */}
          {(currentUser.role === 'student' || currentUser.role === 'parent' || currentUser.role === 'teacher') && (
            <div className="nav-section">
              <div className="nav-section-title">Learning</div>
              {['dashboard', 'lessons', 'assignments', 'exams', 'progress', 'discussions', 'planning'].map(key => {
                if (!availableModules[key]) return null;
                const module = availableModules[key];
                const Icon = module.icon;
                return (
                  <div
                    key={key}
                    className={`nav-item ${activeModule === key ? 'active' : ''}`}
                    onClick={() => setActiveModule(key)}
                  >
                    <Icon size={20} />
                    <span>{module.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Administration Section */}
          <div className="nav-section">
            <div className="nav-section-title">
              {currentUser.role === 'student' || currentUser.role === 'parent' ? 'School' : 'Administration'}
            </div>
            {Object.entries(availableModules).filter(([key]) => !['lessons', 'assignments', 'exams', 'planning', 'progress', 'discussions', 'dashboard'].includes(key)).map(([key, module]) => {
              const Icon = module.icon;
              return (
                <div
                  key={key}
                  className={`nav-item ${activeModule === key ? 'active' : ''}`}
                  onClick={() => setActiveModule(key)}
                >
                  <Icon size={20} />
                  <span>{module.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="user-profile" onClick={() => setActiveModule('settings')} style={{ cursor: 'pointer' }}>
          <div className="user-avatar">{currentUser.avatar}</div>
          <div className="user-info">
            <div className="user-name">{currentUser.name}</div>
            <div className="user-role">{currentUser.role.replace('_', ' ')}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? '' : 'full'}`}>
        <div className="top-bar">
          <div className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </div>

          <div className="search-bar">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder={
                currentUser.role === 'student' ? "Search lessons, assignments..." :
                currentUser.role === 'parent' ? "Search child's activities..." :
                "Search students, teachers, courses..."
              }
              className="search-input"
            />
          </div>

          <div className="top-actions">
            <div className="icon-button" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={18} />
              <span className="notification-badge">5</span>
            </div>
            <button className="logout-button" onClick={() => {
              authService.logout();
              setCurrentUser(null);
            }}>
              Logout
            </button>
          </div>
        </div>

        <div className="content-area">
          {activeModule === 'dashboard' && <DashboardView role={currentUser.role} user={currentUser} institution={currentUser.institution} />}
          {activeModule === 'lessons' && <LessonsView role={currentUser.role} />}
          {activeModule === 'assignments' && <AssignmentsView role={currentUser.role} />}
          {activeModule === 'exams' && <ExamsView role={currentUser.role} />}
          {activeModule === 'planning' && <LessonPlanningView />}
          {activeModule === 'progress' && <ProgressView role={currentUser.role} user={currentUser} />}
          {activeModule === 'discussions' && <DiscussionsView role={currentUser.role} />}
          {activeModule === 'students' && <StudentsView />}
          {activeModule === 'teachers' && <TeachersView />}
          {activeModule === 'attendance' && <AttendanceView />}
          {activeModule === 'timetable' && <TimetableView />}
          {activeModule === 'grades' && <GradesView />}
          {activeModule === 'fees' && <FeesView />}
          {activeModule === 'communications' && <CommunicationsView />}
          {activeModule === 'library' && <LibraryView />}
          {activeModule === 'reports' && <ReportsView />}
          {activeModule === 'sgb' && <SGBView />}
          {activeModule === 'transport' && <TransportView />}
          {activeModule === 'settings' && <SettingsView currentUser={currentUser} setCurrentUser={setCurrentUser} />}
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="notification-panel">
          <div className="notification-header">
            <div className="notification-title">Notifications</div>
          </div>
          <div className="notification-list">
            {currentUser.role === 'student' ? (
              <>
                <div className="notification-item unread">
                  <div className="notification-content">New assignment posted: Quadratic Equations</div>
                  <div className="notification-time">5 minutes ago</div>
                </div>
                <div className="notification-item unread">
                  <div className="notification-content">Your essay has been graded: 92/100</div>
                  <div className="notification-time">1 hour ago</div>
                </div>
                <div className="notification-item">
                  <div className="notification-content">Mock exam tomorrow: Trigonometry</div>
                  <div className="notification-time">2 hours ago</div>
                </div>
              </>
            ) : currentUser.role === 'parent' ? (
              <>
                <div className="notification-item unread">
                  <div className="notification-content">Mike submitted assignment: Cell Structure Essay</div>
                  <div className="notification-time">30 minutes ago</div>
                </div>
                <div className="notification-item unread">
                  <div className="notification-content">New grade posted: Mathematics - 85%</div>
                  <div className="notification-time">2 hours ago</div>
                </div>
                <div className="notification-item">
                  <div className="notification-content">Parent-teacher meeting scheduled for March 20</div>
                  <div className="notification-time">Yesterday</div>
                </div>
              </>
            ) : (
              <>
                <div className="notification-item unread">
                  <div className="notification-content">28 students submitted homework</div>
                  <div className="notification-time">10 minutes ago</div>
                </div>
                <div className="notification-item unread">
                  <div className="notification-content">Grade 12 exam results ready for review</div>
                  <div className="notification-time">1 hour ago</div>
                </div>
                <div className="notification-item">
                  <div className="notification-content">Department meeting tomorrow at 2PM</div>
                  <div className="notification-time">3 hours ago</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Login Screen Component – real email + password form
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      const user = data.user || data;
      onLogin(user);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '48px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            margin: '0 auto 20px'
          }}>
            🎓
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
            Welcome to EduManage SA
          </h1>
          <p style={{ color: '#718096', fontSize: '14px' }}>
            Learning Management &amp; School Administration
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              marginBottom: '16px',
              padding: '12px 16px',
              background: '#fff5f5',
              border: '1px solid #feb2b2',
              borderRadius: '8px',
              color: '#c53030',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid rgba(102, 126, 234, 0.2)',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid rgba(102, 126, 234, 0.2)',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#a0aec0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Dashboard View Component (Enhanced for different roles)
function DashboardView({ role, user, institution }) {
  if (role === 'student') {
    return <StudentDashboard user={user} />;
  } else if (role === 'parent') {
    return <ParentDashboard user={user} />;
  } else if (role === 'teacher') {
    return <TeacherDashboard user={user} institution={institution} />;
  } else {
    return <AdminDashboard institution={institution} />;
  }
}

// Student Dashboard
function StudentDashboard({ user }) {
  const upcomingAssignments = mockStudentAssignments.filter(a => a.status === 'pending' || a.status === 'overdue');
  const recentGrades = mockStudentAssignments.filter(a => a.status === 'graded').slice(0, 3);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">Here's your learning progress and upcoming tasks</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">
              <BookOpen size={24} />
            </div>
          </div>
          <div className="stat-label">Lessons Completed</div>
          <div className="stat-value">12/18</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '67%' }}></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="stat-label">Assignments Submitted</div>
          <div className="stat-value">8/10</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '80%' }}></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orange">
              <AlertCircle size={24} />
            </div>
          </div>
          <div className="stat-label">Pending Tasks</div>
          <div className="stat-value">{upcomingAssignments.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple">
              <Award size={24} />
            </div>
          </div>
          <div className="stat-label">Average Grade</div>
          <div className="stat-value">87%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Upcoming Assignments</h3>
            <button className="action-button">View All</button>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            {upcomingAssignments.map(assignment => (
              <div key={assignment.id} style={{
                padding: '16px',
                background: 'rgba(102, 126, 234, 0.02)',
                borderRadius: '12px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{assignment.title}</div>
                  <div style={{ fontSize: '13px', color: '#718096' }}>
                    {assignment.subject} • Due: {assignment.dueDate}
                  </div>
                </div>
                <span className={`badge ${assignment.status === 'overdue' ? 'danger' : 'warning'}`}>
                  {assignment.status === 'overdue' ? 'Overdue' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Recent Grades</h3>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            {recentGrades.map(assignment => (
              <div key={assignment.id} style={{
                padding: '16px',
                background: 'rgba(102, 126, 234, 0.02)',
                borderRadius: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{assignment.subject}</div>
                  <div className={`grade-display ${assignment.grade >= 90 ? 'excellent' : assignment.grade >= 75 ? 'good' : 'average'}`}>
                    {assignment.grade}%
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#718096' }}>{assignment.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Continue Learning</h3>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {mockStudentLessons.filter(l => !l.completed).slice(0, 3).map(lesson => (
              <div key={lesson.id} style={{
                padding: '20px',
                background: 'rgba(102, 126, 234, 0.02)',
                borderRadius: '12px',
                border: '2px solid rgba(102, 126, 234, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.1)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Play size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{lesson.title}</div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>{lesson.subject}</div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${lesson.progress}%` }}></div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#718096' }}>
                  {lesson.progress}% complete • {lesson.duration}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Parent Dashboard
function ParentDashboard({ user }) {
  const child = user.children[0]; // Assuming first child for demo

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome, {user.name.split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">Track {child.name}'s academic progress and activities</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">
              <Award size={24} />
            </div>
            <div className="stat-trend up">
              <TrendingUp size={14} />
              +5%
            </div>
          </div>
          <div className="stat-label">Overall Average</div>
          <div className="stat-value">87%</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="stat-label">Assignments Completed</div>
          <div className="stat-value">8/10</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orange">
              <UserCheck size={24} />
            </div>
          </div>
          <div className="stat-label">Attendance Rate</div>
          <div className="stat-value">96%</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple">
              <MessageSquare size={24} />
            </div>
          </div>
          <div className="stat-label">Unread Messages</div>
          <div className="stat-value">3</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Recent Grades</h3>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            {mockStudentAssignments.filter(a => a.status === 'graded').map(assignment => (
              <div key={assignment.id} style={{
                padding: '16px',
                background: 'rgba(102, 126, 234, 0.02)',
                borderRadius: '12px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{assignment.subject}</div>
                  <div style={{ fontSize: '13px', color: '#718096' }}>{assignment.title}</div>
                </div>
                <div className={`grade-display ${assignment.grade >= 90 ? 'excellent' : assignment.grade >= 75 ? 'good' : 'average'}`}>
                  {assignment.grade}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Pending Assignments</h3>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            {mockStudentAssignments.filter(a => a.status === 'pending' || a.status === 'overdue').map(assignment => (
              <div key={assignment.id} style={{
                padding: '16px',
                background: 'rgba(102, 126, 234, 0.02)',
                borderRadius: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 600 }}>{assignment.title}</div>
                  <span className={`badge ${assignment.status === 'overdue' ? 'danger' : 'warning'}`}>
                    {assignment.status === 'overdue' ? 'Overdue' : 'Pending'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#718096' }}>
                  {assignment.subject} • Due: {assignment.dueDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Subject Performance</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={[
            { subject: 'Mathematics', score: 85 },
            { subject: 'Life Sciences', score: 88 },
            { subject: 'English', score: 92 },
            { subject: 'Physical Sciences', score: 82 },
            { subject: 'History', score: 87 }
          ]}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" stroke="#718096" />
            <PolarRadiusAxis stroke="#718096" />
            <Radar name="Performance" dataKey="score" stroke="#667eea" fill="#667eea" fillOpacity={0.3} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Teacher Dashboard
function TeacherDashboard({ user, institution }) {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user.name.split(' ')[1]}! 👨‍🏫</h1>
        <p className="page-subtitle">Manage your classes and track student progress</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">
              <Users size={24} />
            </div>
          </div>
          <div className="stat-label">Total Students</div>
          <div className="stat-value">145</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green">
              <BookOpen size={24} />
            </div>
          </div>
          <div className="stat-label">Active Lessons</div>
          <div className="stat-value">12</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orange">
              <ClipboardList size={24} />
            </div>
          </div>
          <div className="stat-label">Pending Grading</div>
          <div className="stat-value">28</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple">
              <Target size={24} />
            </div>
          </div>
          <div className="stat-label">Class Average</div>
          <div className="stat-value">84%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Recent Lessons</h3>
            <button className="action-button primary">
              <Plus size={14} />
              Create Lesson
            </button>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            {mockLessons.slice(0, 3).map(lesson => (
              <div key={lesson.id} style={{
                padding: '16px',
                background: 'rgba(102, 126, 234, 0.02)',
                borderRadius: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600 }}>{lesson.title}</div>
                  <span className={`badge ${lesson.status === 'published' ? 'success' : 'warning'}`}>
                    {lesson.status}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#718096' }}>
                  {lesson.subject} • {lesson.grade} • {lesson.views} views
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Quick Actions</h3>
          </div>
          <div style={{ padding: '0 24px 24px', display: 'grid', gap: '12px' }}>
            <button className="action-button primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={14} />
              Create Assignment
            </button>
            <button className="action-button" style={{ width: '100%', justifyContent: 'center' }}>
              <FileText size={14} />
              Create Mock Exam
            </button>
            <button className="action-button" style={{ width: '100%', justifyContent: 'center' }}>
              <Calendar size={14} />
              Plan Lesson
            </button>
            <button className="action-button" style={{ width: '100%', justifyContent: 'center' }}>
              <Award size={14} />
              Grade Submissions
            </button>
          </div>
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">
          <h3 className="table-title">Assignment Submissions</h3>
          <button className="action-button">View All</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Subject</th>
              <th>Due Date</th>
              <th>Submissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockAssignments.map(assignment => (
              <tr key={assignment.id}>
                <td style={{ fontWeight: 600 }}>{assignment.title}</td>
                <td>{assignment.subject}</td>
                <td>{assignment.dueDate}</td>
                <td>
                  <span style={{ fontWeight: 600 }}>{assignment.submissions}</span>/{assignment.totalStudents}
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    {Math.round((assignment.submissions / assignment.totalStudents) * 100)}% submitted
                  </div>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="table-action-btn view"><Eye size={16} /></button>
                    <button className="table-action-btn edit"><Edit size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Admin Dashboard – fetches real stats from /api/dashboard/summary
function AdminDashboard({ institution }) {
  const [summary, setSummary] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState('');

  useEffect(() => {
    dashboardService.getSummary()
      .then((data) => {
        setSummary(data.data || data);
        setDashLoading(false);
      })
      .catch((err) => {
        setDashError(err.response?.data?.message || 'Failed to load dashboard data.');
        setDashLoading(false);
      });
  }, []);

  const fmtNum = (n) => (n == null ? '—' : n.toLocaleString());
  const fmtCurrency = (n) => (n == null ? '—' : `R${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome back! Here's what's happening at {institution?.name || 'your institution'}
        </p>
      </div>

      {dashError && (
        <div style={{ padding: '16px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', color: '#c53030', marginBottom: '24px' }}>
          {dashError}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">
              <Users size={24} />
            </div>
          </div>
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{dashLoading ? '…' : fmtNum(summary?.studentsCount)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green">
              <GraduationCap size={24} />
            </div>
          </div>
          <div className="stat-label">Teaching Staff</div>
          <div className="stat-value">{dashLoading ? '…' : fmtNum(summary?.teachersCount)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orange">
              <BookOpen size={24} />
            </div>
          </div>
          <div className="stat-label">Classes</div>
          <div className="stat-value">{dashLoading ? '…' : fmtNum(summary?.classesCount)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon red">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="stat-label">Revenue (completed payments)</div>
          <div className="stat-value">{dashLoading ? '…' : fmtCurrency(summary?.paymentsTotal)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orange">
              <AlertCircle size={24} />
            </div>
          </div>
          <div className="stat-label">Outstanding Balance</div>
          <div className="stat-value">{dashLoading ? '…' : fmtCurrency(summary?.outstandingBalanceTotal)}</div>
        </div>

        {summary?.institutionsCount !== undefined && (
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon blue">
                <Building size={24} />
              </div>
            </div>
            <div className="stat-label">Institutions</div>
            <div className="stat-value">{fmtNum(summary.institutionsCount)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// LMS Views (NEW)

// Lessons View
function LessonsView({ role }) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (role === 'student') {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">My Lessons</h1>
          <p className="page-subtitle">Access your learning materials and track progress</p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div className="content-tabs">
            <button className="tab-button active">All Lessons</button>
            <button className="tab-button">In Progress</button>
            <button className="tab-button">Completed</button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {mockStudentLessons.map(lesson => (
            <div key={lesson.id} className="lesson-card">
              <div className="lesson-header">
                <div>
                  <div className="lesson-title">{lesson.title}</div>
                  <div className="lesson-meta">
                    <span>{lesson.subject}</span>
                    <span>•</span>
                    <span>{lesson.duration}</span>
                  </div>
                </div>
                <div>
                  {lesson.completed ? (
                    <span className="badge success">Completed</span>
                  ) : (
                    <button className="action-button primary">
                      <Play size={14} />
                      Continue
                    </button>
                  )}
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${lesson.progress}%` }}></div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#718096' }}>
                {lesson.progress}% complete
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Teacher view
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Lesson Library</h1>
        <p className="page-subtitle">Create and manage your lesson content</p>
      </div>

      <div className="data-table">
        <div className="table-header">
          <h3 className="table-title">Your Lessons</h3>
          <button className="action-button primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} />
            Create Lesson
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Lesson Title</th>
              <th>Subject</th>
              <th>Grade</th>
              <th>Theme</th>
              <th>Materials</th>
              <th>Views</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockLessons.map(lesson => (
              <tr key={lesson.id}>
                <td style={{ fontWeight: 600 }}>{lesson.title}</td>
                <td>{lesson.subject}</td>
                <td>{lesson.grade}</td>
                <td>{lesson.theme}</td>
                <td>{lesson.materials}</td>
                <td>{lesson.views}</td>
                <td>
                  <span className={`badge ${lesson.status === 'published' ? 'success' : 'warning'}`}>
                    {lesson.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="table-action-btn view"><Eye size={16} /></button>
                    <button className="table-action-btn edit"><Edit size={16} /></button>
                    <button className="table-action-btn delete"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateLessonModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

// Create Lesson Modal
function CreateLessonModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Lesson</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form>
          <div className="form-group">
            <label className="form-label">Lesson Title</label>
            <input type="text" className="form-input" placeholder="Enter lesson title" />
          </div>

          <div className="form-group">
            <label className="form-label">Subject</label>
            <select className="form-select">
              <option>Mathematics</option>
              <option>Life Sciences</option>
              <option>Physical Sciences</option>
              <option>English</option>
              <option>History</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Grade</label>
            <select className="form-select">
              <option>Grade 8</option>
              <option>Grade 9</option>
              <option>Grade 10</option>
              <option>Grade 11</option>
              <option>Grade 12</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Theme/Unit</label>
            <input type="text" className="form-input" placeholder="E.g., Algebra, Photosynthesis" />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Describe what students will learn"></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Learning Materials</label>
            <div style={{ display: 'grid', gap: '12px' }}>
              <button type="button" className="action-button" style={{ width: '100%', justifyContent: 'center' }}>
                <File size={14} />
                Upload PDF Document
              </button>
              <button type="button" className="action-button" style={{ width: '100%', justifyContent: 'center' }}>
                <Video size={14} />
                Add Video
              </button>
              <button type="button" className="action-button" style={{ width: '100%', justifyContent: 'center' }}>
                <Link size={14} />
                Add External Resource
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="action-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-button primary">
              <Plus size={14} />
              Create Lesson
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Assignments View - Enhanced with quiz submissions and group work
function AssignmentsView({ role }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  if (role === 'student') {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">My Assignments</h1>
          <p className="page-subtitle">View and submit your assignments</p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div className="content-tabs">
            <button className="tab-button active">All</button>
            <button className="tab-button">Pending</button>
            <button className="tab-button">Submitted</button>
            <button className="tab-button">Graded</button>
            <button className="tab-button">Group Work</button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {mockStudentAssignments.map(assignment => (
            <div key={assignment.id} className="lesson-card">
              <div className="lesson-header">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <div className={`assignment-status-indicator ${assignment.status}`}></div>
                    <div className="lesson-title">{assignment.title}</div>
                  </div>
                  <div className="lesson-meta">
                    <span>{assignment.subject}</span>
                    <span>•</span>
                    <span>Due: {assignment.dueDate}</span>
                    <span>•</span>
                    <span>{assignment.type === 'quiz' ? 'Auto-graded Quiz' : 'File Upload'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {assignment.grade !== null && (
                    <div className={`grade-display ${assignment.grade >= 90 ? 'excellent' : assignment.grade >= 75 ? 'good' : 'average'}`}>
                      {assignment.grade}/{assignment.maxGrade}
                    </div>
                  )}
                  {assignment.status === 'pending' && (
                    <button className="action-button primary" onClick={() => setShowSubmitModal(true)}>
                      <Upload size={14} />
                      Submit
                    </button>
                  )}
                  {assignment.status === 'submitted' && (
                    <span className="badge info">Awaiting Grade</span>
                  )}
                  {assignment.status === 'overdue' && (
                    <button className="action-button" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                      <AlertTriangle size={14} />
                      Submit Late
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Group Assignment Example */}
          <div className="lesson-card" style={{ border: '2px solid rgba(139, 92, 246, 0.2)' }}>
            <div style={{
              background: 'rgba(139, 92, 246, 0.05)',
              padding: '8px 12px',
              borderRadius: '8px 8px 0 0',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Users size={16} style={{ color: '#8b5cf6' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6' }}>Group Assignment</span>
            </div>
            <div className="lesson-header">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div className="assignment-status-indicator pending"></div>
                  <div className="lesson-title">Shakespeare Essay Analysis</div>
                </div>
                <div className="lesson-meta">
                  <span>English</span>
                  <span>•</span>
                  <span>Due: March 25, 2026</span>
                  <span>•</span>
                  <span>4 members</span>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '4px' }}>
                  {['👨‍🎓', '👩‍🎓', '🎓', '📚'].map((emoji, idx) => (
                    <div key={idx} style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }}>
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <button className="action-button primary">
                  <MessageCircle size={14} />
                  Open Workspace
                </button>
              </div>
            </div>
            <div className="progress-bar" style={{ marginTop: '16px' }}>
              <div className="progress-fill" style={{ width: '65%', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}></div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#718096' }}>
              65% complete • 3/4 members contributed
            </div>
          </div>
        </div>

        {showSubmitModal && (
          <SubmitAssignmentModal onClose={() => setShowSubmitModal(false)} />
        )}
      </div>
    );
  }

  // Teacher view
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Assignment Management</h1>
        <p className="page-subtitle">Create assignments and track student submissions</p>
      </div>

      <div className="data-table">
        <div className="table-header">
          <h3 className="table-title">Active Assignments</h3>
          <button className="action-button primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} />
            Create Assignment
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Subject</th>
              <th>Type</th>
              <th>Due Date</th>
              <th>Submissions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockAssignments.map(assignment => (
              <tr key={assignment.id}>
                <td style={{ fontWeight: 600 }}>{assignment.title}</td>
                <td>{assignment.subject}</td>
                <td>
                  <span className={`badge ${assignment.type === 'exam' ? 'success' : 'purple'}`}>
                    {assignment.type}
                  </span>
                </td>
                <td>{assignment.dueDate}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '100px', 
                      height: '6px', 
                      background: 'rgba(102, 126, 234, 0.1)', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(assignment.submissions / assignment.totalStudents) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}></div>
                    </div>
                    <span style={{ fontSize: '13px', color: '#718096' }}>
                      {assignment.submissions}/{assignment.totalStudents}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="badge success">{assignment.status}</span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="table-action-btn view"><Eye size={16} /></button>
                    <button className="table-action-btn edit"><Edit size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            <tr>
              <td style={{ fontWeight: 600 }}>Shakespeare Essay - Group Project</td>
              <td>English</td>
              <td>
                <span className="badge purple" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                  <Users size={12} />
                  Group
                </span>
              </td>
              <td>2026-03-25</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '6px', 
                    background: 'rgba(139, 92, 246, 0.1)', 
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '65%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '13px', color: '#718096' }}>
                    7/9 groups
                  </span>
                </div>
              </td>
              <td>
                <span className="badge warning">In Progress</span>
              </td>
              <td>
                <div className="table-actions">
                  <button className="table-action-btn view"><Eye size={16} /></button>
                  <button className="table-action-btn edit"><Edit size={16} /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateAssignmentModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

// Submit Assignment Modal
function SubmitAssignmentModal({ onClose }) {
  const [submissionType, setSubmissionType] = useState('file');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Submit Assignment</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
            Quadratic Equations Worksheet
          </div>
          <div style={{ fontSize: '13px', color: '#718096' }}>
            Mathematics • Due: March 15, 2026
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Submission Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div
              onClick={() => setSubmissionType('file')}
              style={{
                padding: '16px',
                border: `2px solid ${submissionType === 'file' ? '#667eea' : 'rgba(102, 126, 234, 0.2)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                background: submissionType === 'file' ? 'rgba(102, 126, 234, 0.05)' : 'white',
                textAlign: 'center'
              }}
            >
              <File size={24} style={{ margin: '0 auto 8px', color: '#667eea' }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>File Upload</div>
              <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                PDF, Word, Images
              </div>
            </div>
            <div
              onClick={() => setSubmissionType('quiz')}
              style={{
                padding: '16px',
                border: `2px solid ${submissionType === 'quiz' ? '#667eea' : 'rgba(102, 126, 234, 0.2)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                background: submissionType === 'quiz' ? 'rgba(102, 126, 234, 0.05)' : 'white',
                textAlign: 'center'
              }}
            >
              <CheckSquare size={24} style={{ margin: '0 auto 8px', color: '#667eea' }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Take Quiz</div>
              <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                Auto-graded
              </div>
            </div>
          </div>
        </div>

        {submissionType === 'file' && (
          <>
            <div className="form-group">
              <label className="form-label">Upload Files</label>
              <div style={{
                border: '2px dashed rgba(102, 126, 234, 0.3)',
                borderRadius: '10px',
                padding: '32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.02)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Upload size={32} style={{ margin: '0 auto 12px', color: '#667eea' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  Click to upload or drag and drop
                </div>
                <div style={{ fontSize: '12px', color: '#718096' }}>
                  PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Comments (Optional)</label>
              <textarea className="form-textarea" placeholder="Add any notes for your teacher..." rows={4}></textarea>
            </div>
          </>
        )}

        {submissionType === 'quiz' && (
          <div style={{
            padding: '20px',
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <CheckSquare size={48} style={{ margin: '0 auto 16px', color: '#667eea' }} />
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              Ready to start the quiz?
            </div>
            <div style={{ fontSize: '13px', color: '#718096', marginBottom: '16px' }}>
              15 questions • 30 minutes • Auto-graded
            </div>
            <button className="action-button primary" style={{ margin: '0 auto' }}>
              <Play size={14} />
              Start Quiz
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button type="button" className="action-button" onClick={onClose}>
            Cancel
          </button>
          {submissionType === 'file' && (
            <button type="submit" className="action-button primary">
              <Send size={14} />
              Submit Assignment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Create Assignment Modal - Enhanced
function CreateAssignmentModal({ onClose }) {
  const [assignmentType, setAssignmentType] = useState('individual');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Assignment</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form>
          <div className="form-group">
            <label className="form-label">Assignment Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                onClick={() => setAssignmentType('individual')}
                style={{
                  padding: '16px',
                  border: `2px solid ${assignmentType === 'individual' ? '#667eea' : 'rgba(102, 126, 234, 0.2)'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: assignmentType === 'individual' ? 'rgba(102, 126, 234, 0.05)' : 'white',
                  textAlign: 'center'
                }}
              >
                <ClipboardList size={24} style={{ margin: '0 auto 8px', color: '#667eea' }} />
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Individual</div>
              </div>
              <div
                onClick={() => setAssignmentType('group')}
                style={{
                  padding: '16px',
                  border: `2px solid ${assignmentType === 'group' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.2)'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: assignmentType === 'group' ? 'rgba(139, 92, 246, 0.05)' : 'white',
                  textAlign: 'center'
                }}
              >
                <Users size={24} style={{ margin: '0 auto 8px', color: '#8b5cf6' }} />
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Group Project</div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assignment Title</label>
            <input type="text" className="form-input" placeholder="Enter assignment title" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-select">
                <option>Mathematics</option>
                <option>Life Sciences</option>
                <option>Physical Sciences</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Grade</label>
              <select className="form-select">
                <option>Grade 10</option>
                <option>Grade 11</option>
                <option>Grade 12</option>
              </select>
            </div>
          </div>

          {assignmentType === 'group' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Group Size</label>
                <input type="number" className="form-input" placeholder="4" min="2" max="10" />
              </div>

              <div className="form-group">
                <label className="form-label">Formation Method</label>
                <select className="form-select">
                  <option>Teacher Assigned</option>
                  <option>Student Choice</option>
                  <option>Random</option>
                </select>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Instructions</label>
            <textarea className="form-textarea" placeholder="Provide detailed instructions for students"></textarea>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Maximum Grade</label>
              <input type="number" className="form-input" placeholder="100" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Submission Type</label>
            <select className="form-select">
              <option>File Upload (PDF, Word, Images)</option>
              <option>Quiz/Test (Auto-graded)</option>
              <option>Link Submission</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="action-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-button primary">
              <Plus size={14} />
              Create Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Exams View - Enhanced with all question types
function ExamsView({ role }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  if (role === 'student') {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Mock Exams & Tests</h1>
          <p className="page-subtitle">Practice exams to prepare for assessments</p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div className="content-tabs">
            <button className="tab-button active">Available</button>
            <button className="tab-button">Completed</button>
            <button className="tab-button">Upcoming</button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="lesson-card" onClick={() => setShowQuizModal(true)}>
            <div className="lesson-header">
              <div>
                <div className="lesson-title">📝 Trigonometry Mock Exam</div>
                <div className="lesson-meta">
                  <span>Mathematics</span>
                  <span>•</span>
                  <span>25 Questions</span>
                  <span>•</span>
                  <span>60 minutes</span>
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#718096' }}>
                  Topics: Sine, Cosine, Tangent, Identities, Problem Solving
                </div>
              </div>
              <button className="action-button primary">
                <Play size={14} />
                Start Exam
              </button>
            </div>
          </div>

          <div className="lesson-card">
            <div className="lesson-header">
              <div>
                <div className="lesson-title">🧬 Cell Biology Quiz</div>
                <div className="lesson-meta">
                  <span>Life Sciences</span>
                  <span>•</span>
                  <span>15 Questions</span>
                  <span>•</span>
                  <span>30 minutes</span>
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#718096' }}>
                  Topics: Cell Structure, Organelles, Cell Division, Photosynthesis
                </div>
              </div>
              <button className="action-button primary">
                <Play size={14} />
                Start Quiz
              </button>
            </div>
          </div>

          <div className="lesson-card" style={{ opacity: 0.7 }}>
            <div className="lesson-header">
              <div>
                <div className="lesson-title">📚 Shakespeare Analysis Test</div>
                <div className="lesson-meta">
                  <span>English</span>
                  <span>•</span>
                  <span>20 Questions</span>
                  <span>•</span>
                  <span>Available: March 20, 2026</span>
                </div>
              </div>
              <span className="badge warning">Coming Soon</span>
            </div>
          </div>
        </div>

        {showQuizModal && (
          <QuizTakingModal onClose={() => setShowQuizModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mock Exam Builder</h1>
        <p className="page-subtitle">Create practice exams and tests with auto-grading</p>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Question Types Available</h3>
          <button className="action-button primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} />
            Create Mock Exam
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '14px', color: '#718096', marginBottom: '20px' }}>
            Create comprehensive mock exams with multiple question types. Multiple choice, True/False, and Fill in the blanks are auto-graded.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {[
              { type: 'Multiple Choice', icon: '📋', autoGrade: true, description: 'Select one correct answer' },
              { type: 'True/False', icon: '✓✗', autoGrade: true, description: 'Binary choice questions' },
              { type: 'Fill in the Blanks', icon: '✏️', autoGrade: true, description: 'Complete the sentence' },
              { type: 'Short Answer', icon: '✍️', autoGrade: false, description: 'Brief written responses' },
              { type: 'Essay', icon: '📝', autoGrade: false, description: 'Extended written answers' }
            ].map((item) => (
              <div key={item.type} style={{
                padding: '20px',
                background: 'rgba(102, 126, 234, 0.02)',
                borderRadius: '12px',
                border: '2px solid rgba(102, 126, 234, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.1)'}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px', textAlign: 'center' }}>{item.icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px', textAlign: 'center' }}>
                  {item.type}
                </div>
                <div style={{ fontSize: '12px', color: '#718096', textAlign: 'center', marginBottom: '8px' }}>
                  {item.description}
                </div>
                {item.autoGrade && (
                  <div style={{ textAlign: 'center' }}>
                    <span className="badge success" style={{ fontSize: '11px' }}>
                      <CheckCircle size={12} style={{ marginRight: '4px' }} />
                      Auto-graded
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="data-table" style={{ marginTop: '24px' }}>
        <div className="table-header">
          <h3 className="table-title">Your Mock Exams</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Exam Title</th>
              <th>Subject</th>
              <th>Questions</th>
              <th>Duration</th>
              <th>Attempts</th>
              <th>Avg Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600 }}>Trigonometry Mock Exam</td>
              <td>Mathematics</td>
              <td>25</td>
              <td>60 min</td>
              <td>22/35</td>
              <td>78%</td>
              <td>
                <div className="table-actions">
                  <button className="table-action-btn view"><Eye size={16} /></button>
                  <button className="table-action-btn edit"><Edit size={16} /></button>
                </div>
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Cell Biology Quiz</td>
              <td>Life Sciences</td>
              <td>15</td>
              <td>30 min</td>
              <td>28/35</td>
              <td>82%</td>
              <td>
                <div className="table-actions">
                  <button className="table-action-btn view"><Eye size={16} /></button>
                  <button className="table-action-btn edit"><Edit size={16} /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateExamModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

// Quiz Taking Modal
function QuizTakingModal({ onClose }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds

  const questions = [
    {
      id: 1,
      type: 'multiple_choice',
      question: 'What is sin(30°)?',
      options: ['0.5', '0.707', '0.866', '1'],
      correctAnswer: 0
    },
    {
      id: 2,
      type: 'true_false',
      question: 'The cosine of 90° is equal to 0.',
      correctAnswer: true
    },
    {
      id: 3,
      type: 'fill_blank',
      question: 'The Pythagorean theorem states that a² + b² = ___',
      correctAnswer: 'c²'
    },
    {
      id: 4,
      type: 'short_answer',
      question: 'Explain the relationship between sine and cosine functions.'
    }
  ];

  const question = questions[currentQuestion];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Trigonometry Mock Exam</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              borderRadius: '8px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={18} />
              {formatTime(timeLeft)}
            </div>
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#718096' }}>
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}></div>
          </div>
        </div>

        {/* Question */}
        <div style={{
          padding: '24px',
          background: 'rgba(102, 126, 234, 0.02)',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
            {question.question}
          </div>

          {question.type === 'multiple_choice' && (
            <div style={{ display: 'grid', gap: '12px' }}>
              {question.options.map((option, idx) => (
                <div
                  key={idx}
                  onClick={() => setAnswers({ ...answers, [question.id]: idx })}
                  style={{
                    padding: '16px',
                    background: answers[question.id] === idx ? 'rgba(102, 126, 234, 0.1)' : 'white',
                    border: `2px solid ${answers[question.id] === idx ? '#667eea' : 'rgba(102, 126, 234, 0.2)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: `2px solid ${answers[question.id] === idx ? '#667eea' : '#d1d5db'}`,
                      background: answers[question.id] === idx ? '#667eea' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      {answers[question.id] === idx && <Check size={14} />}
                    </div>
                    <span style={{ fontWeight: 500 }}>{option}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {question.type === 'true_false' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[{ label: 'True', value: true }, { label: 'False', value: false }].map((option) => (
                <div
                  key={option.label}
                  onClick={() => setAnswers({ ...answers, [question.id]: option.value })}
                  style={{
                    padding: '20px',
                    background: answers[question.id] === option.value ? 'rgba(102, 126, 234, 0.1)' : 'white',
                    border: `2px solid ${answers[question.id] === option.value ? '#667eea' : 'rgba(102, 126, 234, 0.2)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}

          {question.type === 'fill_blank' && (
            <input
              type="text"
              className="form-input"
              placeholder="Type your answer here..."
              value={answers[question.id] || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              style={{ fontSize: '16px' }}
            />
          )}

          {question.type === 'short_answer' && (
            <textarea
              className="form-textarea"
              placeholder="Type your answer here..."
              value={answers[question.id] || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              rows={6}
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            className="action-button"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            style={{ opacity: currentQuestion === 0 ? 0.5 : 1 }}
          >
            Previous
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            {currentQuestion < questions.length - 1 ? (
              <button
                className="action-button primary"
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
              >
                Next Question
              </button>
            ) : (
              <button className="action-button primary">
                <Send size={14} />
                Submit Exam
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(102, 126, 234, 0.02)', borderRadius: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#718096' }}>
            Question Navigator
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: answers[questions[idx].id] !== undefined 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : idx === currentQuestion 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'white',
                  color: answers[questions[idx].id] !== undefined || idx === currentQuestion ? 'white' : '#718096',
                  border: '2px solid rgba(102, 126, 234, 0.2)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Exam Modal
function CreateExamModal({ onClose }) {
  // eslint-disable-next-line no-unused-vars
  const [questions, setQuestions] = useState([]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Mock Exam</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form>
          <div className="form-group">
            <label className="form-label">Exam Title</label>
            <input type="text" className="form-input" placeholder="e.g., Trigonometry Mock Exam" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-select">
                <option>Mathematics</option>
                <option>Life Sciences</option>
                <option>Physical Sciences</option>
                <option>English</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input type="number" className="form-input" placeholder="60" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Add Questions</label>
            <div style={{ display: 'grid', gap: '8px' }}>
              <button type="button" className="action-button" style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={14} />
                Multiple Choice
              </button>
              <button type="button" className="action-button" style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={14} />
                True/False
              </button>
              <button type="button" className="action-button" style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={14} />
                Fill in the Blanks
              </button>
              <button type="button" className="action-button" style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={14} />
                Short Answer
              </button>
              <button type="button" className="action-button" style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={14} />
                Essay Question
              </button>
            </div>
          </div>

          {questions.length > 0 && (
            <div style={{
              padding: '16px',
              background: 'rgba(102, 126, 234, 0.05)',
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Questions Added: {questions.length}
              </div>
              <div style={{ fontSize: '13px', color: '#718096' }}>
                Auto-graded: {questions.filter(q => ['multiple_choice', 'true_false', 'fill_blank'].includes(q.type)).length}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="action-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-button primary">
              <Plus size={14} />
              Create Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Lesson Planning View (Teacher only)
function LessonPlanningView() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Lesson Planning</h1>
        <p className="page-subtitle">Plan themes, units, and organize your curriculum</p>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Annual Teaching Plan</h3>
          <button className="action-button primary">
            <Plus size={14} />
            Add Theme
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            {[
              { term: 'Term 1', weeks: '10 weeks', themes: ['Algebra Foundations', 'Linear Equations'], color: '#667eea' },
              { term: 'Term 2', weeks: '10 weeks', themes: ['Quadratic Functions', 'Trigonometry Intro'], color: '#10b981' },
              { term: 'Term 3', weeks: '10 weeks', themes: ['Statistics', 'Probability'], color: '#f59e0b' },
              { term: 'Term 4', weeks: '9 weeks', themes: ['Exam Revision', 'Final Assessments'], color: '#ef4444' }
            ].map((term, idx) => (
              <div key={idx} style={{
                padding: '20px',
                background: 'white',
                borderRadius: '12px',
                border: `2px solid ${term.color}20`,
                borderLeft: `4px solid ${term.color}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: term.color }}>{term.term}</div>
                    <div style={{ fontSize: '13px', color: '#718096' }}>{term.weeks}</div>
                  </div>
                  <button className="action-button">
                    <Edit size={14} />
                    Edit
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {term.themes.map((theme, i) => (
                    <span key={i} className="badge info">{theme}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Progress View
function ProgressView({ role, user }) {
  if (role === 'student') {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">My Progress</h1>
          <p className="page-subtitle">Track your academic performance and growth</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <Target size={24} />
            </div>
            <div className="stat-label">Overall Average</div>
            <div className="stat-value">87%</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <TrendingUp size={24} />
            </div>
            <div className="stat-label">Improvement</div>
            <div className="stat-value">+5%</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <Award size={24} />
            </div>
            <div className="stat-label">Top Subject</div>
            <div className="stat-value">English</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <Star size={24} />
            </div>
            <div className="stat-label">Achievements</div>
            <div className="stat-value">12</div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Subject Performance</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={[
              { subject: 'Mathematics', score: 85 },
              { subject: 'Life Sciences', score: 88 },
              { subject: 'English', score: 92 },
              { subject: 'Physical Sciences', score: 82 },
              { subject: 'History', score: 87 }
            ]}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" stroke="#718096" />
              <PolarRadiusAxis stroke="#718096" />
              <Radar name="Performance" dataKey="score" stroke="#667eea" fill="#667eea" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Parent view - similar structure
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{user.children[0].name}'s Progress</h1>
        <p className="page-subtitle">Comprehensive academic performance tracking</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Target size={24} />
          </div>
          <div className="stat-label">Overall Average</div>
          <div className="stat-value">87%</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <TrendingUp size={24} />
            </div>
          <div className="stat-label">Improvement</div>
          <div className="stat-value">+5%</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Award size={24} />
          </div>
          <div className="stat-label">Class Rank</div>
          <div className="stat-value">8/35</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <CheckCircle size={24} />
          </div>
          <div className="stat-label">Attendance</div>
          <div className="stat-value">96%</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Performance Trends</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[
            { month: 'Jan', average: 82 },
            { month: 'Feb', average: 84 },
            { month: 'Mar', average: 85 },
            { month: 'Apr', average: 86 },
            { month: 'May', average: 87 },
            { month: 'Jun', average: 87 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#718096" />
            <YAxis stroke="#718096" />
            <Tooltip />
            <Line type="monotone" dataKey="average" stroke="#667eea" strokeWidth={3} dot={{ fill: '#667eea', r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Discussions View - Forums and Collaboration
function DiscussionsView({ role }) {
  const [activeTab, setActiveTab] = useState('all');
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);

  const discussions = [
    {
      id: 1,
      title: 'Question about Trigonometric Identities',
      subject: 'Mathematics',
      author: 'Student Mike',
      authorAvatar: '🎓',
      replies: 5,
      lastActivity: '10 minutes ago',
      category: 'question',
      solved: false
    },
    {
      id: 2,
      title: 'Group Study Session - Chemistry Finals',
      subject: 'Physical Sciences',
      author: 'Student Sarah',
      authorAvatar: '👩‍🎓',
      replies: 12,
      lastActivity: '1 hour ago',
      category: 'study_group',
      solved: false
    },
    {
      id: 3,
      title: 'Cell Division - Mitosis vs Meiosis',
      subject: 'Life Sciences',
      author: 'Teacher John',
      authorAvatar: '👨‍🏫',
      replies: 8,
      lastActivity: '3 hours ago',
      category: 'discussion',
      solved: true
    },
    {
      id: 4,
      title: 'Project Group: Shakespeare Essay Analysis',
      subject: 'English',
      author: 'Student Emma',
      authorAvatar: '📚',
      replies: 15,
      lastActivity: 'Yesterday',
      category: 'group_project',
      solved: false
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Discussion Forums</h1>
        <p className="page-subtitle">Collaborate with classmates and teachers</p>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="content-tabs">
          <button className={`tab-button ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            All Discussions
          </button>
          <button className={`tab-button ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
            My Discussions
          </button>
          <button className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>
            Group Projects
          </button>
        </div>
        <button className="action-button primary" onClick={() => setShowNewTopicModal(true)}>
          <Plus size={14} />
          New Discussion
        </button>
      </div>

      {/* Category Filters */}
      <div style={{
        padding: '16px 24px',
        background: 'white',
        borderRadius: '12px',
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#718096', display: 'flex', alignItems: 'center', marginRight: '8px' }}>
          <Filter size={16} style={{ marginRight: '8px' }} />
          Filter by:
        </div>
        {['All', 'Questions', 'Study Groups', 'Group Projects', 'Announcements'].map(filter => (
          <button
            key={filter}
            className="action-button"
            style={{
              background: filter === 'All' ? 'rgba(102, 126, 234, 0.1)' : 'white',
              color: filter === 'All' ? '#667eea' : '#718096'
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Discussion List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {discussions.map(discussion => (
          <div key={discussion.id} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s',
            cursor: 'pointer',
            border: '2px solid transparent'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Avatar */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                {discussion.authorAvatar}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a202c' }}>
                        {discussion.title}
                      </h3>
                      {discussion.solved && (
                        <span className="badge success" style={{ fontSize: '11px' }}>
                          <CheckCircle size={12} style={{ marginRight: '4px' }} />
                          Solved
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#718096' }}>
                      by {discussion.author} in <span style={{ fontWeight: 500, color: '#667eea' }}>{discussion.subject}</span>
                    </div>
                  </div>
                  <span className={`badge ${
                    discussion.category === 'question' ? 'info' :
                    discussion.category === 'study_group' ? 'warning' :
                    discussion.category === 'group_project' ? 'purple' : 'success'
                  }`}>
                    {discussion.category.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#718096' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageCircle size={14} />
                    {discussion.replies} replies
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} />
                    {discussion.lastActivity}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Q&A Section */}
      <div className="chart-card" style={{ marginTop: '32px' }}>
        <div className="chart-header">
          <h3 className="chart-title">🔴 Live Q&A Sessions</h3>
          <span className="badge danger">2 Active</span>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '2px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                    📐 Mathematics: Exam Prep Session
                  </div>
                  <div style={{ fontSize: '13px', color: '#718096' }}>
                    Teacher John • 23 participants
                  </div>
                </div>
                <button className="action-button" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <Play size={14} />
                  Join Live
                </button>
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '2px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                    🧪 Physical Sciences: Lab Discussion
                  </div>
                  <div style={{ fontSize: '13px', color: '#718096' }}>
                    Teacher Mary • 15 participants
                  </div>
                </div>
                <button className="action-button" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <Play size={14} />
                  Join Live
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Projects Section */}
      {role !== 'parent' && (
        <div className="chart-card" style={{ marginTop: '24px' }}>
          <div className="chart-header">
            <h3 className="chart-title">👥 My Group Assignments</h3>
            {role === 'teacher' && (
              <button className="action-button primary">
                <Plus size={14} />
                Create Group Assignment
              </button>
            )}
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{
                padding: '20px',
                background: 'rgba(102, 126, 234, 0.02)',
                border: '2px solid rgba(102, 126, 234, 0.1)',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                      Shakespeare Essay Analysis
                    </div>
                    <div style={{ fontSize: '13px', color: '#718096' }}>
                      English • Group 3 • Due: March 25, 2026
                    </div>
                  </div>
                  <span className="badge warning">In Progress</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#718096' }}>Group Members:</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['👨‍🎓', '👩‍🎓', '🎓', '📚'].map((emoji, idx) => (
                      <div key={idx} style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                      }}>
                        {emoji}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '65%' }}></div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#718096' }}>
                  65% complete • 8 contributions
                </div>
              </div>

              <div style={{
                padding: '20px',
                background: 'rgba(102, 126, 234, 0.02)',
                border: '2px solid rgba(102, 126, 234, 0.1)',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                      Chemistry Lab Report
                    </div>
                    <div style={{ fontSize: '13px', color: '#718096' }}>
                      Physical Sciences • Group 1 • Due: March 30, 2026
                    </div>
                  </div>
                  <span className="badge info">Not Started</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#718096' }}>Group Members:</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['🔬', '⚗️', '🧪'].map((emoji, idx) => (
                      <div key={idx} style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                      }}>
                        {emoji}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '0%' }}></div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#718096' }}>
                  0% complete • Waiting to start
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewTopicModal && (
        <NewDiscussionModal onClose={() => setShowNewTopicModal(false)} />
      )}
    </div>
  );
}

// New Discussion Modal
function NewDiscussionModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Start New Discussion</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form>
          <div className="form-group">
            <label className="form-label">Discussion Title</label>
            <input type="text" className="form-input" placeholder="What would you like to discuss?" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-select">
                <option>Mathematics</option>
                <option>Life Sciences</option>
                <option>Physical Sciences</option>
                <option>English</option>
                <option>History</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select">
                <option>Question</option>
                <option>Study Group</option>
                <option>Group Project</option>
                <option>General Discussion</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Provide details about your discussion..." rows={6}></textarea>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="action-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-button primary">
              <Send size={14} />
              Post Discussion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Placeholder components for remaining modules
function TeachersView() { return <div className="page-header"><h1 className="page-title">Teachers Module</h1></div>; }
function TimetableView() { return <div className="page-header"><h1 className="page-title">Timetable Module</h1></div>; }
function GradesView() { return <div className="page-header"><h1 className="page-title">Grades Module</h1></div>; }
function FeesView() { return <div className="page-header"><h1 className="page-title">Fees Module</h1></div>; }
function CommunicationsView() { return <div className="page-header"><h1 className="page-title">Communications Module</h1></div>; }
function LibraryView() { return <div className="page-header"><h1 className="page-title">Library Module</h1></div>; }
function ReportsView() { return <div className="page-header"><h1 className="page-title">Reports Module</h1></div>; }
function SGBView() { return <div className="page-header"><h1 className="page-title">SGB Portal</h1></div>; }
function TransportView() { return <div className="page-header"><h1 className="page-title">Transport Module</h1></div>; }
