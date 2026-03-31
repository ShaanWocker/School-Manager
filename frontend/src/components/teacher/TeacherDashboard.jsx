import React, { useState, useEffect } from 'react';
import { Users, BookOpen, ClipboardList, Target, Plus, Eye, Edit, Calendar, Award, AlertCircle } from 'lucide-react';
import teacherService from '../../services/teacherService';
import assignmentService from '../../services/assignmentService';

const mockTeacherStats = {
  totalStudents: 145,
  classesCount: 4,
  pendingGrading: 28,
  classAverage: 84,
};

const mockTodaySlots = [
  { id: 1, time: '08:00 - 09:00', subject: 'Mathematics', className: 'Grade 10A', room: 'Room 101' },
  { id: 2, time: '09:00 - 10:00', subject: 'Mathematics', className: 'Grade 11B', room: 'Room 101' },
  { id: 3, time: '11:00 - 12:00', subject: 'Physical Sciences', className: 'Grade 10A', room: 'Lab 2' },
  { id: 4, time: '14:00 - 15:00', subject: 'Mathematics', className: 'Grade 12A', room: 'Room 101' },
];

const mockRecentAssignments = [
  { id: 1, title: 'Quadratic Equations Worksheet', subject: 'Mathematics', dueDate: '2026-03-15', submissions: 28, totalStudents: 35 },
  { id: 2, title: 'Cell Structure Essay', subject: 'Life Sciences', dueDate: '2026-03-20', submissions: 31, totalStudents: 35 },
  { id: 3, title: 'Mock Exam: Trigonometry', subject: 'Mathematics', dueDate: '2026-03-18', submissions: 22, totalStudents: 35 },
];

export default function TeacherDashboard({ user, onNavigate }) {
  const [stats, setStats] = useState(mockTeacherStats);
  const [todaySlots] = useState(mockTodaySlots);
  const [assignments, setAssignments] = useState(mockRecentAssignments);
  const [loading, setLoading] = useState(false);

  const firstName = user?.name?.split(' ')[0] || user?.firstName || 'Teacher';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];

  useEffect(() => {
    const teacherId = user?.teacherProfile?.id || user?.id;
    if (!teacherId) return;

    setLoading(true);
    Promise.allSettled([
      teacherService.getStudents(teacherId),
      teacherService.getClasses(teacherId),
      assignmentService.getAll({ teacherId }),
    ]).then(([studentsRes, classesRes, assignmentsRes]) => {
      if (studentsRes.status === 'fulfilled') {
        const students = studentsRes.value?.data || studentsRes.value || [];
        setStats(prev => ({ ...prev, totalStudents: students.length || prev.totalStudents }));
      }
      if (classesRes.status === 'fulfilled') {
        const classes = classesRes.value?.data || classesRes.value || [];
        setStats(prev => ({ ...prev, classesCount: classes.length || prev.classesCount }));
      }
      if (assignmentsRes.status === 'fulfilled') {
        const list = assignmentsRes.value?.data || assignmentsRes.value || [];
        if (Array.isArray(list) && list.length > 0) setAssignments(list.slice(0, 3));
      }
    }).finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {firstName}! 👨‍🏫</h1>
        <p className="page-subtitle">Manage your classes and track student progress</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue"><Users size={24} /></div>
          </div>
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{loading ? '…' : stats.totalStudents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green"><BookOpen size={24} /></div>
          </div>
          <div className="stat-label">My Classes</div>
          <div className="stat-value">{loading ? '…' : stats.classesCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orange"><ClipboardList size={24} /></div>
          </div>
          <div className="stat-label">Pending Grading</div>
          <div className="stat-value">{loading ? '…' : stats.pendingGrading}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple"><Target size={24} /></div>
          </div>
          <div className="stat-label">Class Average</div>
          <div className="stat-value">{loading ? '…' : `${stats.classAverage}%`}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Today's Timetable */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Today's Schedule ({today})</h3>
            <button className="action-button" onClick={() => onNavigate && onNavigate('timetable')}>
              <Calendar size={14} />
              Full Timetable
            </button>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            {todaySlots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#718096' }}>
                No classes scheduled for today
              </div>
            ) : (
              todaySlots.map(slot => (
                <div key={slot.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px',
                  background: 'rgba(102, 126, 234, 0.03)',
                  borderRadius: '12px',
                  marginBottom: '10px',
                  borderLeft: '3px solid #667eea',
                }}>
                  <div style={{ minWidth: '110px', fontSize: '13px', color: '#667eea', fontWeight: 600 }}>
                    {slot.time}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1a202c', marginBottom: '2px' }}>{slot.subject}</div>
                    <div style={{ fontSize: '13px', color: '#718096' }}>{slot.className} • {slot.room}</div>
                  </div>
                  <button
                    className="action-button"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => onNavigate && onNavigate('myClasses')}
                  >
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Quick Actions</h3>
          </div>
          <div style={{ padding: '0 24px 24px', display: 'grid', gap: '12px' }}>
            <button
              className="action-button primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNavigate && onNavigate('assignments')}
            >
              <Plus size={14} />
              Create Assignment
            </button>
            <button
              className="action-button"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNavigate && onNavigate('attendance')}
            >
              <Award size={14} />
              Mark Attendance
            </button>
            <button
              className="action-button"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNavigate && onNavigate('grades')}
            >
              <Target size={14} />
              Enter Grades
            </button>
            <button
              className="action-button"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNavigate && onNavigate('myClasses')}
            >
              <BookOpen size={14} />
              My Classes
            </button>
          </div>
        </div>
      </div>

      {/* Pending Assignments Table */}
      <div className="data-table">
        <div className="table-header">
          <h3 className="table-title">Assignment Submissions</h3>
          <button className="action-button" onClick={() => onNavigate && onNavigate('assignments')}>
            View All
          </button>
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
            {assignments.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>{a.title}</td>
                <td>{a.subject}</td>
                <td>{a.dueDate}</td>
                <td>
                  <span style={{ fontWeight: 600 }}>{a.submissions}</span>/{a.totalStudents}
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    {Math.round((a.submissions / a.totalStudents) * 100)}% submitted
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

      {/* Pending tasks notice */}
      {stats.pendingGrading > 0 && (
        <div style={{
          marginTop: '24px',
          padding: '16px 20px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#b45309',
        }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: 600 }}>
            You have {stats.pendingGrading} ungraded assignment submissions.
          </span>
          <button
            className="action-button"
            style={{ marginLeft: 'auto' }}
            onClick={() => onNavigate && onNavigate('grades')}
          >
            Grade Now
          </button>
        </div>
      )}
    </div>
  );
}
