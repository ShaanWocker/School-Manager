import React, { useState, useEffect } from 'react';
import { Printer, RefreshCw, ChevronDown } from 'lucide-react';
import TimetableGrid from './TimetableGrid';
import timetableService from '../../services/timetableService';
import classService from '../../services/classService';

/**
 * ClassTimetablePage - Read-only timetable view for a specific class
 * Features printable layout and class selector.
 */
export default function ClassTimetablePage({ classId: propClassId }) {
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(propClassId || '');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('');

  // Load timetables and classes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [timetableRes, classRes] = await Promise.all([
          timetableService.getAll().catch(() => ({ data: [] })),
          classService.getAll().catch(() => ({ data: [] })),
        ]);
        const tt = timetableRes.data || timetableRes || [];
        const cl = classRes.data || classRes || [];
        setTimetables(Array.isArray(tt) ? tt : []);
        setClasses(Array.isArray(cl) ? cl : []);

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

  // Update class name when selection changes
  useEffect(() => {
    const cls = classes.find(c => c.id === selectedClassId);
    setClassName(cls ? `${cls.name}${cls.section ? ` (${cls.section})` : ''}` : '');
  }, [selectedClassId, classes]);

  // Load slots
  useEffect(() => {
    if (!selectedTimetableId || !selectedClassId) {
      setSlots([]);
      return;
    }
    const load = async () => {
      try {
        const res = await timetableService.getById(selectedTimetableId);
        const data = res.data || res;
        const allSlots = data?.slots || [];
        setSlots(allSlots.filter(s => s.classId === selectedClassId));
      } catch {
        setSlots([]);
      }
    };
    load();
  }, [selectedTimetableId, selectedClassId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#667eea' }} />
        <p style={{ color: '#64748b', marginTop: '12px' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Class Timetable</h1>
          <p className="page-subtitle">
            {className ? `Weekly schedule for ${className}` : 'Select a class to view the timetable'}
          </p>
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

      {/* Selectors */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'flex-end',
      }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={labelStyle}>Timetable</label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedTimetableId}
              onChange={(e) => setSelectedTimetableId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select timetable</option>
              {timetables.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} — Year {t.academicYear} Term {t.term}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={labelStyle}>Class</label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section ? `(${c.section})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {selectedClassId && selectedTimetableId ? (
          slots.length > 0 ? (
            <TimetableGrid slots={slots} editable={false} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <p style={{ fontSize: '15px' }}>No timetable slots found for this class.</p>
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <p style={{ fontSize: '15px' }}>Please select a timetable and class to view the schedule.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#64748b',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
};

const selectStyle = {
  width: '100%',
  padding: '10px 32px 10px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  color: '#1e293b',
  background: 'white',
  appearance: 'none',
  outline: 'none',
};
