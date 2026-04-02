import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Printer, ChevronDown } from 'lucide-react';
import TimetableGrid from './TimetableGrid';
import TimetableEditorModal from './TimetableEditorModal';
import timetableService from '../../services/timetableService';
import classService from '../../services/classService';
import subjectService from '../../services/subjectService';
import teacherService from '../../services/teacherService';

/**
 * TimetablePage - Admin timetable management page
 * Allows selecting a class, viewing/editing the full weekly timetable,
 * adding/removing slots with validation.
 */
export default function TimetablePage() {
  // Data
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [slots, setSlots] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState(1);
  const [modalPeriod, setModalPeriod] = useState(1);
  const [modalSlot, setModalSlot] = useState(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [timetableRes, classRes, subjectRes, teacherRes] = await Promise.all([
          timetableService.getAll().catch(() => ({ data: [] })),
          classService.getAll().catch(() => ({ data: [] })),
          subjectService.getAll().catch(() => ({ data: [] })),
          teacherService.getAll().catch(() => ({ data: [] })),
        ]);
        const tt = timetableRes.data || timetableRes || [];
        const cl = classRes.data || classRes || [];
        const su = subjectRes.data || subjectRes || [];
        const te = teacherRes.data || teacherRes || [];
        setTimetables(Array.isArray(tt) ? tt : []);
        setClasses(Array.isArray(cl) ? cl : []);
        setSubjects(Array.isArray(su) ? su : []);
        setTeachers(Array.isArray(te) ? te : []);

        // Auto-select first timetable
        if (Array.isArray(tt) && tt.length > 0) {
          setSelectedTimetableId(tt[0].id);
        }
      } catch {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load slots when timetable or class changes
  const loadSlots = useCallback(async () => {
    if (!selectedTimetableId) {
      setSlots([]);
      return;
    }
    try {
      const res = await timetableService.getById(selectedTimetableId);
      const data = res.data || res;
      const allSlots = data?.slots || [];
      setSlots(allSlots);
    } catch {
      setSlots([]);
    }
  }, [selectedTimetableId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // Filtered slots for the selected class
  const filteredSlots = selectedClassId
    ? slots.filter(s => s.classId === selectedClassId)
    : slots;

  // All slots (for conflict detection across all classes)
  const allSlots = slots;

  const handleCellClick = (dayOfWeek, periodNumber, slot) => {
    setModalDay(dayOfWeek);
    setModalPeriod(periodNumber);
    setModalSlot(slot);
    setModalOpen(true);
  };

  const handleSave = async (slotData) => {
    if (!selectedTimetableId) return;
    if (!selectedClassId) {
      throw new Error('Please select a class first.');
    }
    const payload = {
      ...slotData,
      classId: selectedClassId,
    };

    if (slotData.id) {
      await timetableService.updateSlot(selectedTimetableId, slotData.id, payload);
    } else {
      await timetableService.addSlot(selectedTimetableId, payload);
    }
    await loadSlots();
  };

  const handleDelete = async (slotId) => {
    if (!selectedTimetableId) return;
    await timetableService.deleteSlot(selectedTimetableId, slotId);
    await loadSlots();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#667eea' }} />
        <p style={{ color: '#64748b', marginTop: '12px' }}>Loading timetable data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Timetable Management</h1>
          <p className="page-subtitle">Create and manage class timetables</p>
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

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: '#fef2f2',
          border: '1px solid #fee2e2',
          color: '#b91c1c',
          fontSize: '14px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

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
              <option value="">All classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section ? `(${c.section})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>

        <button
          onClick={loadSlots}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            border: 'none',
            borderRadius: '8px',
            background: '#667eea',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Total Slots', value: filteredSlots.length, color: '#667eea' },
          { label: 'Free Periods', value: Math.max(0, 40 - filteredSlots.length), color: '#10b981' },
          { label: 'Teachers', value: new Set(filteredSlots.map(s => s.teacherId)).size, color: '#f59e0b' },
          { label: 'Subjects', value: new Set(filteredSlots.map(s => s.subjectId)).size, color: '#8b5cf6' },
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

      {/* Timetable Grid */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {!selectedTimetableId ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <Plus size={32} style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '15px' }}>Select a timetable to get started</p>
          </div>
        ) : (
          <TimetableGrid
            slots={filteredSlots}
            editable={!!selectedClassId}
            onCellClick={selectedClassId ? handleCellClick : undefined}
          />
        )}
      </div>

      {!selectedClassId && selectedTimetableId && (
        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
          Select a class to enable editing
        </p>
      )}

      {/* Editor Modal */}
      <TimetableEditorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        slot={modalSlot}
        dayOfWeek={modalDay}
        periodNumber={modalPeriod}
        subjects={subjects}
        teachers={teachers}
        allSlots={allSlots}
        classId={selectedClassId}
      />
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
