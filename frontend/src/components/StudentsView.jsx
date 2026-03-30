import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Edit, Trash2, Eye, Download, X, UserCheck, AlertCircle, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { studentService } from '../services/studentService';
import LearnerRegistrationWizard from './LearnerRegistrationWizard';

const GRADES = ['Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const STATUSES = ['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'SUSPENDED'];
const GENDERS = ['Male', 'Female', 'Other'];


const emptyForm = {
  firstName: '', lastName: '', currentGrade: 'Grade 10', gender: 'Male',
  dateOfBirth: '', guardianName: '', guardianPhone: '', guardianEmail: '',
  guardianRelation: '', address: '', city: '', province: '',
  email: '', phone: '', medicalConditions: '', status: 'ACTIVE',
};

function statusBadge(status) {
  const map = { ACTIVE: 'success', INACTIVE: 'warning', GRADUATED: 'info', TRANSFERRED: 'purple', SUSPENDED: 'danger', EXPELLED: 'danger' };
  return map[status] || 'info';
}

function StudentModal({ student, onClose }) {
  if (!student) return null;
  const firstName = student.user?.firstName || student.firstName || '';
  const lastName = student.user?.lastName || student.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Student Profile</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '0 0 24px', borderBottom: '1px solid rgba(102,126,234,0.1)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'white', fontWeight: 700, flexShrink: 0 }}>
            {firstName?.[0] || '?'}{lastName?.[0] || ''}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22, color: '#1a202c' }}>{fullName}</div>
            <div style={{ color: '#718096', fontSize: 14, marginTop: 4 }}>{student.admissionNumber} &bull; {student.currentGrade}</div>
            <span className={`badge ${statusBadge(student.status)}`} style={{ marginTop: 8 }}>{student.status}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: 20 }}>
          {[
            ['Gender', student.gender],
            ['Date of Birth', student.dateOfBirth || '—'],
            ['Email', student.user?.email || '—'],
            ['Phone', student.user?.phone || '—'],
            ['Address', student.address ? `${student.address}, ${student.city || ''}` : '—'],
            ['Province', student.province || '—'],
            ['Guardian', student.guardianName || '—'],
            ['Guardian Phone', student.guardianPhone || '—'],
            ['Guardian Email', student.guardianEmail || '—'],
            ['Relation', student.guardianRelation || '—'],
            ['Medical', student.medicalConditions || 'None'],
            ['Previous School', student.previousSchool || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 12, color: '#a0aec0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, color: '#2d3748', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button className="action-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function StudentFormModal({ student, onClose, onSave }) {
  const isEdit = Boolean(student?.id);
  const [form, setForm] = useState(
    isEdit
      ? { firstName: student.user?.firstName || student.firstName || '', lastName: student.user?.lastName || student.lastName || '', currentGrade: student.currentGrade || 'Grade 10', gender: student.gender || 'Male', dateOfBirth: student.dateOfBirth || '', guardianName: student.guardianName || '', guardianPhone: student.guardianPhone || '', guardianEmail: student.guardianEmail || '', guardianRelation: student.guardianRelation || '', address: student.address || '', city: student.city || '', province: student.province || '', email: student.user?.email || '', phone: student.user?.phone || '', medicalConditions: student.medicalConditions || '', status: student.status || 'ACTIVE' }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isEdit) {
        await studentService.update(student.id, form);
      } else {
        await studentService.create(form);
      }
      onSave();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save student. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, name, type = 'text', required, options }) => (
    <div className="form-group">
      <label className="form-label">{label}{required && ' *'}</label>
      {options ? (
        <select className="form-select" name={name} value={form[name]} onChange={handleChange} required={required}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input className="form-input" type={type} name={name} value={form[name]} onChange={handleChange} required={required} />
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Student' : 'Add New Student'}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="First Name" name="firstName" required />
            <Field label="Last Name" name="lastName" required />
            <Field label="Grade" name="currentGrade" options={GRADES} required />
            <Field label="Gender" name="gender" options={GENDERS} required />
            <Field label="Date of Birth" name="dateOfBirth" type="date" />
            <Field label="Status" name="status" options={STATUSES} />
            <Field label="Email" name="email" type="email" />
            <Field label="Phone" name="phone" type="tel" />
          </div>

          <div style={{ marginTop: 8, borderTop: '1px solid rgba(102,126,234,0.1)', paddingTop: 16, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#667eea', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guardian Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Guardian Name" name="guardianName" />
              <Field label="Guardian Phone" name="guardianPhone" type="tel" />
              <Field label="Guardian Email" name="guardianEmail" type="email" />
              <Field label="Relationship" name="guardianRelation" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(102,126,234,0.1)', paddingTop: 16, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#667eea', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0 16px' }}>
              <Field label="Street Address" name="address" />
              <Field label="City" name="city" />
              <Field label="Province" name="province" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Medical Conditions / Allergies</label>
            <textarea className="form-textarea" name="medicalConditions" value={form.medicalConditions} onChange={handleChange} placeholder="List any known medical conditions or allergies" style={{ minHeight: 72 }} />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14, background: '#fff5f5', color: '#c53030', border: '1px solid #feb2b2' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="action-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-button primary" disabled={saving}>
              <Plus size={14} />
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentsView() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRegistrationWizard, setShowRegistrationWizard] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const PER_PAGE = 10;

  // Debounce search input to avoid excessive API calls while typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentService.getAll({ page, limit: PER_PAGE, search: debouncedSearch || undefined, grade: filterGrade || undefined, status: filterStatus || undefined });
      const list = data.data || data.students || data || [];
      setStudents(Array.isArray(list) ? list : []);
      setTotalPages(data.pagination?.pages || data.totalPages || Math.ceil((data.pagination?.total || data.total || list.length) / PER_PAGE) || 1);
    } catch {
      setStudents([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterGrade, filterStatus]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const handleDelete = async id => {
    setDeleteError(null);
    try {
      await studentService.delete(id);
      setStudents(prev => prev.filter(s => s.id !== id));
      setDeleteId(null);
    } catch {
      setDeleteError('Failed to delete student. Please try again.');
    }
  };

  const handleExport = () => {
    studentService.exportCSV().catch(() => {
      // Fallback: generate CSV from current page data
      const rows = [['Admission No', 'First Name', 'Last Name', 'Grade', 'Gender', 'Status', 'Guardian', 'Guardian Phone']];
      students.forEach(s => rows.push([s.admissionNumber, s.user?.firstName || s.firstName, s.user?.lastName || s.lastName, s.currentGrade, s.gender, s.status, s.guardianName, s.guardianPhone]));
      const csv = rows.map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const activeCount = students.filter(s => s.status === 'ACTIVE').length;
  const inactiveCount = students.filter(s => s.status !== 'ACTIVE').length;
  const avgAttendance = students.length ? Math.round(students.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / students.length) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage learner records, profiles and enrolment</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="action-button" onClick={handleExport}>
            <Download size={14} />
            Export CSV
          </button>
          <button className="action-button" onClick={() => setShowRegistrationWizard(true)} style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none' }}>
            <ClipboardList size={14} />
            New Registration
          </button>
          <button className="action-button primary" onClick={() => setShowAddModal(true)}>
            <Plus size={14} />
            Add Student
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon blue"><Users size={24} /></div></div>
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{students.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon green"><UserCheck size={24} /></div></div>
          <div className="stat-label">Active</div>
          <div className="stat-value">{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon orange"><AlertCircle size={24} /></div></div>
          <div className="stat-label">Inactive / Other</div>
          <div className="stat-value">{inactiveCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon purple"><UserCheck size={24} /></div></div>
          <div className="stat-label">Avg. Attendance</div>
          <div className="stat-value">{avgAttendance}%</div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${avgAttendance}%` }} />
          </div>
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">
          <h3 className="table-title">Student List</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
              <input
                type="text"
                placeholder="Search name or ID…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ padding: '8px 12px 8px 32px', border: '2px solid rgba(102,126,234,0.2)', borderRadius: 8, fontSize: 14, outline: 'none', width: 200 }}
              />
            </div>
            <select
              className="form-select"
              value={filterGrade}
              onChange={e => { setFilterGrade(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', width: 140, marginBottom: 0 }}
            >
              <option value="">All Grades</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              className="form-select"
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', width: 140, marginBottom: 0 }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#718096' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            Loading students…
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#718096' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No students found</div>
            <div style={{ fontSize: 14 }}>Try adjusting your filters or add a new student.</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Admission No.</th>
                    <th>Grade</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Guardian</th>
                    <th>Attendance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                            {(student.user?.firstName || student.firstName)?.[0] || '?'}{(student.user?.lastName || student.lastName)?.[0] || ''}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1a202c' }}>{student.user?.firstName || student.firstName} {student.user?.lastName || student.lastName}</div>
                            <div style={{ fontSize: 12, color: '#a0aec0' }}>{student.user?.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{student.admissionNumber}</td>
                      <td>{student.currentGrade}</td>
                      <td>{student.gender}</td>
                      <td><span className={`badge ${statusBadge(student.status)}`}>{student.status}</span></td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{student.guardianName || '—'}</div>
                        <div style={{ fontSize: 12, color: '#a0aec0' }}>{student.guardianPhone || ''}</div>
                      </td>
                      <td>
                        {student.attendanceRate != null ? (
                          <div>
                            <div style={{ fontWeight: 600, color: student.attendanceRate >= 80 ? '#10b981' : student.attendanceRate >= 60 ? '#f59e0b' : '#ef4444' }}>
                              {student.attendanceRate}%
                            </div>
                            <div className="progress-bar" style={{ width: 60, marginTop: 4 }}>
                              <div className="progress-fill" style={{ width: `${student.attendanceRate}%`, background: student.attendanceRate >= 80 ? '#10b981' : student.attendanceRate >= 60 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="table-action-btn view" title="View" onClick={() => setViewStudent(student)}><Eye size={15} /></button>
                          <button className="table-action-btn edit" title="Edit" onClick={() => setEditStudent(student)}><Edit size={15} /></button>
                          <button className="table-action-btn delete" title="Delete" onClick={() => setDeleteId(student.id)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid rgba(102,126,234,0.08)' }}>
                <button
                  className="action-button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ padding: '6px 12px' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: 14, color: '#718096' }}>Page {page} of {totalPages}</span>
                <button
                  className="action-button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ padding: '6px 12px' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => { setDeleteId(null); setDeleteError(null); }}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Student</h2>
              <button className="modal-close" onClick={() => { setDeleteId(null); setDeleteError(null); }}><X size={20} /></button>
            </div>
            <p style={{ color: '#4a5568', marginBottom: 16 }}>Are you sure you want to remove this student? This action cannot be undone.</p>
            {deleteError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14, background: '#fff5f5', color: '#c53030', border: '1px solid #feb2b2' }}>
                {deleteError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="action-button" onClick={() => { setDeleteId(null); setDeleteError(null); }}>Cancel</button>
              <button className="action-button" style={{ background: '#ef4444', color: 'white', borderColor: '#ef4444' }} onClick={() => handleDelete(deleteId)}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {viewStudent && <StudentModal student={viewStudent} onClose={() => setViewStudent(null)} />}

      {(showAddModal || editStudent) && (
        <StudentFormModal
          student={editStudent}
          onClose={() => { setShowAddModal(false); setEditStudent(null); }}
          onSave={() => { setShowAddModal(false); setEditStudent(null); loadStudents(); }}
        />
      )}

      {showRegistrationWizard && (
        <LearnerRegistrationWizard
          onClose={() => setShowRegistrationWizard(false)}
          onSuccess={() => { setShowRegistrationWizard(false); loadStudents(); }}
        />
      )}
    </div>
  );
}
