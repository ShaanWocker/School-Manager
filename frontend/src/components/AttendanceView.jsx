import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, Calendar, Filter, AlertCircle, Check, X, Clock, ChevronLeft, ChevronRight, Plus, BarChart3 } from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { classService } from '../services/classService';

const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'];
const STATUS_COLORS = {
  PRESENT: { badge: 'success', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  ABSENT: { badge: 'danger', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  LATE: { badge: 'warning', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  EXCUSED: { badge: 'info', color: '#667eea', bg: 'rgba(102,126,234,0.1)' },
  SICK: { badge: 'purple', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};

const today = new Date().toISOString().split('T')[0];

function StatusIcon({ status }) {
  if (status === 'PRESENT') return <Check size={14} />;
  if (status === 'ABSENT') return <X size={14} />;
  if (status === 'LATE') return <Clock size={14} />;
  return <AlertCircle size={14} />;
}

function AttendanceStatCards({ records }) {
  const total = records.length;
  const counts = ATTENDANCE_STATUSES.reduce((acc, s) => {
    acc[s] = records.filter(r => r.status === s).length;
    return acc;
  }, {});
  const presentRate = total ? Math.round((counts.PRESENT / total) * 100) : 0;
  const absentRate = total ? Math.round((counts.ABSENT / total) * 100) : 0;
  const lateCount = counts.LATE + counts.EXCUSED + counts.SICK;

  return (
    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
      <div className="stat-card">
        <div className="stat-header"><div className="stat-icon blue"><UserCheck size={24} /></div></div>
        <div className="stat-label">Total Records</div>
        <div className="stat-value">{total}</div>
      </div>
      <div className="stat-card">
        <div className="stat-header"><div className="stat-icon green"><Check size={24} /></div></div>
        <div className="stat-label">Present Rate</div>
        <div className="stat-value" style={{ color: '#10b981' }}>{presentRate}%</div>
        <div className="progress-bar" style={{ marginTop: 8 }}>
          <div className="progress-fill" style={{ width: `${presentRate}%`, background: '#10b981' }} />
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-header"><div className="stat-icon orange"><X size={24} /></div></div>
        <div className="stat-label">Absent Rate</div>
        <div className="stat-value" style={{ color: '#ef4444' }}>{absentRate}%</div>
        <div className="progress-bar" style={{ marginTop: 8 }}>
          <div className="progress-fill" style={{ width: `${absentRate}%`, background: '#ef4444' }} />
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-header"><div className="stat-icon purple"><Clock size={24} /></div></div>
        <div className="stat-label">Late / Excused / Sick</div>
        <div className="stat-value">{lateCount}</div>
      </div>
    </div>
  );
}

function AttendanceRecordsTab({ records, loading }) {
  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#718096' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
        Loading records…
      </div>
    );
  }
  if (records.length === 0) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#718096' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No attendance records found</div>
        <div style={{ fontSize: 14 }}>Try adjusting your date or class filter, or mark attendance below.</div>
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Admission No.</th>
            <th>Date</th>
            <th>Class</th>
            <th>Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => {
            const sc = STATUS_COLORS[record.status] || STATUS_COLORS.ABSENT;
            return (
              <tr key={record.id}>
                <td style={{ fontWeight: 600 }}>
                  {record.student ? `${record.student.user?.firstName || record.student.firstName || ''} ${record.student.user?.lastName || record.student.lastName || ''}`.trim() || '—' : '—'}
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                  {record.student?.admissionNumber || '—'}
                </td>
                <td>{record.date ? new Date(record.date).toLocaleDateString('en-ZA') : '—'}</td>
                <td>{record.className || record.class?.name || '—'}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: sc.color, background: sc.bg }}>
                    <StatusIcon status={record.status} />
                    {record.status}
                  </span>
                </td>
                <td style={{ color: '#718096', fontSize: 13 }}>{record.remarks || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MarkAttendanceTab({ classes, onMarked }) {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    classService.getStudents(selectedClassId)
      .then(data => {
        const list = data.data || data || [];
        const studentList = Array.isArray(list) ? list : [];
        setStudents(studentList);
        const initial = {};
        studentList.forEach(s => { initial[s.id] = 'PRESENT'; });
        setAttendanceMap(initial);
        setRemarksMap({});
      })
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedClassId]);

  const setStatus = (studentId, status) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const setRemarks = (studentId, text) => {
    setRemarksMap(prev => ({ ...prev, [studentId]: text }));
  };

  const markAll = status => {
    const updated = {};
    students.forEach(s => { updated[s.id] = status; });
    setAttendanceMap(updated);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    const records = students.map(s => ({
      studentId: s.id,
      status: attendanceMap[s.id] || 'PRESENT',
      remarks: remarksMap[s.id] || '',
    }));
    try {
      await attendanceService.markBulkAttendance(selectedClassId, selectedDate, records);
      const className = classes.find(c => c.id === selectedClassId)?.name || selectedClassId;
      setSaveMsg({ type: 'success', text: `Attendance saved for ${students.length} students in class ${className} on ${new Date(selectedDate).toLocaleDateString('en-ZA')}.` });
      if (onMarked) onMarked();
    } catch (err) {
      setSaveMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to save attendance. Please check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(v => v === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter(v => v === 'ABSENT').length;
  const otherCount = students.length - presentCount - absentCount;

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'flex-end', marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Class</label>
          <select className="form-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
            {classes.length === 0 && <option value="">No classes available</option>}
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Date</label>
          <input className="form-input" type="date" value={selectedDate} max={today} onChange={e => setSelectedDate(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="action-button" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => markAll('PRESENT')}>
            <Check size={13} /> All Present
          </button>
          <button type="button" className="action-button" style={{ padding: '8px 12px', fontSize: 13, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => markAll('ABSENT')}>
            <X size={13} /> All Absent
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Present', value: presentCount, color: '#10b981' },
          { label: 'Absent', value: absentCount, color: '#ef4444' },
          { label: 'Other', value: otherCount, color: '#f59e0b' },
          { label: 'Total', value: students.length, color: '#667eea' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '10px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {loadingStudents ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#718096' }}>⏳ Loading students…</div>
        ) : students.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#718096' }}>
            {selectedClassId ? 'No students found in this class.' : 'Select a class to mark attendance.'}
          </div>
        ) : students.map(student => {
          const status = attendanceMap[student.id] || 'PRESENT';
          const sc = STATUS_COLORS[status];
          const firstName = student.user?.firstName || student.firstName || '';
          const lastName = student.user?.lastName || student.lastName || '';
          return (
            <div key={student.id} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `2px solid ${sc.bg}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${sc.color},${sc.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                {firstName[0] || '?'}{lastName[0] || ''}
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 600, color: '#1a202c' }}>{firstName} {lastName}</div>
                <div style={{ fontSize: 12, color: '#a0aec0', fontFamily: 'monospace' }}>{student.admissionNumber}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ATTENDANCE_STATUSES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(student.id, s)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      border: `2px solid ${status === s ? STATUS_COLORS[s].color : 'rgba(102,126,234,0.15)'}`,
                      background: status === s ? STATUS_COLORS[s].bg : 'transparent',
                      color: status === s ? STATUS_COLORS[s].color : '#718096',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Remarks (optional)"
                value={remarksMap[student.id] || ''}
                onChange={e => setRemarks(student.id, e.target.value)}
                style={{ padding: '6px 10px', border: '2px solid rgba(102,126,234,0.15)', borderRadius: 8, fontSize: 13, outline: 'none', minWidth: 160, flex: '0 0 auto' }}
              />
            </div>
          );
        })}
      </div>

      {saveMsg && (
        <div style={{
          marginTop: 16, padding: '10px 14px', borderRadius: 8, fontSize: 14,
          background: saveMsg.type === 'success' ? '#f0fff4' : saveMsg.type === 'info' ? '#eff6ff' : '#fff5f5',
          color: saveMsg.type === 'success' ? '#276749' : saveMsg.type === 'info' ? '#1e40af' : '#c53030',
          border: `1px solid ${saveMsg.type === 'success' ? '#9ae6b4' : saveMsg.type === 'info' ? '#bfdbfe' : '#feb2b2'}`,
        }}>
          {saveMsg.text}
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="action-button primary" disabled={saving}>
          <UserCheck size={14} />
          {saving ? 'Saving…' : `Save Attendance (${students.length} students)`}
        </button>
      </div>
    </form>
  );
}

export default function AttendanceView() {
  const [activeTab, setActiveTab] = useState('records');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [filterDate, setFilterDate] = useState(today);
  const [filterClass, setFilterClass] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const PER_PAGE = 15;

  useEffect(() => {
    classService.getAll({ limit: 100 })
      .then(data => {
        const list = data.data || data || [];
        setClasses(Array.isArray(list) ? list : []);
      })
      .catch(() => setClasses([]));
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PER_PAGE };
      if (filterDate) params.date = filterDate;
      if (filterClass) params.classId = filterClass;
      const data = await attendanceService.getAll(params);
      const list = data.data || data.attendance || data || [];
      setRecords(Array.isArray(list) ? list : []);
      setTotalPages(data.pagination?.pages || data.totalPages || Math.ceil((data.pagination?.total || data.total || list.length) / PER_PAGE) || 1);
    } catch {
      setRecords([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, filterDate, filterClass]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track and manage daily learner attendance</p>
        </div>
        <button className="action-button primary" onClick={() => setActiveTab('mark')}>
          <Plus size={14} />
          Mark Attendance
        </button>
      </div>

      <AttendanceStatCards records={records} />

      <div className="data-table">
        <div className="table-header">
          <div className="content-tabs" style={{ marginBottom: 0, borderBottom: 'none', padding: 0 }}>
            {[
              { key: 'records', label: 'Records', icon: <BarChart3 size={14} /> },
              { key: 'mark', label: 'Mark Attendance', icon: <UserCheck size={14} /> },
            ].map(tab => (
              <button
                key={tab.key}
                className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'records' && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} style={{ color: '#a0aec0' }} />
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => { setFilterDate(e.target.value); setPage(1); }}
                  style={{ padding: '7px 10px', border: '2px solid rgba(102,126,234,0.2)', borderRadius: 8, fontSize: 14, outline: 'none' }}
                />
              </div>
              <select
                className="form-select"
                value={filterClass}
                onChange={e => { setFilterClass(e.target.value); setPage(1); }}
                style={{ padding: '7px 12px', width: 130, marginBottom: 0 }}
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                className="action-button"
                onClick={() => { setFilterDate(''); setFilterClass(''); setPage(1); }}
                style={{ padding: '7px 12px', fontSize: 13 }}
              >
                <Filter size={13} /> Clear
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: '0 0 8px' }}>
          {activeTab === 'records' ? (
            <>
              <AttendanceRecordsTab records={records} loading={loading} />
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid rgba(102,126,234,0.08)' }}>
                  <button className="action-button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: 14, color: '#718096' }}>Page {page} of {totalPages}</span>
                  <button className="action-button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '0 24px 24px' }}>
              <MarkAttendanceTab classes={classes} onMarked={() => { setActiveTab('records'); loadRecords(); }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
