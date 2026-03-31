import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Mock weekly timetable
const mockTimetable = {
  Monday: [
    { id: 1, subject: 'Mathematics', className: 'Grade 10A', startTime: '08:00', endTime: '09:00', room: 'Room 101' },
    { id: 2, subject: 'Mathematics', className: 'Grade 11B', startTime: '09:00', endTime: '10:00', room: 'Room 101' },
    { id: 3, subject: 'Physical Sciences', className: 'Grade 10A', startTime: '11:00', endTime: '12:00', room: 'Lab 2' },
  ],
  Tuesday: [
    { id: 4, subject: 'Mathematics', className: 'Grade 12A', startTime: '08:00', endTime: '09:00', room: 'Room 101' },
    { id: 5, subject: 'Mathematics', className: 'Grade 10A', startTime: '10:00', endTime: '11:00', room: 'Room 101' },
    { id: 6, subject: 'Physical Sciences', className: 'Grade 12A', startTime: '13:00', endTime: '14:00', room: 'Lab 2' },
  ],
  Wednesday: [
    { id: 7, subject: 'Mathematics', className: 'Grade 11B', startTime: '08:00', endTime: '09:00', room: 'Room 101' },
    { id: 8, subject: 'Mathematics', className: 'Grade 12A', startTime: '10:00', endTime: '11:00', room: 'Room 101' },
  ],
  Thursday: [
    { id: 9, subject: 'Mathematics', className: 'Grade 10A', startTime: '08:00', endTime: '09:00', room: 'Room 101' },
    { id: 10, subject: 'Physical Sciences', className: 'Grade 10A', startTime: '09:00', endTime: '10:00', room: 'Lab 2' },
    { id: 11, subject: 'Mathematics', className: 'Grade 11B', startTime: '13:00', endTime: '14:00', room: 'Room 101' },
  ],
  Friday: [
    { id: 12, subject: 'Mathematics', className: 'Grade 12A', startTime: '08:00', endTime: '09:00', room: 'Room 101' },
    { id: 13, subject: 'Physical Sciences', className: 'Grade 12A', startTime: '11:00', endTime: '12:00', room: 'Lab 2' },
  ],
};

const SUBJECT_COLORS = {
  Mathematics: '#667eea',
  'Physical Sciences': '#10b981',
  'Life Sciences': '#f59e0b',
  English: '#8b5cf6',
  History: '#ef4444',
  default: '#64748b',
};

function getColor(subject) {
  return SUBJECT_COLORS[subject] || SUBJECT_COLORS.default;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  // Monday = 0 offset
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
}

export default function TeacherTimetable({ user, onNavigate }) {
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [timetable, setTimetable] = useState(mockTimetable);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const teacherId = user?.teacherProfile?.id || user?.id;
  const todayName = DAYS[new Date().getDay() - 1]; // Mon=0

  useEffect(() => {
    if (!teacherId) return;
    setLoading(true);
    api.get(`/timetables`, { params: { teacherId } })
      .then(res => {
        const slots = res.data?.data || res.data || [];
        if (Array.isArray(slots) && slots.length > 0) {
          // Group by day
          const grouped = {};
          DAYS.forEach(d => { grouped[d] = []; });
          slots.forEach(slot => {
            const day = slot.dayOfWeek;
            if (grouped[day]) grouped[day].push(slot);
          });
          setTimetable(grouped);
        }
      })
      .catch(() => {/* use mock data */})
      .finally(() => setLoading(false));
  }, [teacherId]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };
  const goToday = () => setWeekStart(getWeekStart(new Date()));

  const getDayDate = (idx) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + idx);
    return formatDate(d);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Timetable</h1>
        <p className="page-subtitle">Your weekly teaching schedule</p>
      </div>

      {/* Week Navigator */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '16px 24px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <button className="action-button" onClick={prevWeek} style={{ padding: '8px' }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '16px', color: '#1a202c' }}>
          Week of {formatDate(weekStart)}
        </div>
        <button className="action-button" onClick={nextWeek} style={{ padding: '8px' }}>
          <ChevronRight size={18} />
        </button>
        <button className="action-button" onClick={goToday}>Today</button>
      </div>

      {/* Weekly Grid */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        {/* Header Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(5, 1fr)`,
          borderBottom: '2px solid rgba(102,126,234,0.1)',
        }}>
          {DAYS.map((day, idx) => (
            <div key={day} style={{
              padding: '16px',
              textAlign: 'center',
              background: day === todayName
                ? 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)'
                : 'rgba(102,126,234,0.02)',
              borderRight: idx < 4 ? '1px solid rgba(102,126,234,0.08)' : 'none',
            }}>
              <div style={{
                fontWeight: 700,
                color: day === todayName ? '#667eea' : '#1a202c',
                fontSize: '14px',
              }}>
                {DAY_SHORT[idx]}
              </div>
              <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
                {getDayDate(idx)}
              </div>
              {day === todayName && (
                <div style={{
                  display: 'inline-block',
                  marginTop: '4px',
                  padding: '2px 8px',
                  background: '#667eea',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                }}>
                  TODAY
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Slots Body */}
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#718096' }}>
            Loading timetable…
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(5, 1fr)`,
            minHeight: '400px',
          }}>
            {DAYS.map((day, idx) => (
              <div key={day} style={{
                padding: '12px',
                borderRight: idx < 4 ? '1px solid rgba(102,126,234,0.08)' : 'none',
                background: day === todayName ? 'rgba(102,126,234,0.01)' : 'white',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                {(timetable[day] || []).length === 0 ? (
                  <div style={{ padding: '20px 8px', textAlign: 'center', color: '#cbd5e0', fontSize: '13px' }}>
                    No classes
                  </div>
                ) : (
                  (timetable[day] || []).map(slot => {
                    const color = getColor(slot.subject);
                    return (
                      <div
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: `${color}12`,
                          borderLeft: `3px solid ${color}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ fontSize: '11px', color, fontWeight: 700, marginBottom: '4px' }}>
                          {slot.startTime} – {slot.endTime}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a202c', marginBottom: '2px' }}>
                          {slot.subject}
                        </div>
                        <div style={{ fontSize: '12px', color: '#718096' }}>{slot.className}</div>
                        {slot.room && (
                          <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '2px' }}>{slot.room}</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {Object.entries(SUBJECT_COLORS).filter(([k]) => k !== 'default').map(([subject, color]) => (
          <div key={subject} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4a5568' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color }} />
            {subject}
          </div>
        ))}
      </div>

      {/* Slot Detail Modal */}
      {selectedSlot && (
        <div className="modal-overlay" onClick={() => setSelectedSlot(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Class Details</h2>
              <button className="modal-close" onClick={() => setSelectedSlot(null)}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { label: 'Subject', value: selectedSlot.subject },
                { label: 'Class', value: selectedSlot.className },
                { label: 'Time', value: `${selectedSlot.startTime} – ${selectedSlot.endTime}` },
                { label: 'Room', value: selectedSlot.room || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(102,126,234,0.08)' }}>
                  <span style={{ fontWeight: 600, color: '#4a5568' }}>{label}</span>
                  <span style={{ color: '#1a202c' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button
                className="action-button primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { setSelectedSlot(null); onNavigate && onNavigate('myClasses'); }}
              >
                Go to Class
              </button>
              <button className="action-button" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSelectedSlot(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
