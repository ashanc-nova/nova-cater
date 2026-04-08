import type { ItemMetadata } from '../../features/menu/types/menu';

/**
 * Get current order type and time slot from localStorage
 */
export const getCurrentOrderContext = (): {
  orderType: 'pickup' | 'delivery' | null;
  timeSlotId: string | null;
  isScheduled: boolean;
  scheduledDateTime?: Date;
} => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      orderType: null,
      timeSlotId: null,
      isScheduled: false,
      scheduledDateTime: undefined,
    };
  }
  // Check fulfillment type
  const fulfillmentTab = localStorage.getItem('activeTab') || 'pickup';
  const orderType = fulfillmentTab === 'delivery' ? 'delivery' : 'pickup';

  // Check for scheduled time slot
  const pickupSlotId = localStorage.getItem('selectedTimeSlotId_pickup');
  const deliverySlotId = localStorage.getItem('selectedTimeSlotId_delivery');

  // Get scheduled date/time if available (format: ISO string)
  const pickupSlotDateTime = localStorage.getItem('selectedTimeSlotDateTime_pickup');
  const deliverySlotDateTime = localStorage.getItem('selectedTimeSlotDateTime_delivery');

  const timeSlotId = orderType === 'pickup' ? pickupSlotId : deliverySlotId;
  const timeSlotDateTime = orderType === 'pickup' ? pickupSlotDateTime : deliverySlotDateTime;
  const isScheduled = !!timeSlotId;

  return {
    orderType,
    timeSlotId,
    isScheduled,
    scheduledDateTime: timeSlotDateTime ? new Date(timeSlotDateTime) : undefined,
  };
};

/**
 * Check if a specific date/time falls within a scheduled time slot window
 */
const isDateTimeInScheduleSlot = (
  scheduledTime: {
    day: string;
    startTime: string;
    endTime: string;
  },
  checkDateTime: Date
): boolean => {
  const checkDay = checkDateTime.toLocaleDateString('en-US', { weekday: 'long' });

  // Check if day matches
  if (scheduledTime.day !== checkDay) {
    return false;
  }

  // Parse time strings (format: "HH:mm")
  const [startHour, startMin] = scheduledTime.startTime.split(':').map(Number);
  const [endHour, endMin] = scheduledTime.endTime.split(':').map(Number);

  const checkMinutes = checkDateTime.getHours() * 60 + checkDateTime.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Check if the selected time falls within the availability window
  return checkMinutes >= startMinutes && checkMinutes <= endMinutes;
};

/**
 * Check if current time falls within scheduled time slot (for "Now" orders)
 */
