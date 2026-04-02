import React from 'react';
import TimetableCell from './TimetableCell';
import { DAYS, DAY_SHORT, DAY_MAP, DEFAULT_PERIODS as SHARED_DEFAULT_PERIODS } from './timetableConstants';

/**
 * TimetableGrid - Reusable weekly timetable grid
 * Rows = periods (1–8), Columns = days (Mon–Fri)
 *
 * @param {Object} props
 * @param {Array} props.slots - Array of timetable slot objects
 * @param {boolean} props.editable - Allow editing (admin mode)
 * @param {Function} props.onCellClick - Handler when cell is clicked: (dayOfWeek, periodNumber, slot?) => void
 * @param {number} props.periodsPerDay - Number of periods per day (default 8)
 * @param {Array} props.periods - Custom period definitions [{number, startTime, endTime}]
 */
export default function TimetableGrid({
  slots = [],
  editable = false,
  onCellClick,
  periodsPerDay = 8,
  periods: customPeriods,
}) {
  const periods = customPeriods || SHARED_DEFAULT_PERIODS.slice(0, periodsPerDay);

  // Build a lookup: { "dayOfWeek-periodNumber": slot }
  const slotMap = {};
  slots.forEach(slot => {
    const dayName = typeof slot.dayOfWeek === 'number' ? DAY_MAP[slot.dayOfWeek] : slot.dayOfWeek;
    const key = `${dayName}-${slot.periodNumber}`;
    slotMap[key] = slot;
  });

  const isBreakAfter = (periodNum) => periodNum === 3 || periodNum === 6;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '4px',
        minWidth: '700px',
      }}>
        <thead>
          <tr>
            <th style={{
              width: '80px',
              padding: '10px 8px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Period
            </th>
            {DAYS.map((day, idx) => {
              const isToday = new Date().getDay() === idx + 1;
              return (
                <th key={day} style={{
                  padding: '10px 8px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isToday ? '#667eea' : '#334155',
                  background: isToday ? '#f0f4ff' : 'transparent',
                  borderRadius: '8px',
                }}>
                  <span style={{ display: 'block' }}>{DAY_SHORT[idx]}</span>
                  <span style={{
                    display: 'none',
                    fontSize: '11px',
                    fontWeight: 400,
                    color: '#94a3b8',
                  }}>
                    {day}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <React.Fragment key={period.number}>
              <tr>
                <td style={{
                  padding: '6px 8px',
                  textAlign: 'center',
                  verticalAlign: 'top',
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}>
                  <div style={{ fontWeight: 600, color: '#334155' }}>P{period.number}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {period.startTime}–{period.endTime}
                  </div>
                </td>
                {DAYS.map((day) => {
                  const key = `${day}-${period.number}`;
                  const slot = slotMap[key];
                  const dayIdx = DAYS.indexOf(day) + 1;
                  return (
                    <td key={key} style={{ padding: '2px', verticalAlign: 'top' }}>
                      <TimetableCell
                        slot={slot}
                        editable={editable}
                        onClick={
                          onCellClick
                            ? () => onCellClick(dayIdx, period.number, slot || null)
                            : undefined
                        }
                      />
                    </td>
                  );
                })}
              </tr>
              {isBreakAfter(period.number) && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      fontSize: '11px',
                      color: '#94a3b8',
                      padding: '4px 0',
                      fontStyle: 'italic',
                    }}
                  >
                    {period.number === 3 ? '— Break —' : '— Lunch Break —'}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
