import React, { useState, useEffect } from 'react';
import { Users, ChevronRight, BookOpen } from 'lucide-react';
import teacherService from '../../services/teacherService';
import classService from '../../services/classService';
import assignmentService from '../../services/assignmentService';
import gradeService from '../../services/gradeService';

const mockClasses = [
  { id: '1', name: 'Grade 10A', grade: 'Grade 10', studentsCount: 35, subject: 'Mathematics', room: 'Room 101' },
  { id: '2', name: 'Grade 11B', grade: 'Grade 11', studentsCount: 32, subject: 'Mathematics', room: 'Room 101' },
  { id: '3', name: 'Grade 12A', grade: 'Grade 12', studentsCount: 28, subject: 'Mathematics', room: 'Room 101' },
  { id: '4', name: 'Grade 10A', grade: 'Grade 10', studentsCount: 35, subject: 'Physical Sciences', room: 'Lab 2' },
];

const mockStudents = [
  { id: 's1', firstName: 'Sipho', lastName: 'Ndlovu', email: 'sipho@school.co.za', status: 'Active', grade: 78 },
  { id: 's2', firstName: 'Ayanda', lastName: 'Dlamini', email: 'ayanda@school.co.za', status: 'Active', grade: 92 },
  { id: 's3', firstName: 'Thabo', lastName: 'Mokoena', email: 'thabo@school.co.za', status: 'Active', grade: 65 },
  { id: 's4', firstName: 'Nomsa', lastName: 'Khumalo', email: 'nomsa@school.co.za', status: 'Active', grade: 88 },
  { id: 's5', firstName: 'Lungelo', lastName: 'Zulu', email: 'lungelo@school.co.za', status: 'Absent', grade: 55 },
];

const mockAttendanceSummary = [
  { studentId: 's1', present: 18, absent: 2, late: 1 },
  { studentId: 's2', present: 20, absent: 1, late: 0 },
  { studentId: 's3', present: 15, absent: 4, late: 2 },
  { studentId: 's4', present: 19, absent: 1, late: 1 },
  { studentId: 's5', present: 12, absent: 8, late: 1 },
];

const mockAssignments = [
  { id: 'a1', title: 'Quadratic Equations Worksheet', dueDate: '2026-03-15', submissions: 28, totalStudents: 35, status: 'active' },
  { id: 'a2', title: 'Linear Functions Test', dueDate: '2026-03-20', submissions: 35, totalStudents: 35, status: 'graded' },
];

const mockGrades = [
  { studentId: 's1', name: 'Sipho Ndlovu', term1: 78, term2: 72, term3: null, average: 75 },
  { studentId: 's2', name: 'Ayanda Dlamini', term1: 92, term2: 88, term3: null, average: 90 },
  { studentId: 's3', name: 'Thabo Mokoena', term1: 65, term2: 60, term3: null, average: 62 },
  { studentId: 's4', name: 'Nomsa Khumalo', term1: 88, term2: 91, term3: null, average: 90 },
  { studentId: 's5', name: 'Lungelo Zulu', term1: 55, term2: 48, term3: null, average: 52 },
];

function ClassCard({ cls, onClick }) {
  return (
    <div
      onClick={() => onClick(cls)}
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '2px solid transparent',
      }}
      onMouseOver={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = '#667eea';
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}>
          <BookOpen size={24} />
        </div>
        <ChevronRight size={20} color="#718096" />
      </div>
      <div style={{ fontWeight: 700, fontSize: '18px', color: '#1a202c', marginBottom: '4px' }}>{cls.name}</div>
      <div style={{ fontSize: '14px', color: '#667eea', fontWeight: 600, marginBottom: '12px' }}>{cls.subject}</div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#718096' }}>
          <Users size={14} />
          {cls.studentsCount} students
        </div>
        <div style={{ fontSize: '13px', color: '#718096' }}>{cls.room || cls.grade}</div>
      </div>
    </div>
  );
}

