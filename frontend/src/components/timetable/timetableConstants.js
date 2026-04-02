/**
 * Timetable Constants
 * Shared configuration for the timetable module (South African school system)
 */

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
export const DAY_MAP = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
export const DAYS_LABEL = DAY_MAP;

/**
 * Default period definitions for a South African school day (8 periods)
 * Break after period 3, lunch break after period 6
 */
export const DEFAULT_PERIODS = [
  { number: 1, startTime: '07:30', endTime: '08:20' },
  { number: 2, startTime: '08:20', endTime: '09:10' },
  { number: 3, startTime: '09:10', endTime: '10:00' },
  { number: 4, startTime: '10:30', endTime: '11:20' },
  { number: 5, startTime: '11:20', endTime: '12:10' },
  { number: 6, startTime: '12:10', endTime: '13:00' },
  { number: 7, startTime: '13:30', endTime: '14:20' },
  { number: 8, startTime: '14:20', endTime: '15:10' },
];

/**
 * Get default start/end time for a given period number
 * @param {number} periodNumber - Period number (1-8)
 * @param {'start'|'end'} type - Whether to get start or end time
 * @returns {string} Time in HH:MM format
 */
export function getDefaultTime(periodNumber, type) {
  const period = DEFAULT_PERIODS.find(p => p.number === periodNumber);
  if (period) {
    return type === 'start' ? period.startTime : period.endTime;
  }
  return type === 'start' ? '08:00' : '09:00';
}

/**
 * Subject color mapping for visual distinction in the timetable
 */
export const SUBJECT_COLORS = {
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

/**
 * Get color for a subject name (partial match supported)
 * @param {string} subjectName - Subject name
 * @returns {string} Hex color string
 */
export function getSubjectColor(subjectName) {
  if (!subjectName) return SUBJECT_COLORS.default;
  const key = Object.keys(SUBJECT_COLORS).find(
    k => subjectName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? SUBJECT_COLORS[key] : SUBJECT_COLORS.default;
}
