import React, { useState, useEffect } from 'react';
import { RefreshCw, Printer, Clock } from 'lucide-react';
import TimetableGrid from './TimetableGrid';
import timetableService from '../../services/timetableService';
import { DAY_MAP } from './timetableConstants';

/**
 * TeacherTimetablePage - Shows timetable slots assigned to a specific teacher
 * Read-only weekly grid view with summary stats.
 *
 * @param {Object} props
 * @param {Object} props.user - Current user object
 */
export default function TeacherTimetablePage({ user }) {
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const teacherId = user?.teacherProfile?.id || user?.id;
  const teacherName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`
    : 'Teacher';

  // Load timetables
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await timetableService.getAll().catch(() => ({ data: [] }));
        const tt = res.data || res || [];
        setTimetables(Array.isArray(tt) ? tt : []);
        if (Array.isArray(tt) && tt.length > 0) {
          setSelectedTimetableId(tt[0].id);
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load teacher's slots
  useEffect(() => {
    if (!selectedTimetableId || !teacherId) {
      setSlots([]);
      return;
    }
    const load = async () => {
      try {
        const res = await timetableService.getById(selectedTimetableId);
        const data = res.data || res;
        const allSlots = data?.slots || [];
        setSlots(allSlots.filter(s => s.teacherId === teacherId));
      } catch {
        setSlots([]);
      }
    };
    load();
  }, [selectedTimetableId, teacherId]);

  // Today's schedule
  // JavaScript getDay(): 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
  const todayDayOfWeek = new Date().getDay();
  const todaySlots = slots
    .filter(s => s.dayOfWeek === todayDayOfWeek)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  // Free periods (out of 40 = 8 periods × 5 days)
  const freePeriods = Math.max(0, 40 - slots.length);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#667eea' }} />
        <p style={{ color: '#64748b', marginTop: '12px' }}>Loading your timetable...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">My Timetable</h1>
          <p className="page-subtitle">Weekly teaching schedule for {teacherName}</p>
        </div>
        <button
          onClick={handlePrint}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: 'white',
            color: '#64748b',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Printer size={14} /> Print
        </button>
      </div>

      {/* Timetable selector (if multiple) */}
      {timetables.length > 1 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '12px 20px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Timetable
          </label>
          <select
            value={selectedTimetableId}
            onChange={(e) => setSelectedTimetableId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              color: '#1e293b',
              marginTop: '4px',
              outline: 'none',
            }}
          >
            {timetables.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} — Year {t.academicYear} Term {t.term}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Summary stats */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Total Classes', value: slots.length, color: '#667eea' },
          { label: 'Free Periods', value: freePeriods, color: '#10b981' },
          {
            label: "Today's Classes",
            value: todayDayOfWeek >= 1 && todayDayOfWeek <= 5 ? todaySlots.length : '—',
            color: '#f59e0b'
          },
          {
            label: 'Unique Subjects',
            value: new Set(slots.map(s => s.subjectId)).size,
            color: '#8b5cf6'
          },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: '1 1 120px',
            background: 'white',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{stat.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Today's schedule (quick view) */}
      {todayDayOfWeek >= 1 && todayDayOfWeek <= 5 && todaySlots.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} style={{ color: '#667eea' }} />
            Today — {DAY_MAP[todayDayOfWeek]}
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {todaySlots.map(slot => (
              <div key={slot.id} style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#f0f4ff',
                borderLeft: '3px solid #667eea',
                fontSize: '13px',
              }}>
                <span style={{ fontWeight: 600, color: '#667eea' }}>
                  P{slot.periodNumber}
                </span>
                {' '}
                <span style={{ color: '#334155' }}>
                  {slot.subject?.name || 'Subject'}
                </span>
                {' — '}
                <span style={{ color: '#64748b' }}>
                  {slot.class?.name || 'Class'}
                </span>
                {slot.room && (
                  <span style={{ color: '#94a3b8' }}> ({slot.room})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Weekly Grid */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {slots.length > 0 ? (
          <TimetableGrid slots={slots} editable={false} />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <p style={{ fontSize: '15px' }}>No timetable slots assigned yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
