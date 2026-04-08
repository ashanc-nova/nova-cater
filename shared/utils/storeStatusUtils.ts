import type { StoreStatus } from '../../types/restaurant';

const getYmdInTimeZone = (date: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';

  return `${year}-${month}-${day}`;
};

export const getNextStoreTimeLabel = (
  storeStatus?: StoreStatus | null,
  isRestaurantClosed?: Boolean | null
): string => {
  if (!storeStatus) return '';

  const action = isRestaurantClosed ? 'Opens' : 'Closes';
  const isoTime = isRestaurantClosed ? storeStatus.nextOpeningTime : storeStatus.nextClosingTime;

  if (!isoTime) return '';

  const timeZone = storeStatus.timeZone || 'Asia/Kolkata';
  const targetDate = new Date(isoTime);
  const now = new Date();

  const isSameDay = getYmdInTimeZone(targetDate, timeZone) === getYmdInTimeZone(now, timeZone);

  const timeText = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).format(targetDate);

  if (isSameDay) return `${action} ${timeText}`;

  const dateText = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    // minute: '2-digit',
    day: 'numeric',
    timeZone,
  }).format(targetDate);

  return `${action} ${dateText}, ${timeText}`;
};
