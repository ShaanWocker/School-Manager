import React from 'react';
import { Plus } from 'lucide-react';
import { getSubjectColor } from './timetableConstants';

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
  const className = slot.class?.name || slot.className || '';
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
      title={`${subjectName}${className ? ` — ${className}` : ''}${teacherName ? ` — ${teacherName}` : ''}${room ? ` (${room})` : ''}`}
    >
      <span style={{ fontWeight: 600, fontSize: '13px', color: color, lineHeight: 1.2 }}>
        {subjectName}
      </span>
      {className && (
        <span style={{ fontSize: '11px', color: '#475569', fontWeight: 500, lineHeight: 1.2 }}>
          {className}
        </span>
      )}
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
