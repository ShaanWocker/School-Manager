import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Edit2, Trash2, Save, AlertCircle, AlertTriangle } from 'lucide-react';
import { DAYS_LABEL, DEFAULT_PERIODS, getDefaultTime, getSubjectColor } from './timetableConstants';

/**
 * PeriodSlotsPanel - Modal panel for managing all class allocations for one period.
 *
 * Clicking any cell in the timetable grid opens this panel for the selected
 * day + period. It shows every class currently scheduled at that period,
 * lets admins add new allocations, and lets them edit or remove existing ones.
 * Multiple classes can be allocated to the same period simultaneously because
 * a school runs many classes in parallel.
 *
 * @param {boolean}  props.open              - Whether the panel is visible
 * @param {Function} props.onClose           - Close handler
 * @param {Function} props.onSave            - Save handler: (slotData) => Promise
 * @param {Function} props.onDelete          - Delete handler: (slotId) => Promise
 * @param {Function} [props.onCheckConflicts] - Server-side conflict check
 * @param {number}   props.dayOfWeek         - Day of week (1 = Monday … 5 = Friday)
 * @param {number}   props.periodNumber      - Period number (1–8)
 * @param {Array}    props.periodSlots       - Existing slots for this day+period
 * @param {Array}    props.subjects          - Available subjects
 * @param {Array}    props.teachers          - Available teachers
 * @param {Array}    props.classes           - Available classes
 * @param {Array}    props.allSlots          - All timetable slots (conflict detection)
 */
