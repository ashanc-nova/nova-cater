/**
 * Utility functions for date operations in the DatePicker component
 */

export interface CalendarDate {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  fullDate: Date;
}

/**
 * Get the number of days in a month
 */
export const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Get the first day of the month (0-6, where 0 is Sunday)
 */
export const getFirstDayOfMonth = (month: number, year: number): number => {
  return new Date(year, month, 1).getDay();
};

/**
 * Get month name from month number
 */
export const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Generate calendar grid for a given month and year
 * Returns array of 42 dates (6 weeks) to fill the calendar grid
 */
export const generateCalendarDates = (
  month: number,
  year: number,
  selectedDate: Date | null
): CalendarDate[] => {
  const dates: CalendarDate[] = [];
  const firstDay = getFirstDayOfMonth(month, year);
  const daysInMonth = getDaysInMonth(month, year);
  const today = new Date();

  // Adjust firstDay to make Monday the first day (0) instead of Sunday
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  // Get previous month days
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);

  // Add previous month dates
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i;
    const fullDate = new Date(prevYear, prevMonth, date);
    dates.push({
      date,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      isSelected: selectedDate ? isSameDay(fullDate, selectedDate) : false,
      isToday: isSameDay(fullDate, today),
      fullDate
    });
  }

  // Add current month dates
  for (let date = 1; date <= daysInMonth; date++) {
    const fullDate = new Date(year, month, date);
    dates.push({
      date,
      month,
      year,
      isCurrentMonth: true,
      isSelected: selectedDate ? isSameDay(fullDate, selectedDate) : false,
      isToday: isSameDay(fullDate, today),
      fullDate
    });
  }

  // Add next month dates to fill the grid (42 cells = 6 weeks)
  const remainingCells = 42 - dates.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  for (let date = 1; date <= remainingCells; date++) {
    const fullDate = new Date(nextYear, nextMonth, date);
    dates.push({
      date,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      isSelected: selectedDate ? isSameDay(fullDate, selectedDate) : false,
      isToday: isSameDay(fullDate, today),
      fullDate
    });
  }

  return dates;
};

/**
 * Format date to MM/DD/YYYY
 */
export const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

/**
 * Parse date string MM/DD/YYYY to Date object
 */
export const parseDate = (dateString: string): Date | null => {
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const month = parseInt(parts[0], 10) - 1;
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
  if (month < 0 || month > 11) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month, day);
  return date;
};