function ClassDetails({ cls, onBack }) {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState(mockStudents);
  const [attendance] = useState(mockAttendanceSummary);
  const [assignments, setAssignments] = useState(mockAssignments);
  const [grades, setGrades] = useState(mockGrades);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cls?.id) return;
    setLoading(true);
    Promise.allSettled([
      classService.getStudents(cls.id),
      assignmentService.getAll({ classId: cls.id }),
      gradeService.getAll({ classId: cls.id }),
    ]).then(([studRes, assRes, grdRes]) => {
      if (studRes.status === 'fulfilled') {
        const list = studRes.value?.data || studRes.value || [];
        if (Array.isArray(list) && list.length > 0) setStudents(list);
      }
      if (assRes.status === 'fulfilled') {
        const list = assRes.value?.data || assRes.value || [];
        if (Array.isArray(list) && list.length > 0) setAssignments(list);
      }
      if (grdRes.status === 'fulfilled') {
        const list = grdRes.value?.data || grdRes.value || [];
        if (Array.isArray(list) && list.length > 0) setGrades(list);
      }
    }).finally(() => setLoading(false));
  }, [cls]);

  const tabs = [
    { key: 'students', label: 'Students' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'grades', label: 'Grades' },
  ];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="action-button" onClick={onBack}>← Back</button>
          <div>
            <h1 className="page-title">{cls.name} — {cls.subject}</h1>
            <p className="page-subtitle">{cls.studentsCount} students • {cls.room || cls.grade}</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div className="content-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`tab-button ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '32px', color: '#718096' }}>Loading…</div>
      )}

      {/* Students Tab */}
      {!loading && activeTab === 'students' && (
        <div className="data-table">
          <div className="table-header">
            <h3 className="table-title">Students ({students.length})</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Last Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.id}>
                  <td style={{ color: '#718096' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</td>
                  <td>{s.email}</td>
                  <td>
                    <span className={`badge ${s.status === 'Active' ? 'success' : 'warning'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>{s.grade != null ? `${s.grade}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Attendance Tab */}
      {!loading && activeTab === 'attendance' && (
        <div className="data-table">
          <div className="table-header">
            <h3 className="table-title">Attendance Summary</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const att = attendance.find(a => a.studentId === s.id) || { present: 0, absent: 0, late: 0 };
                const total = att.present + att.absent + att.late;
                const rate = total > 0 ? Math.round((att.present / total) * 100) : 0;
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</td>
                    <td><span className="badge success">{att.present}</span></td>
                    <td><span className="badge danger">{att.absent}</span></td>
                    <td><span className="badge warning">{att.late}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                          <div style={{
                            width: `${rate}%`,
                            height: '100%',
                            borderRadius: '3px',
                            background: rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444',
                          }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#4a5568', minWidth: '35px' }}>{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assignments Tab */}
      {!loading && activeTab === 'assignments' && (
        <div className="data-table">
          <div className="table-header">
            <h3 className="table-title">Assignments</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Due Date</th>
                <th>Submissions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.title}</td>
                  <td>{a.dueDate}</td>
                  <td>{a.submissions}/{a.totalStudents}</td>
                  <td>
                    <span className={`badge ${a.status === 'graded' ? 'success' : a.status === 'active' ? 'info' : 'warning'}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grades Tab */}
      {!loading && activeTab === 'grades' && (
        <div className="data-table">
          <div className="table-header">
            <h3 className="table-title">Grade Overview</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Term 1</th>
                <th>Term 2</th>
                <th>Term 3</th>
                <th>Average</th>
              </tr>
            </thead>
            <tbody>
              {grades.map(g => (
                <tr key={g.studentId}>
                  <td style={{ fontWeight: 600 }}>{g.name}</td>
                  <td>{g.term1 != null ? `${g.term1}%` : '—'}</td>
                  <td>{g.term2 != null ? `${g.term2}%` : '—'}</td>
                  <td>{g.term3 != null ? `${g.term3}%` : '—'}</td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: g.average >= 75 ? '#10b981' : g.average >= 50 ? '#f59e0b' : '#ef4444',
                    }}>
                      {g.average != null ? `${g.average}%` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TeacherClasses({ user }) {
  const [classes, setClasses] = useState(mockClasses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);

  const teacherId = user?.teacherProfile?.id || user?.id;

  useEffect(() => {
    if (!teacherId) return;
    setLoading(true);
    teacherService.getClasses(teacherId)
      .then(res => {
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) setClasses(list);
      })
      .catch(err => {
        setError(err?.response?.data?.message || 'Could not load classes.');
      })
      .finally(() => setLoading(false));
  }, [teacherId]);

  if (selectedClass) {
    return <ClassDetails cls={selectedClass} onBack={() => setSelectedClass(null)} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Classes</h1>
        <p className="page-subtitle">Manage your assigned classes and student progress</p>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          background: '#fff5f5',
          border: '1px solid #feb2b2',
          borderRadius: '8px',
          color: '#c53030',
          marginBottom: '24px',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: '#718096' }}>
          Loading classes…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {classes.map(cls => (
            <ClassCard key={cls.id} cls={cls} onClick={setSelectedClass} />
          ))}
          {classes.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px', color: '#718096' }}>
              No classes assigned yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
