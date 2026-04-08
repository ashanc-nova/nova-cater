export const SCHEDULED_TIME_KEYS = [
  'selectedTimeSlot',
  'selectedTimeSlotId',
  'selectedTimeSlot_pickup',
  'selectedTimeSlot_delivery',
  'selectedTimeSlotId_pickup',
  'selectedTimeSlotId_delivery',
];

export const clearScheduledTimeSelection = () => {
  SCHEDULED_TIME_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
};