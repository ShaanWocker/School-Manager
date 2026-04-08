import React from 'react';
import { Plus } from 'lucide-react';
import { getSubjectColor } from './timetableConstants';

/**
 * TimetableCell - Displays one or more timetable slots (parallel classes) or an empty add button
 * @param {Object} props
 * @param {Array} props.slots - Array of timetable slot objects for this cell
 * @param {Object|null} props.slot - Single timetable slot (legacy, used if slots not provided)
 * @param {boolean} props.editable - Whether the cell can be edited
 * @param {Function} props.onClick - Click handler: (slot?) => void
 */
export default function TimetableCell({ slots: slotsProp, slot: singleSlot, editable = false, onClick }) {
  // Support both new array-based prop and legacy single-slot prop
  const slots = slotsProp && slotsProp.length > 0
    ? slotsProp
    : singleSlot
      ? [singleSlot]
      : [];

  if (slots.length === 0) {
    return (
      <div
        onClick={editable ? () => onClick && onClick(null) : undefined}
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

  const isMulti = slots.length > 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {slots.map((slot) => {
        const subjectName = slot.subject?.name || slot.subjectName || '';
        const teacherName = slot.teacher?.user
          ? `${slot.teacher.user.firstName} ${slot.teacher.user.lastName}`
          : slot.teacherName || '';
        const className = slot.class?.name || slot.className || '';
        const room = slot.room || '';
        const color = getSubjectColor(subjectName);

        return (
          <div
            key={slot.id || `${slot.classId}-${slot.subjectId}`}
            onClick={() => onClick && onClick(slot)}
            style={{
              minHeight: isMulti ? '56px' : '72px',
              padding: isMulti ? '6px 8px' : '8px 10px',
              borderRadius: '8px',
              background: `${color}15`,
              borderLeft: `4px solid ${color}`,
              cursor: onClick ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '1px',
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
            title={`${subjectName}${className ? ` \u2014 ${className}` : ''}${teacherName ? ` \u2014 ${teacherName}` : ''}${room ? ` (${room})` : ''}`}
          >
            <span style={{ fontWeight: 600, fontSize: isMulti ? '12px' : '13px', color: color, lineHeight: 1.2 }}>
              {subjectName}
            </span>
            {className && (
              <span style={{ fontSize: isMulti ? '10px' : '11px', color: '#475569', fontWeight: 500, lineHeight: 1.2 }}>
                {className}
              </span>
            )}
            {teacherName && (
              <span style={{ fontSize: isMulti ? '10px' : '11px', color: '#64748b', lineHeight: 1.2 }}>
                {teacherName}
              </span>
            )}
            {room && (
              <span style={{ fontSize: isMulti ? '10px' : '11px', color: '#94a3b8', lineHeight: 1.2 }}>
                {room}
              </span>
            )}
          </div>
        );
      })}
      {editable && (
        <div
          onClick={() => onClick && onClick(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '6px',
            border: '1px dashed #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#667eea';
            e.currentTarget.style.background = '#f0f4ff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.background = 'transparent';
          }}
          title="Add another class to this period"
        >
          <span style={{ color: '#94a3b8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Plus size={12} /> Add
          </span>
        </div>
      )}
    </div>
  );
}
