import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Printer, ChevronDown, Users } from 'lucide-react';
import TimetableGrid from './TimetableGrid';
import TimetableEditorModal from './TimetableEditorModal';
import timetableService from '../../services/timetableService';
import classService from '../../services/classService';
import subjectService from '../../services/subjectService';
import teacherService from '../../services/teacherService';
import { DAY_MAP, DAYS } from './timetableConstants';

/**
 * TimetablePage - Admin timetable management page
 * Allows selecting a class, viewing/editing the full weekly timetable,
 * adding/removing slots with validation. Includes teacher schedule view.
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
  const [viewMode, setViewMode] = useState('class'); // 'class' or 'teacher'
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

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

  // Filtered slots based on view mode
  const filteredSlots = viewMode === 'teacher' && selectedTeacherId
    ? slots.filter(s => s.teacherId === selectedTeacherId)
    : selectedClassId
      ? slots.filter(s => s.classId === selectedClassId)
      : slots;

  // All slots (for conflict detection across all classes)
  const allSlots = slots;

  const handleCellClick = (dayOfWeek, periodNumber, slot) => {
    if (viewMode === 'teacher') return; // Read-only in teacher view
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

  const handleCheckConflicts = useCallback(async (params) => {
    if (!selectedTimetableId) return { conflicts: [], hasConflicts: false };
    return timetableService.checkConflicts(selectedTimetableId, params);
  }, [selectedTimetableId]);

  const handlePrint = () => {
    window.print();
  };

  // Teacher workload summary for teacher view
  const getTeacherWorkload = () => {
    if (!selectedTeacherId || viewMode !== 'teacher') return null;
    const teacherSlots = slots.filter(s => s.teacherId === selectedTeacherId);
    const uniqueClasses = new Set(teacherSlots.map(s => s.classId));
    const uniqueSubjects = new Set(teacherSlots.map(s => s.subjectId));
    const dailyLoad = {};
    teacherSlots.forEach(s => {
      const day = DAY_MAP[s.dayOfWeek] || `Day ${s.dayOfWeek}`;
      dailyLoad[day] = (dailyLoad[day] || 0) + 1;
    });
    return {
      totalPeriods: teacherSlots.length,
      freePeriods: 40 - teacherSlots.length,
      classCount: uniqueClasses.size,
      subjectCount: uniqueSubjects.size,
      dailyLoad,
    };
  };

  const teacherWorkload = getTeacherWorkload();

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
        <div style={{ display: 'flex', gap: '8px' }}>
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

      {/* View Mode Toggle */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        background: '#f1f5f9',
        borderRadius: '10px',
        padding: '4px',
        width: 'fit-content',
      }}>
        <button
          onClick={() => { setViewMode('class'); setSelectedTeacherId(''); }}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: viewMode === 'class' ? 'white' : 'transparent',
            color: viewMode === 'class' ? '#667eea' : '#64748b',
            boxShadow: viewMode === 'class' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          Class View
        </button>
        <button
          onClick={() => { setViewMode('teacher'); setSelectedClassId(''); }}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: viewMode === 'teacher' ? 'white' : 'transparent',
            color: viewMode === 'teacher' ? '#667eea' : '#64748b',
            boxShadow: viewMode === 'teacher' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Users size={14} /> Teacher Schedule
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

        {viewMode === 'class' && (
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
        )}

        {viewMode === 'teacher' && (
          <div style={{ flex: '1 1 200px' }}>
            <label style={labelStyle}>Teacher</label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select a teacher</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.user ? `${t.user.firstName} ${t.user.lastName}` : t.name || t.id}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </div>
        )}

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
        {viewMode === 'class' ? (
          [
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
          ))
        ) : teacherWorkload ? (
          [
            { label: 'Total Periods', value: teacherWorkload.totalPeriods, color: '#667eea' },
            { label: 'Free Periods', value: teacherWorkload.freePeriods, color: '#10b981' },
            { label: 'Classes', value: teacherWorkload.classCount, color: '#f59e0b' },
            { label: 'Subjects', value: teacherWorkload.subjectCount, color: '#8b5cf6' },
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
          ))
        ) : null}
      </div>

      {/* Teacher daily workload breakdown */}
      {viewMode === 'teacher' && teacherWorkload && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '12px', margin: '0 0 12px 0' }}>
            Daily Workload
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {DAYS.map((day) => {
              const count = teacherWorkload.dailyLoad[day] || 0;
              return (
                <div key={day} style={{
                  flex: '1 1 80px',
                  textAlign: 'center',
                  padding: '10px 8px',
                  borderRadius: '10px',
                  background: count > 6 ? '#fef2f2' : count > 0 ? '#f0f4ff' : '#f8fafc',
                  border: `1px solid ${count > 6 ? '#fee2e2' : count > 0 ? '#e0e7ff' : '#f1f5f9'}`,
                }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase' }}>{day.slice(0, 3)}</div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: count > 6 ? '#ef4444' : count > 0 ? '#667eea' : '#cbd5e1',
                  }}>{count}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>periods</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
        ) : viewMode === 'teacher' && !selectedTeacherId ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <Users size={32} style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '15px' }}>Select a teacher to view their schedule</p>
          </div>
        ) : (
          <TimetableGrid
            slots={filteredSlots}
            editable={viewMode === 'class' && !!selectedClassId}
            onCellClick={viewMode === 'class' && selectedClassId ? handleCellClick : undefined}
          />
        )}
      </div>

      {viewMode === 'class' && !selectedClassId && selectedTimetableId && (
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
        onCheckConflicts={handleCheckConflicts}
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