const isTimeInScheduleSlot = (scheduledTime: {
  day: string;
  startTime: string;
  endTime: string;
}): boolean => {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

  // Check if current day matches
  if (scheduledTime.day !== currentDay) {
    return false;
  }

  // Parse time strings (format: "HH:mm")
  const [startHour, startMin] = scheduledTime.startTime.split(':').map(Number);
  const [endHour, endMin] = scheduledTime.endTime.split(':').map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

/**
 * Check if menu item is available based on menu scheduling
 * Returns true if item is UNAVAILABLE (to match the pattern of isItemOutOfStock)
 */
export const isMenuSchedulingUnavailable = (metadata?: ItemMetadata): boolean => {
  // If no metadata or no menuScheduling, item is available (no scheduling restriction)
  if (!metadata?.menuScheduling) {
    return false;
  }

  const { menuScheduling } = metadata;

  // If no schedulerDetails array or empty, item is available everywhere
  if (!menuScheduling.schedulerDetails || menuScheduling.schedulerDetails.length === 0) {
    return false;
  }

  // Get current context
  const { orderType, timeSlotId, isScheduled, scheduledDateTime } = getCurrentOrderContext();

  if (!orderType) {
    return false; // No order type, assume available
  }

  // For "Now" orders (no scheduled slot)
  if (!isScheduled) {
    // Check if current time falls within any scheduled time across all schedulerDetails
    const isAvailableNow = menuScheduling.schedulerDetails.some((schedulerDetail) =>
      schedulerDetail.scheduledTimes?.some((scheduledTime) => isTimeInScheduleSlot(scheduledTime))
    );

    // If item has scheduling restrictions and current time is NOT in those times
    return !isAvailableNow;
  }

  // For scheduled orders - check both ID match AND time window match
  if (isScheduled && timeSlotId) {
    // First, try direct ID match
    const hasIdMatch = menuScheduling.schedulerDetails.some((schedulerDetail) =>
      schedulerDetail.scheduledTimes?.some((scheduledTime) => scheduledTime._id === timeSlotId)
    );

    if (hasIdMatch) {
      return false; // Item is available (exact match)
    }

    // If no ID match but we have scheduledDateTime, check if selected time falls in any availability window
    if (scheduledDateTime) {
      const isAvailableAtScheduledTime = menuScheduling.schedulerDetails.some((schedulerDetail) =>
        schedulerDetail.scheduledTimes?.some((scheduledTime) =>
          isDateTimeInScheduleSlot(scheduledTime, scheduledDateTime)
        )
      );

      // If the scheduled date/time falls within an availability window, item is available
      return !isAvailableAtScheduledTime;
    }

    // No ID match and no valid scheduledDateTime - item is unavailable
    return true;
  }

  // Default: item is available
  return false;
};

/**
 * Get the next available time for a menu item
 * Returns formatted string based on scheduling context
 */
export const getNextAvailableTime = (metadata?: ItemMetadata): string | null => {
  if (
    !metadata?.menuScheduling?.schedulerDetails ||
    metadata.menuScheduling.schedulerDetails.length === 0
  ) {
    return null;
  }

  const now = new Date();

  // Flatten all scheduledTimes from all schedulerDetails
  const allScheduledTimes = metadata.menuScheduling.schedulerDetails.flatMap(
    (detail) => detail.scheduledTimes || []
  );

  const { isScheduled, scheduledDateTime } = getCurrentOrderContext();

  // Sort schedules by day and time
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Determine the reference date and day index
  const referenceDate = scheduledDateTime || now;
  const referenceDay = referenceDate.toLocaleDateString('en-US', { weekday: 'long' });
  const referenceDayIndex = dayOrder.indexOf(referenceDay);
  const referenceMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  // Find next available time
  let nextSlot: {
    day: string;
    startTime: string;
    dayIndex: number;
    daysFromReference: number;
  } | null = null;

  // Check reference day's remaining slots first
  const todaySlots = allScheduledTimes
    .filter((slot) => slot.day === referenceDay)
    .map((slot) => {
      const [hour, min] = slot.startTime.split(':').map(Number);
      return {
        ...slot,
        minutes: hour * 60 + min,
        dayIndex: referenceDayIndex,
        daysFromReference: 0,
      };
    })
    .filter((slot) => slot.minutes > referenceMinutes)
    .sort((a, b) => a.minutes - b.minutes);

  if (todaySlots.length > 0) {
    nextSlot = todaySlots[0];
  } else {
    // Check upcoming days
    for (let i = 1; i <= 7; i++) {
      const checkDayIndex = (referenceDayIndex + i) % 7;
      const checkDay = dayOrder[checkDayIndex];

      const daySlots = allScheduledTimes
        .filter((slot) => slot.day === checkDay)
        .map((slot) => {
          const [hour, min] = slot.startTime.split(':').map(Number);
          return {
            ...slot,
            minutes: hour * 60 + min,
            dayIndex: checkDayIndex,
            daysFromReference: i,
          };
        })
        .sort((a, b) => a.minutes - b.minutes);

      if (daySlots.length > 0) {
        nextSlot = daySlots[0];
        break;
      }
    }
  }

  if (!nextSlot) {
    return null;
  }

  // Format time and message
  const [hour, min] = nextSlot.startTime.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  const formattedTime = `${formattedHour.toString().padStart(2, '0')}:${min
    .toString()
    .padStart(2, '0')} ${period}`;
  const label = 'Next available';
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const formatDate = (baseDate: Date) => {
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + nextSlot!.daysFromReference);
    return nextDate.toLocaleDateString('en-US', options);
  };

  if (!isScheduled) {
    return nextSlot.daysFromReference === 0
      ? `${label} from ${formattedTime}`
      : `${label} ${formatDate(now)}, ${formattedTime}`;
  }

  if (isScheduled && scheduledDateTime) {
    return nextSlot.daysFromReference === 0
      ? `${label} from ${formattedTime}`
      : `${label} ${formatDate(scheduledDateTime)}, ${formattedTime}`;
  }

  // Fallback
  return `${label} ${formattedTime}`;
};

