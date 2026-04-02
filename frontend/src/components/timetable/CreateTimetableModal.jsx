import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

/**
 * CreateTimetableModal - Modal for creating a new timetable
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is visible
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onCreate - Create handler: (timetableData) => Promise
 */
export default function CreateTimetableModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
  const [term, setTerm] = useState(1);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (open) {
      setName('');
      setAcademicYear(new Date().getFullYear());
      setTerm(1);
      setEffectiveFrom('');
      setEffectiveTo('');
      setErrors([]);
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  const validate = () => {
    const newErrors = [];
    if (!name.trim()) newErrors.push('Name is required.');
    if (!academicYear || academicYear < 2000) newErrors.push('Valid academic year (2000+) is required.');
    if (!term || term < 1 || term > 4) newErrors.push('Term must be between 1 and 4.');
    if (!effectiveFrom) newErrors.push('Effective from date is required.');
    if (effectiveTo && effectiveFrom && new Date(effectiveTo) <= new Date(effectiveFrom)) {
      newErrors.push('Effective to date must be after effective from date.');
    }
    return newErrors;
  };

  const handleCreate = async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await onCreate({
        name: name.trim(),
        academicYear: parseInt(academicYear, 10),
        term: parseInt(term, 10),
        effectiveFrom: new Date(effectiveFrom).toISOString(),
        effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : null,
      });
      onClose();
    } catch (err) {
      const serverErrors = err?.response?.data?.errors;
      if (Array.isArray(serverErrors)) {
        setErrors(serverErrors.map(e => e.msg || e.message || String(e)));
      } else {
        setErrors([err?.response?.data?.message || 'Failed to create timetable. Please try again.']);
      }
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
              Create Timetable
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Set up a new timetable for a term
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

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Timetable Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 2026 Term 1 Timetable"
              style={inputStyle}
            />
          </div>

          {/* Academic Year & Term (side by side) */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Academic Year *</label>
              <input
                type="number"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                min="2000"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Term *</label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                style={selectStyle}
              >
                <option value={1}>Term 1</option>
                <option value={2}>Term 2</option>
                <option value={3}>Term 3</option>
                <option value={4}>Term 4</option>
              </select>
            </div>
          </div>

          {/* Effective From */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Effective From *</label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Effective To */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Effective To (optional)</label>
            <input
              type="date"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
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
          justifyContent: 'flex-end',
          gap: '8px',
        }}>
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
            onClick={handleCreate}
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
            <Save size={14} /> {saving ? 'Creating...' : 'Create Timetable'}
          </button>
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