export default function PeriodSlotsPanel({
  open,
  onClose,
  onSave,
  onDelete,
  onCheckConflicts,
  dayOfWeek,
  periodNumber,
  periodSlots = [],
  subjects = [],
  teachers = [],
  classes = [],
  allSlots = [],
}) {
  const [editingSlot, setEditingSlot] = useState(null); // null → adding new
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [room, setRoom] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);

  const period = DEFAULT_PERIODS.find(p => p.number === periodNumber);

  // Reset to "add new" state whenever the panel opens
  useEffect(() => {
    if (open) {
      setEditingSlot(null);
      resetForm();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate form fields when the editing target changes
  useEffect(() => {
    if (editingSlot) {
      setSubjectId(editingSlot.subjectId || '');
      setTeacherId(editingSlot.teacherId || '');
      setClassId(editingSlot.classId || '');
      setRoom(editingSlot.room || '');
    } else {
      resetForm();
    }
    setErrors([]);
    setWarnings([]);
  }, [editingSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetForm() {
    setSubjectId('');
    setTeacherId('');
    setClassId('');
    setRoom('');
    setErrors([]);
    setWarnings([]);
  }

  // Real-time conflict detection
  const checkConflictsRealTime = useCallback(async (currentTeacherId, currentClassId, currentRoom) => {
    if (!currentTeacherId || !currentClassId) {
      setWarnings([]);
      return;
    }

    const excludeId = editingSlot?.id;
    const clientWarnings = [];

    const teacherConflict = allSlots.find(
      s => s.teacherId === currentTeacherId &&
        s.dayOfWeek === dayOfWeek &&
        s.periodNumber === periodNumber &&
        s.id !== excludeId
    );
    if (teacherConflict) {
      const teacherObj = teachers.find(t => t.id === currentTeacherId);
      const name = teacherObj?.user
        ? `${teacherObj.user.firstName} ${teacherObj.user.lastName}`
        : 'This teacher';
      clientWarnings.push(`${name} is already scheduled at this period.`);
    }

    const classConflict = allSlots.find(
      s => s.classId === currentClassId &&
        s.dayOfWeek === dayOfWeek &&
        s.periodNumber === periodNumber &&
        s.id !== excludeId
    );
    if (classConflict) {
      const cls = classes.find(c => c.id === currentClassId);
      clientWarnings.push(`${cls?.name || 'This class'} already has a slot at this period.`);
    }

    if (currentRoom) {
      const roomConflict = allSlots.find(
        s => s.room &&
          s.room.toLowerCase() === currentRoom.toLowerCase() &&
          s.dayOfWeek === dayOfWeek &&
          s.periodNumber === periodNumber &&
          s.id !== excludeId
      );
      if (roomConflict) {
        clientWarnings.push(`Room "${currentRoom}" is already occupied at this period.`);
      }
    }

    if (onCheckConflicts && clientWarnings.length === 0) {
      try {
        const result = await onCheckConflicts({
          teacherId: currentTeacherId,
          classId: currentClassId,
          dayOfWeek,
          periodNumber,
          room: currentRoom || null,
          excludeSlotId: excludeId || null,
        });
        if (result.hasConflicts) {
          setWarnings(result.conflicts.map(c => c.message));
          return;
        }
      } catch {
        // Fall back to client-side check
      }
    }

    setWarnings(clientWarnings);
  }, [allSlots, classes, dayOfWeek, periodNumber, editingSlot, teachers, onCheckConflicts]);

  useEffect(() => {
    if (open && teacherId) {
      checkConflictsRealTime(teacherId, classId, room);
    } else if (open) {
      setWarnings([]);
    }
  }, [open, teacherId, classId, room, checkConflictsRealTime]);

  if (!open) return null;

  const isEditing = !!editingSlot;

  const handleSave = async () => {
    const newErrors = [];
    if (!subjectId) newErrors.push('Please select a subject.');
    if (!teacherId) newErrors.push('Please select a teacher.');
    if (!classId) newErrors.push('Please select a class.');
    if (warnings.length > 0) newErrors.push(...warnings);
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await onSave({
        id: editingSlot?.id,
        dayOfWeek,
        periodNumber,
        subjectId,
        teacherId,
        classId,
        room: room || null,
        startTime: editingSlot?.startTime || getDefaultTime(periodNumber, 'start'),
        endTime: editingSlot?.endTime || getDefaultTime(periodNumber, 'end'),
      });
      setEditingSlot(null);
    } catch (err) {
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

  const handleDelete = async (slotId) => {
    setSaving(true);
    try {
      await onDelete(slotId);
      if (editingSlot?.id === slotId) {
        setEditingSlot(null);
      }
    } catch {
      setErrors(['Failed to delete. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  const editingClassName = isEditing
    ? (periodSlots.find(s => s.id === editingSlot?.id)?.class?.name || 'Slot')
    : null;

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
        maxWidth: '640px',
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
              Period {periodNumber} — {DAYS_LABEL[dayOfWeek]}
            </h3>
            {period && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                {period.startTime} – {period.endTime}
              </p>
            )}
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

        {/* Current Allocations */}
        <div style={{ padding: '16px 24px 0' }}>
          <h4 style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 10px',
          }}>
            Scheduled Classes ({periodSlots.length})
          </h4>

          {periodSlots.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '14px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #f1f5f9',
            }}>
              No classes scheduled for this period yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {periodSlots.map((slot) => {
                const subjectName = slot.subject?.name || '';
                const teacherName = slot.teacher?.user
                  ? `${slot.teacher.user.firstName} ${slot.teacher.user.lastName}`
                  : '';
                const className = slot.class?.name || '';
                const color = getSubjectColor(subjectName);
                const isCurrentlyEditing = editingSlot?.id === slot.id;

                return (
                  <div
                    key={slot.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${isCurrentlyEditing ? color : '#e2e8f0'}`,
                      background: isCurrentlyEditing ? `${color}10` : '#fafbfc',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: '4px',
                      height: '36px',
                      borderRadius: '4px',
                      background: color,
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                        {className}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {subjectName}
                        {teacherName ? ` · ${teacherName}` : ''}
                        {slot.room ? ` · ${slot.room}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={() => isCurrentlyEditing ? setEditingSlot(null) : setEditingSlot(slot)}
                        disabled={saving}
                        title={isCurrentlyEditing ? 'Cancel edit' : 'Edit this slot'}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          background: isCurrentlyEditing ? '#e0e7ff' : 'white',
                          color: isCurrentlyEditing ? '#4f46e5' : '#667eea',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(slot.id)}
                        disabled={saving}
                        title="Remove this slot"
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #fee2e2',
                          background: '#fef2f2',
                          color: '#ef4444',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add / Edit Form */}
        <div style={{ padding: '16px 24px 24px' }}>
          <h4 style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '16px 0 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            {isEditing ? (
              <><Edit2 size={13} /> Edit: {editingClassName}</>
            ) : (
              <><Plus size={13} /> Add New Allocation</>
            )}
          </h4>

          {/* Conflict warnings */}
          {warnings.length > 0 && errors.length === 0 && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              marginBottom: '12px',
            }}>
              {warnings.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < warnings.length - 1 ? '4px' : 0 }}>
                  <AlertTriangle size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#92400e' }}>{w}</span>
                </div>
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              marginBottom: '12px',
            }}>
              {errors.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < errors.length - 1 ? '4px' : 0 }}>
                  <AlertCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#b91c1c' }}>{e}</span>
                </div>
              ))}
            </div>
          )}

          {/* Two-column form grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Class *</label>
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.section ? ` (${c.section})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Subject *</label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Teacher *</label>
              <select
                value={teacherId}
                onChange={e => setTeacherId(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select teacher</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.user ? `${t.user.firstName} ${t.user.lastName}` : t.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Room (optional)</label>
              <input
                type="text"
                value={room}
                onChange={e => setRoom(e.target.value)}
                placeholder="e.g. Room 101"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Form actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            {isEditing && (
              <button
                onClick={() => setEditingSlot(null)}
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
            )}
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
              {isEditing ? (
                <><Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}</>
              ) : (
                <><Plus size={14} /> {saving ? 'Adding...' : 'Add Allocation'}</>
              )}
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