export interface SchedulingUnavailableDisplay {
  label: 'Next available' | 'Currently';
  detail: string;
}

/**
 * Get scheduling unavailability display in a structured format.
 * Keeps UI free from string parsing (includes/regex).
 */
export const getSchedulingUnavailableDisplay = (
  metadata?: ItemMetadata
): SchedulingUnavailableDisplay => {
  if (
    !metadata?.menuScheduling?.schedulerDetails ||
    metadata.menuScheduling.schedulerDetails.length === 0
  ) {
    return {
      label: 'Currently',
      detail: 'Unavailable',
    };
  }

  const now = new Date();

  // Flatten all scheduledTimes from all schedulerDetails
  const allScheduledTimes = metadata.menuScheduling.schedulerDetails.flatMap(
    (detail) => detail.scheduledTimes || []
  );

  const { isScheduled, scheduledDateTime } = getCurrentOrderContext();

  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const referenceDate = scheduledDateTime || now;
  const referenceDay = referenceDate.toLocaleDateString('en-US', { weekday: 'long' });
  const referenceDayIndex = dayOrder.indexOf(referenceDay);
  const referenceMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  let nextSlot: {
    day: string;
    startTime: string;
    dayIndex: number;
    daysFromReference: number;
  } | null = null;

  const todaySlots = allScheduledTimes
    .filter((slot) => slot.day === referenceDay)
    .map((slot) => {
      const [hour, min] = slot.startTime.split(':').map(Number);
      return {
        ...slot,
        minutes: hour * 60 + min,
        dayIndex: referenceDayIndex,
        daysFromReference: 0,
      };
    })
    .filter((slot) => slot.minutes > referenceMinutes)
    .sort((a, b) => a.minutes - b.minutes);

  if (todaySlots.length > 0) {
    nextSlot = todaySlots[0];
  } else {
    for (let i = 1; i <= 7; i++) {
      const checkDayIndex = (referenceDayIndex + i) % 7;
      const checkDay = dayOrder[checkDayIndex];

      const daySlots = allScheduledTimes
        .filter((slot) => slot.day === checkDay)
        .map((slot) => {
          const [hour, min] = slot.startTime.split(':').map(Number);
          return {
            ...slot,
            minutes: hour * 60 + min,
            dayIndex: checkDayIndex,
            daysFromReference: i,
          };
        })
        .sort((a, b) => a.minutes - b.minutes);

      if (daySlots.length > 0) {
        nextSlot = daySlots[0];
        break;
      }
    }
  }

  if (!nextSlot) {
    return {
      label: 'Currently',
      detail: 'Unavailable',
    };
  }

  const [hour, min] = nextSlot.startTime.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  const formattedTime = `${formattedHour.toString().padStart(2, '0')}:${min
    .toString()
    .padStart(2, '0')} ${period}`;
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const formatDate = (baseDate: Date) => {
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + nextSlot!.daysFromReference);
    return nextDate.toLocaleDateString('en-US', options);
  };

  if (!isScheduled) {
    return {
      label: 'Next available',
      detail:
        nextSlot.daysFromReference === 0
          ? `from ${formattedTime}`
          : `${formatDate(now)}, ${formattedTime}`,
    };
  }

  if (isScheduled && scheduledDateTime) {
    return {
      label: 'Next available',
      detail:
        nextSlot.daysFromReference === 0
          ? `from ${formattedTime}`
          : `${formatDate(scheduledDateTime)}, ${formattedTime}`,
    };
  }

  return {
    label: 'Next available',
    detail: formattedTime,
  };
};

/**
 * Get reason for menu scheduling unavailability with proper message
 */
export const getSchedulingUnavailableReason = (metadata?: ItemMetadata): string => {
  const display = getSchedulingUnavailableDisplay(metadata);
  return `${display.label} ${display.detail}`.trim();
};
