/**
 * Utility functions for time operations in the TimePicker component
 */

export interface TimeValue {
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
}

/**
 * Format time to HH:MM AM/PM
 */
export const formatTime = (hour: number, minute: number, period: 'AM' | 'PM'): string => {
  const formattedHour = String(hour).padStart(2, '0');
  const formattedMinute = String(minute).padStart(2, '0');
  return `${formattedHour}:${formattedMinute} ${period}`;
};

/**
 * Parse time string HH:MM AM/PM to TimeValue
 */
export const parseTime = (timeString: string): TimeValue | null => {
  const regex = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i;
  const match = timeString.match(regex);

  if (!match) return null;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase() as 'AM' | 'PM';

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

  return { hour, minute, period };
};

/**
 * Convert 12-hour format to 24-hour format
 */
export const to24Hour = (hour: number, period: 'AM' | 'PM'): number => {
  if (period === 'AM') {
    return hour === 12 ? 0 : hour;
  } else {
    return hour === 12 ? 12 : hour + 12;
  }
};

/**
 * Convert 24-hour format to 12-hour format
 */
export const to12Hour = (hour24: number): { hour: number; period: 'AM' | 'PM' } => {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour = hour24 % 12 || 12;
  return { hour, period };
};

/**
 * Get angle for clock hand based on hour (0-11)
 */
export const getHourAngle = (hour: number): number => {
  return (hour % 12) * 30; // 360 / 12 = 30 degrees per hour
};

/**
 * Get angle for clock hand based on minute (0-59)
 */
export const getMinuteAngle = (minute: number): number => {
  return minute * 6; // 360 / 60 = 6 degrees per minute
};

/**
 * Get hour from angle
 */
export const getHourFromAngle = (angle: number): number => {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  const hour = Math.round(normalizedAngle / 30) % 12;
  return hour === 0 ? 12 : hour;
};

/**
 * Get minute from angle
 */
export const getMinuteFromAngle = (angle: number): number => {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  return Math.round(normalizedAngle / 6) % 60;
};

/**
 * Calculate angle from center point
 */
export const calculateAngle = (centerX: number, centerY: number, pointX: number, pointY: number): number => {
  const deltaX = pointX - centerX;
  const deltaY = pointY - centerY;
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  return (angle + 90 + 360) % 360; // Adjust so 0 degrees is at top
};

/**
 * Get position on circle for clock numbers
 */
export const getClockNumberPosition = (hour: number, radius: number): { x: number; y: number } => {
  const angle = (hour * 30 - 90) * (Math.PI / 180); // Convert to radians, -90 to start from top
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle)
  };
};


/**
 * Get current date and time in a specific timezone
 * @param timeZone - IANA timezone string (e.g., 'America/New_York')
 * @returns Object with date components in the specified timezone
 */
export const getCurrentDateTimeInTimezone = (timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => {
    const part = parts.find((p) => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
  };
};

/**
 * Check if a date string (MM/DD/YYYY) is today in a specific timezone
 * @param dateString - Date in MM/DD/YYYY format
 * @param timeZone - IANA timezone string
 * @returns true if the date is today in the specified timezone
 */
export const isTodayInTimezone = (dateString: string, timeZone: string): boolean => {
  if (!dateString || !timeZone) return false;

  const parts = dateString.split('/');
  if (parts.length !== 3) return false;

  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(month) || isNaN(day) || isNaN(year)) return false;

  const current = getCurrentDateTimeInTimezone(timeZone);
  return (
    year === current.year &&
    month === current.month &&
    day === current.day
  );
};

/**
 * Check if a time (hour, minute, period) is in the past for today in a specific timezone
 * @param hour - Hour in 12-hour format (1-12)
 * @param minute - Minute (0-59)
 * @param period - AM or PM
 * @param timeZone - IANA timezone string
 * @returns true if the time is in the past for today
 */
export const isTimeInPast = (
  hour: number,
  minute: number,
  period: 'AM' | 'PM',
  timeZone: string
): boolean => {
  if (!timeZone) return false;

  // Validate inputs
  if (hour < 1 || hour > 12) return false;
  if (minute < 0 || minute > 59) return false;

  const current = getCurrentDateTimeInTimezone(timeZone);
  const hour24 = to24Hour(hour, period);
  const currentHour24 = current.hour;

  // Compare hours first
  if (hour24 < currentHour24) return true;
  if (hour24 > currentHour24) return false;

  // Same hour, compare minutes
  // Disable only times that are strictly in the past (minute < current.minute)
  // Enable current minute and future minutes (minute >= current.minute)
  // Example: current time 1:36 PM, minutes 00-35 are disabled, minutes 36-59 are enabled
  // Example: current time 12:02 PM, minutes 00-01 are disabled, minutes 02-59 are enabled
  return minute < current.minute;
};

/**
 * Check if an hour should be disabled (all minutes in that hour are in the past)
 * An hour is disabled only if the last minute (59) of that hour is in the past
 * @param hour - Hour in 12-hour format (1-12)
 * @param period - AM or PM
 * @param selectedDate - Date in MM/DD/YYYY format (optional)
 * @param timeZone - IANA timezone string (optional)
 * @returns true if the hour should be disabled
 */
export const isHourDisabled = (
  hour: number,
  period: 'AM' | 'PM',
  selectedDate?: string,
  timeZone?: string
): boolean => {
  // Only validate if both date and timezone are provided
  if (!selectedDate || !timeZone) return false;

  // Only validate for today's date
  if (!isTodayInTimezone(selectedDate, timeZone)) return false;

  // Check if the last minute (59) of this hour is in the past
  // If minute 59 is in the past, then the entire hour is in the past
  return isTimeInPast(hour, 59, period, timeZone);
};

/**
 * Check if a time value is disabled (in the past) for a given date and timezone
 * @param hour - Hour in 12-hour format (1-12)
 * @param minute - Minute (0-59)
 * @param period - AM or PM
 * @param selectedDate - Date in MM/DD/YYYY format (optional)
 * @param timeZone - IANA timezone string (optional)
 * @returns true if the time should be disabled
 */
export const isTimeDisabled = (
  hour: number,
  minute: number,
  period: 'AM' | 'PM',
  selectedDate?: string,
  timeZone?: string
): boolean => {
  // Only validate if both date and timezone are provided
  if (!selectedDate || !timeZone) return false;

  // Only validate for today's date
  if (!isTodayInTimezone(selectedDate, timeZone)) return false;

  // Check if time is in the past
  return isTimeInPast(hour, minute, period, timeZone);
};

