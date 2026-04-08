import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Trash2, AlertCircle, AlertTriangle } from 'lucide-react';
import { DAYS_LABEL, getDefaultTime } from './timetableConstants';

/**
 * TimetableEditorModal - Modal for creating/editing a timetable slot
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is visible
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSave - Save handler: (slotData) => void
 * @param {Function} props.onDelete - Delete handler: (slotId) => void
 * @param {Object|null} props.slot - Existing slot data (null for new)
 * @param {number} props.dayOfWeek - Day of week (1-5)
 * @param {number} props.periodNumber - Period number (1-8)
 * @param {Array} props.subjects - Available subjects [{ id, name, code }]
 * @param {Array} props.teachers - Available teachers [{ id, user: { firstName, lastName } }]
 * @param {Array} props.classes - Available classes [{ id, name, section }]
 * @param {Array} props.allSlots - All slots for conflict detection
 * @param {string} props.classId - Pre-selected class ID (optional, used as default)
 * @param {Function} [props.onCheckConflicts] - API-based conflict checker: ({teacherId, classId, dayOfWeek, periodNumber, room, excludeSlotId}) => Promise
 */
export default function TimetableEditorModal({
  open,
  onClose,
  onSave,
  onDelete,
  slot,
  dayOfWeek,
  periodNumber,
  subjects = [],
  teachers = [],
  classes = [],
  allSlots = [],
  classId: defaultClassId,
  onCheckConflicts,
}) {
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [room, setRoom] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    if (open) {
      if (slot) {
        setSubjectId(slot.subjectId || '');
        setTeacherId(slot.teacherId || '');
        setClassId(slot.classId || defaultClassId || '');
        setRoom(slot.room || '');
      } else {
        setSubjectId('');
        setTeacherId('');
        setClassId(defaultClassId || '');
        setRoom('');
      }
      setErrors([]);
      setWarnings([]);
    }
  }, [open, slot, defaultClassId]);

  // Real-time conflict detection when teacher, room, or class changes
  const checkConflictsRealTime = useCallback(async (currentTeacherId, currentRoom) => {
    if (!currentTeacherId || !classId) {
      setWarnings([]);
      return;
    }

    // Client-side check (fast, immediate feedback)
    const clientWarnings = [];

    const teacherConflict = allSlots.find(
      s =>
        s.teacherId === currentTeacherId &&
        s.dayOfWeek === dayOfWeek &&
        s.periodNumber === periodNumber &&
        (!slot || s.id !== slot.id)
    );
    if (teacherConflict) {
      const teacherObj = teachers.find(t => t.id === currentTeacherId);
      const teacherLabel = teacherObj?.user
        ? `${teacherObj.user.firstName} ${teacherObj.user.lastName}`
        : 'This teacher';
      clientWarnings.push(`${teacherLabel} is already assigned at ${DAYS_LABEL[dayOfWeek]} Period ${periodNumber}.`);
    }

    const classConflict = allSlots.find(
      s =>
        s.classId === classId &&
        s.dayOfWeek === dayOfWeek &&
        s.periodNumber === periodNumber &&
        (!slot || s.id !== slot.id)
    );
    if (classConflict) {
      clientWarnings.push(`This class already has a slot at ${DAYS_LABEL[dayOfWeek]} Period ${periodNumber}.`);
    }

    if (currentRoom) {
      const roomConflict = allSlots.find(
        s =>
          s.room &&
          s.room.toLowerCase() === currentRoom.toLowerCase() &&
          s.dayOfWeek === dayOfWeek &&
          s.periodNumber === periodNumber &&
          (!slot || s.id !== slot.id)
      );
      if (roomConflict) {
        clientWarnings.push(`Room "${currentRoom}" is already occupied at ${DAYS_LABEL[dayOfWeek]} Period ${periodNumber}.`);
      }
    }

    // If we have an API conflict checker, also validate server-side
    if (onCheckConflicts && clientWarnings.length === 0) {
      try {
        const result = await onCheckConflicts({
          teacherId: currentTeacherId,
          classId,
          dayOfWeek,
          periodNumber,
          room: currentRoom || null,
          excludeSlotId: slot?.id || null,
        });
        if (result.hasConflicts) {
          const serverWarnings = result.conflicts.map(c => c.message);
          setWarnings(serverWarnings);
          return;
        }
      } catch {
        // If API check fails, rely on client-side check only
      }
    }

    setWarnings(clientWarnings);
  }, [allSlots, classId, dayOfWeek, periodNumber, slot, teachers, onCheckConflicts]);

  // Trigger real-time check on teacher/room/class changes
  useEffect(() => {
    if (open && teacherId) {
      checkConflictsRealTime(teacherId, room);
    }
  }, [open, teacherId, room, classId, checkConflictsRealTime]);

  if (!open) return null;

  const validate = () => {
    const newErrors = [];
    if (!subjectId) newErrors.push('Please select a subject.');
    if (!teacherId) newErrors.push('Please select a teacher.');
    if (!classId) newErrors.push('Please select a class.');

    // Include any active warnings as errors to prevent saving
    if (warnings.length > 0) {
      newErrors.push(...warnings);
    }

    return newErrors;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await onSave({
        id: slot?.id,
        dayOfWeek,
        periodNumber,
        subjectId,
        teacherId,
        classId,
        room: room || null,
        startTime: slot?.startTime || getDefaultTime(periodNumber, 'start'),
        endTime: slot?.endTime || getDefaultTime(periodNumber, 'end'),
      });
      onClose();
    } catch (err) {
      // Handle server-side conflict response (409)
      const serverConflicts = err?.response?.data?.conflicts;
      if (serverConflicts && Array.isArray(serverConflicts)) {
        setErrors(serverConflicts.map(c => c.message));
      } else {
        setErrors([err?.response?.data?.message || 'Failed to save. Please try again.']);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slot?.id) return;
    setSaving(true);
    try {
      await onDelete(slot.id);
      onClose();
    } catch {
      setErrors(['Failed to delete. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
              {slot ? 'Edit Slot' : 'Add Slot'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              {DAYS_LABEL[dayOfWeek]} — Period {periodNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#94a3b8',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Real-time conflict warnings */}
          {warnings.length > 0 && errors.length === 0 && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              marginBottom: '16px',
            }}>
              {warnings.map((warn, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < warnings.length - 1 ? '6px' : 0 }}>
                  <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#92400e' }}>{warn}</span>
                </div>
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              marginBottom: '16px',
            }}>
              {errors.map((err, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < errors.length - 1 ? '6px' : 0 }}>
                  <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#b91c1c' }}>{err}</span>
                </div>
              ))}
            </div>
          )}

          {/* Subject */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Subject *</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select a subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Class *</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select a class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section ? `(${c.section})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Teacher *</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select a teacher</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.user ? `${t.user.firstName} ${t.user.lastName}` : t.name || t.id}
                </option>
              ))}
            </select>
          </div>

          {/* Room */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Room (optional)</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Room 101, Lab 2"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: slot ? 'space-between' : 'flex-end',
          gap: '8px',
        }}>
          {slot && (
            <button
              onClick={handleDelete}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                background: '#fef2f2',
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              <Trash2 size={14} /> Remove
            </button>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
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
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                border: 'none',
                borderRadius: '8px',
                background: saving ? '#94a3b8' : '#667eea',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#334155',
  marginBottom: '6px',
};

const selectStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  color: '#1e293b',
  background: 'white',
  outline: 'none',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  color: '#1e293b',
  outline: 'none',
  boxSizing: 'border-box',
};
