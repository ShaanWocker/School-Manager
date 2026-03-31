import React, { useState, useEffect } from 'react';
import { Check, X, Clock, CheckSquare } from 'lucide-react';
import teacherService from '../../services/teacherService';
import attendanceService from '../../services/attendanceService';
import classService from '../../services/classService';

const mockClasses = [
  { id: '1', name: 'Grade 10A – Mathematics' },
  { id: '2', name: 'Grade 11B – Mathematics' },
  { id: '3', name: 'Grade 12A – Mathematics' },
  { id: '4', name: 'Grade 10A – Physical Sciences' },
];

const mockStudents = [
  { id: 's1', firstName: 'Sipho', lastName: 'Ndlovu' },
  { id: 's2', firstName: 'Ayanda', lastName: 'Dlamini' },
  { id: 's3', firstName: 'Thabo', lastName: 'Mokoena' },
  { id: 's4', firstName: 'Nomsa', lastName: 'Khumalo' },
  { id: 's5', firstName: 'Lungelo', lastName: 'Zulu' },
  { id: 's6', firstName: 'Zanele', lastName: 'Sithole' },
  { id: 's7', firstName: 'Bongani', lastName: 'Nkosi' },
];

const STATUS = { PRESENT: 'present', ABSENT: 'absent', LATE: 'late' };

const STATUS_CONFIG = {
  present: { label: 'Present', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: Check },
  absent: { label: 'Absent', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: X },
  late: { label: 'Late', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function TeacherAttendance({ user }) {
  const [classes, setClasses] = useState(mockClasses);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(today());
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const teacherId = user?.teacherProfile?.id || user?.id;

  // Load teacher's classes
  useEffect(() => {
    if (!teacherId) return;
    teacherService.getClasses(teacherId)
      .then(res => {
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setClasses(list.map(c => ({
            id: c.id,
            name: c.name || `${c.grade} – ${c.subject}`,
          })));
        }
      })
      .catch(() => {/* use mock */});
  }, [teacherId]);

  // Load students when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setAttendance({});
      return;
    }
    setLoadingStudents(true);
    setError('');
    classService.getStudents(selectedClass)
      .then(res => {
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setStudents(list);
        } else {
          setStudents(mockStudents);
        }
      })
      .catch(() => setStudents(mockStudents))
      .finally(() => {
        setLoadingStudents(false);
        // Load existing attendance for this class/date
        attendanceService.getClassAttendance(selectedClass, selectedDate)
          .then(res => {
            const records = res?.data || res || [];
            if (Array.isArray(records)) {
              const map = {};
              records.forEach(r => { map[r.studentId] = r.status?.toLowerCase() || STATUS.PRESENT; });
              setAttendance(map);
            }
          })
          .catch(() => {/* no existing record */});
      });
  }, [selectedClass, selectedDate]);

  const markAll = (status) => {
    const map = {};
    students.forEach(s => { map[s.id] = status; });
    setAttendance(map);
  };

  const toggle = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const getStatus = (studentId) => attendance[studentId] || STATUS.PRESENT;

  const handleSave = async () => {
    if (!selectedClass || students.length === 0) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        status: (getStatus(s.id) || STATUS.PRESENT).toUpperCase(),
      }));
      await attendanceService.markBulkAttendance(selectedClass, selectedDate, records);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const summary = {
    present: students.filter(s => getStatus(s.id) === STATUS.PRESENT).length,
    absent: students.filter(s => getStatus(s.id) === STATUS.ABSENT).length,
    late: students.filter(s => getStatus(s.id) === STATUS.LATE).length,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mark Attendance</h1>
        <p className="page-subtitle">Record daily student attendance for your classes</p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr auto',
        gap: '16px',
        alignItems: 'end',
      }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Class</label>
          <select
            className="form-select"
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            <option value="">— Select a class —</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-input"
            value={selectedDate}
            max={today()}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
        <button
          className="action-button primary"
          onClick={() => markAll(STATUS.PRESENT)}
          disabled={!selectedClass || students.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
        >
          <CheckSquare size={14} />
          Mark All Present
        </button>
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

      {saved && (
        <div style={{
          padding: '16px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '8px',
          color: '#065f46',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
        }}>
          <Check size={18} />
          Attendance saved successfully!
        </div>
      )}

      {!selectedClass ? (
        <div style={{ textAlign: 'center', padding: '64px', color: '#718096' }}>
          Select a class to start marking attendance
        </div>
      ) : loadingStudents ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#718096' }}>
          Loading students…
        </div>
      ) : (
        <>
          {/* Summary Bar */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} style={{
                padding: '12px 20px',
                borderRadius: '12px',
                background: cfg.bg,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
              }}>
                <cfg.icon size={18} color={cfg.color} />
                <span style={{ fontWeight: 700, color: cfg.color, fontSize: '18px' }}>{summary[key]}</span>
                <span style={{ color: cfg.color, fontSize: '13px' }}>{cfg.label}</span>
              </div>
            ))}
          </div>

          {/* Student Attendance Table */}
          <div className="data-table">
            <div className="table-header">
              <h3 className="table-title">Students ({students.length})</h3>
              <button
                className="action-button primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Attendance'}
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th style={{ textAlign: 'center' }}>Present</th>
                  <th style={{ textAlign: 'center' }}>Absent</th>
                  <th style={{ textAlign: 'center' }}>Late</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => {
                  const status = getStatus(s.id);
                  return (
                    <tr key={s.id}>
                      <td style={{ color: '#718096' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                        {s.email && <div style={{ fontSize: '12px', color: '#718096' }}>{s.email}</div>}
                      </td>
                      {[STATUS.PRESENT, STATUS.ABSENT, STATUS.LATE].map(st => {
                        const cfg = STATUS_CONFIG[st];
                        const active = status === st;
                        return (
                          <td key={st} style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => toggle(s.id, st)}
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                border: `2px solid ${active ? cfg.color : '#e2e8f0'}`,
                                background: active ? cfg.bg : 'transparent',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s',
                              }}
                              title={cfg.label}
                            >
                              <cfg.icon size={16} color={active ? cfg.color : '#cbd5e0'} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="action-button primary"
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '12px 32px' }}
            >
              {saving ? 'Saving…' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
