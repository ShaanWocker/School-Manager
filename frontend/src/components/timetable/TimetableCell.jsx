import React from 'react';
import { Plus } from 'lucide-react';

const SUBJECT_COLORS = {
  Mathematics: '#667eea',
  'Physical Sciences': '#10b981',
  'Life Sciences': '#f59e0b',
  English: '#8b5cf6',
  Afrikaans: '#ec4899',
  History: '#ef4444',
  Geography: '#06b6d4',
  'Life Orientation': '#14b8a6',
  'Business Studies': '#f97316',
  Accounting: '#6366f1',
  Economics: '#84cc16',
  'Information Technology': '#0ea5e9',
  'Computer Applications Technology': '#0ea5e9',
  default: '#64748b',
};

function getSubjectColor(subjectName) {
  if (!subjectName) return SUBJECT_COLORS.default;
  const key = Object.keys(SUBJECT_COLORS).find(
    k => subjectName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? SUBJECT_COLORS[key] : SUBJECT_COLORS.default;
}

/**
 * TimetableCell - Displays a single timetable slot or an empty add button
 * @param {Object} props
 * @param {Object|null} props.slot - The timetable slot data
 * @param {boolean} props.editable - Whether the cell can be edited
 * @param {Function} props.onClick - Click handler for the cell
 */
export default function TimetableCell({ slot, editable = false, onClick }) {
  if (!slot) {
    return (
      <div
        onClick={editable ? onClick : undefined}
        style={{
          minHeight: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: editable ? 'pointer' : 'default',
          borderRadius: '8px',
          border: editable ? '2px dashed #e2e8f0' : '1px solid #f1f5f9',
          background: editable ? '#fafbfc' : '#f8fafc',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          if (editable) {
            e.currentTarget.style.borderColor = '#667eea';
            e.currentTarget.style.background = '#f0f4ff';
          }
        }}
        onMouseLeave={e => {
          if (editable) {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.background = '#fafbfc';
          }
        }}
        title={editable ? 'Add slot' : ''}
      >
        {editable && (
          <span style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={14} /> Add
          </span>
        )}
      </div>
    );
  }

  const subjectName = slot.subject?.name || slot.subjectName || '';
  const teacherName = slot.teacher?.user
    ? `${slot.teacher.user.firstName} ${slot.teacher.user.lastName}`
    : slot.teacherName || '';
  const room = slot.room || '';
  const color = getSubjectColor(subjectName);

  return (
    <div
      onClick={onClick}
      style={{
        minHeight: '72px',
        padding: '8px 10px',
        borderRadius: '8px',
        background: `${color}15`,
        borderLeft: `4px solid ${color}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      title={`${subjectName}${teacherName ? ` — ${teacherName}` : ''}${room ? ` (${room})` : ''}`}
    >
      <span style={{ fontWeight: 600, fontSize: '13px', color: color, lineHeight: 1.2 }}>
        {subjectName}
      </span>
      {teacherName && (
        <span style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.2 }}>
          {teacherName}
        </span>
      )}
      {room && (
        <span style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.2 }}>
          {room}
        </span>
      )}
    </div>
  );
}
