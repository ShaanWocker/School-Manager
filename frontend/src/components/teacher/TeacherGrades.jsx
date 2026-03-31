import React, { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import teacherService from '../../services/teacherService';
import classService from '../../services/classService';
import gradeService from '../../services/gradeService';

const mockClasses = [
  { id: '1', name: 'Grade 10A – Mathematics', subject: 'Mathematics' },
  { id: '2', name: 'Grade 11B – Mathematics', subject: 'Mathematics' },
  { id: '3', name: 'Grade 12A – Mathematics', subject: 'Mathematics' },
  { id: '4', name: 'Grade 10A – Physical Sciences', subject: 'Physical Sciences' },
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

const ASSESSMENT_TYPES = ['Test', 'Assignment', 'Exam', 'Project', 'Practical', 'Other'];
const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];

function gradeColor(mark) {
  if (mark == null || mark === '') return '#718096';
  const n = parseFloat(mark);
  if (n >= 80) return '#10b981';
  if (n >= 60) return '#667eea';
  if (n >= 50) return '#f59e0b';
  return '#ef4444';
}

function gradeLabel(mark) {
  if (mark == null || mark === '') return '';
  const n = parseFloat(mark);
  if (n >= 80) return 'A';
  if (n >= 70) return 'B';
  if (n >= 60) return 'C';
  if (n >= 50) return 'D';
  return 'F';
}

export default function TeacherGrades({ user }) {
  const [classes, setClasses] = useState(mockClasses);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [assessmentType, setAssessmentType] = useState('Test');
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [maxMark, setMaxMark] = useState('100');
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const teacherId = user?.teacherProfile?.id || user?.id;

  useEffect(() => {
    if (!teacherId) return;
    teacherService.getClasses(teacherId)
      .then(res => {
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setClasses(list.map(c => ({ id: c.id, name: c.name || `${c.grade} – ${c.subject}`, subject: c.subject })));
        }
      })
      .catch(() => {/* use mock */});
  }, [teacherId]);

  useEffect(() => {
    if (!selectedClass) { setStudents([]); setMarks({}); return; }
    setLoadingStudents(true);
    classService.getStudents(selectedClass)
      .then(res => {
        const list = res?.data || res || [];
        setStudents(Array.isArray(list) && list.length > 0 ? list : mockStudents);
      })
      .catch(() => setStudents(mockStudents))
      .finally(() => setLoadingStudents(false));
  }, [selectedClass]);

  const handleMarkChange = (studentId, value) => {
    const max = parseFloat(maxMark) || 100;
    const num = parseFloat(value);
    if (value !== '' && (isNaN(num) || num < 0 || num > max)) return;
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  const classInfo = classes.find(c => c.id === selectedClass);

  const handleSave = async () => {
    if (!selectedClass || students.length === 0) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const gradeRecords = students
        .filter(s => marks[s.id] !== undefined && marks[s.id] !== '')
        .map(s => ({
          studentId: s.id,
          classId: selectedClass,
          subject: classInfo?.subject || '',
          term: selectedTerm,
          assessmentType,
          assessmentTitle: assessmentTitle || `${assessmentType} – ${selectedTerm}`,
          score: parseFloat(marks[s.id]),
          maxScore: parseFloat(maxMark) || 100,
        }));

      for (const record of gradeRecords) {
        await gradeService.create(record);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save grades. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const enteredCount = Object.values(marks).filter(v => v !== '' && v != null).length;
  const average = enteredCount > 0
    ? Math.round(Object.values(marks).filter(v => v !== '' && v != null).reduce((sum, v) => sum + parseFloat(v), 0) / enteredCount)
    : null;
  const max = parseFloat(maxMark) || 100;
  const averagePercent = average != null ? Math.round((average / max) * 100) : null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Grades</h1>
        <p className="page-subtitle">Enter and manage student grades</p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
      }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Class</label>
          <select className="form-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">— Select class —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Term</label>
          <select className="form-select" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
            {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Assessment Type</label>
          <select className="form-select" value={assessmentType} onChange={e => setAssessmentType(e.target.value)}>
            {ASSESSMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Assessment Title</label>
          <input
            className="form-input"
            placeholder={`${assessmentType} title`}
            value={assessmentTitle}
            onChange={e => setAssessmentTitle(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Max Mark</label>
          <input
            type="number"
            className="form-input"
            value={maxMark}
            min="1"
            max="1000"
            onChange={e => setMaxMark(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', color: '#c53030', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {saved && (
        <div style={{
          padding: '16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '8px', color: '#065f46', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
        }}>
          <Check size={18} />
          Grades saved successfully!
        </div>
      )}

      {!selectedClass ? (
        <div style={{ textAlign: 'center', padding: '64px', color: '#718096' }}>
          Select a class to start entering grades
        </div>
      ) : loadingStudents ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#718096' }}>Loading students…</div>
      ) : (
        <>
          {/* Summary */}
          {enteredCount > 0 && (
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { label: 'Grades Entered', value: enteredCount, color: '#667eea' },
                { label: 'Class Average', value: `${average}/${max}`, color: gradeColor(averagePercent) },
                { label: 'Average %', value: `${averagePercent}%`, color: gradeColor(averagePercent) },
              ].map(item => (
                <div key={item.label} style={{
                  padding: '12px 20px', borderRadius: '12px', background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <span style={{ fontSize: '22px', fontWeight: 700, color: item.color }}>{item.value}</span>
                  <span style={{ fontSize: '13px', color: '#718096' }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="data-table">
            <div className="table-header">
              <h3 className="table-title">
                {classInfo?.name} — {assessmentType} ({selectedTerm})
              </h3>
              <button className="action-button primary" onClick={handleSave} disabled={saving || enteredCount === 0}>
                <Save size={14} />
                {saving ? 'Saving…' : 'Save Grades'}
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Mark (out of {maxMark})</th>
                  <th>Percentage</th>
                  <th>Symbol</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => {
                  const mark = marks[s.id];
                  const pct = mark !== '' && mark != null ? Math.round((parseFloat(mark) / (parseFloat(maxMark) || 100)) * 100) : null;
                  return (
                    <tr key={s.id}>
                      <td style={{ color: '#718096' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max={maxMark}
                          step="0.5"
                          className="form-input"
                          style={{ width: '100px', padding: '8px 12px' }}
                          placeholder={`0–${maxMark}`}
                          value={mark ?? ''}
                          onChange={e => handleMarkChange(s.id, e.target.value)}
                        />
                      </td>
                      <td>
                        {pct != null ? (
                          <span style={{ fontWeight: 700, color: gradeColor(pct) }}>{pct}%</span>
                        ) : '—'}
                      </td>
                      <td>
                        {pct != null ? (
                          <span className={`badge ${pct >= 80 ? 'success' : pct >= 50 ? 'info' : 'danger'}`}>
                            {gradeLabel(pct)}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="action-button primary" onClick={handleSave} disabled={saving || enteredCount === 0} style={{ padding: '12px 32px' }}>
              <Save size={14} />
              {saving ? 'Saving…' : 'Save Grades'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
