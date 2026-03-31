import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, X, Send, Users } from 'lucide-react';
import assignmentService from '../../services/assignmentService';
import teacherService from '../../services/teacherService';

const mockClasses = [
  { id: '1', name: 'Grade 10A – Mathematics' },
  { id: '2', name: 'Grade 11B – Mathematics' },
  { id: '3', name: 'Grade 12A – Mathematics' },
  { id: '4', name: 'Grade 10A – Physical Sciences' },
];

const mockAssignments = [
  {
    id: 'a1', title: 'Quadratic Equations Worksheet', subject: 'Mathematics',
    className: 'Grade 10A', dueDate: '2026-03-15', description: 'Complete all exercises on quadratic equations.',
    submissions: 28, totalStudents: 35, status: 'active', type: 'homework',
  },
  {
    id: 'a2', title: 'Cell Structure Essay', subject: 'Life Sciences',
    className: 'Grade 11B', dueDate: '2026-03-20', description: 'Write a 500-word essay on cell structures.',
    submissions: 31, totalStudents: 35, status: 'active', type: 'assignment',
  },
  {
    id: 'a3', title: 'Mock Exam: Trigonometry', subject: 'Mathematics',
    className: 'Grade 12A', dueDate: '2026-03-18', description: 'Trigonometry mock exam covering chapters 5-7.',
    submissions: 35, totalStudents: 35, status: 'graded', type: 'exam',
  },
];

const mockSubmissions = [
  { id: 'sub1', studentName: 'Sipho Ndlovu', submittedAt: '2026-03-14', grade: 85, status: 'graded' },
  { id: 'sub2', studentName: 'Ayanda Dlamini', submittedAt: '2026-03-15', grade: null, status: 'submitted' },
  { id: 'sub3', studentName: 'Thabo Mokoena', submittedAt: null, grade: null, status: 'pending' },
];

function CreateAssignmentModal({ classes, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', dueDate: '', classId: '', subject: '', type: 'homework',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.dueDate || !form.classId) {
      setError('Title, class, and due date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await assignmentService.create(form);
      onCreated(res?.data || res);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create assignment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Assignment</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {error && (
          <div style={{ padding: '12px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', color: '#c53030', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="Assignment title" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Class *</label>
              <select className="form-select" name="classId" value={form.classId} onChange={handleChange} required>
                <option value="">Select class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="form-input" name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Mathematics" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input type="date" className="form-input" name="dueDate" value={form.dueDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                <option value="homework">Homework</option>
                <option value="assignment">Assignment</option>
                <option value="exam">Mock Exam</option>
                <option value="project">Project</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} placeholder="Describe the assignment..." rows={4} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="action-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-button primary" disabled={saving}>
              <Send size={14} />
              {saving ? 'Creating…' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubmissionsModal({ assignment, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Submissions: {assignment.title}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#718096' }}>
          {assignment.submissions}/{assignment.totalStudents} submitted
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', color: '#718096', borderBottom: '1px solid #e2e8f0' }}>Student</th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', color: '#718096', borderBottom: '1px solid #e2e8f0' }}>Submitted</th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', color: '#718096', borderBottom: '1px solid #e2e8f0' }}>Grade</th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', color: '#718096', borderBottom: '1px solid #e2e8f0' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockSubmissions.map(sub => (
              <tr key={sub.id}>
                <td style={{ padding: '12px 10px', fontWeight: 600 }}>{sub.studentName}</td>
                <td style={{ padding: '12px 10px', color: '#718096', fontSize: '13px' }}>{sub.submittedAt || '—'}</td>
                <td style={{ padding: '12px 10px' }}>
                  {sub.grade != null ? (
                    <span style={{ fontWeight: 700, color: sub.grade >= 75 ? '#10b981' : '#f59e0b' }}>{sub.grade}%</span>
                  ) : '—'}
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <span className={`badge ${sub.status === 'graded' ? 'success' : sub.status === 'submitted' ? 'info' : 'warning'}`}>
                    {sub.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="action-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherAssignments({ user }) {
  const [assignments, setAssignments] = useState(mockAssignments);
  const [classes, setClasses] = useState(mockClasses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewSubmissions, setViewSubmissions] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  const teacherId = user?.teacherProfile?.id || user?.id;

  useEffect(() => {
    if (!teacherId) return;
    setLoading(true);

    Promise.allSettled([
      assignmentService.getAll({ teacherId }),
      teacherService.getClasses(teacherId),
    ]).then(([assRes, clsRes]) => {
      if (assRes.status === 'fulfilled') {
        const list = assRes.value?.data || assRes.value || [];
        if (Array.isArray(list) && list.length > 0) setAssignments(list);
      }
      if (clsRes.status === 'fulfilled') {
        const list = clsRes.value?.data || clsRes.value || [];
        if (Array.isArray(list) && list.length > 0) {
          setClasses(list.map(c => ({ id: c.id, name: c.name || `${c.grade} – ${c.subject}` })));
        }
      }
    }).finally(() => setLoading(false));
  }, [teacherId]);

  const handleCreated = (newAssignment) => {
    setAssignments(prev => [newAssignment, ...prev]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await assignmentService.delete(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete assignment.');
    }
  };

  const filtered = assignments.filter(a => {
    if (activeTab === 'active') return a.status === 'active';
    if (activeTab === 'graded') return a.status === 'graded';
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Assignments</h1>
            <p className="page-subtitle">Create and manage class assignments</p>
          </div>
          <button className="action-button primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} />
            Create Assignment
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', color: '#c53030', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <div className="content-tabs" style={{ marginBottom: '24px' }}>
        <button className={`tab-button ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          All ({assignments.length})
        </button>
        <button className={`tab-button ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
          Active ({assignments.filter(a => a.status === 'active').length})
        </button>
        <button className={`tab-button ${activeTab === 'graded' ? 'active' : ''}`} onClick={() => setActiveTab('graded')}>
          Graded ({assignments.filter(a => a.status === 'graded').length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: '#718096' }}>Loading assignments…</div>
      ) : (
        <div className="data-table">
          <div className="table-header">
            <h3 className="table-title">Assignments</h3>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#718096' }}>No assignments found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Due Date</th>
                  <th>Submissions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.title}</td>
                    <td>{a.className || '—'}</td>
                    <td>{a.subject || '—'}</td>
                    <td>
                      <span className="badge info">{a.type || 'assignment'}</span>
                    </td>
                    <td>{a.dueDate}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color="#718096" />
                        <span style={{ fontWeight: 600 }}>{a.submissions ?? 0}</span>
                        <span style={{ color: '#718096' }}>/{a.totalStudents ?? '?'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${a.status === 'graded' ? 'success' : a.status === 'active' ? 'info' : 'warning'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="table-action-btn view" onClick={() => setViewSubmissions(a)} title="View submissions">
                          <Eye size={16} />
                        </button>
                        <button className="table-action-btn edit" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button
                          className="table-action-btn"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                          onClick={() => handleDelete(a.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateAssignmentModal
          classes={classes}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}

      {viewSubmissions && (
        <SubmissionsModal
          assignment={viewSubmissions}
          onClose={() => setViewSubmissions(null)}
        />
      )}
    </div>
  );
}
