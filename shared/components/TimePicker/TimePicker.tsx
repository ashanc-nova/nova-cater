import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './TimePicker.module.scss';
import {
  formatTime,
  parseTime,
  getHourAngle,
  getMinuteAngle,
  calculateAngle,
  getHourFromAngle,
  getMinuteFromAngle,
  getClockNumberPosition,
  isTimeDisabled,
  isHourDisabled
} from './timeUtils';
import TimeIcon from '../../../assets/Icons/TimeIcon';
import CommonFooter from '../CommonFooter/CommonFooter';

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  selectedDate?: string; // MM/DD/YYYY format - for validation
  restaurantTimeZone?: string; // IANA timezone string - for validation
}

type SelectionMode = 'hour' | 'minute' | 'period';

const TimePicker: React.FC<TimePickerProps> = ({
  value = '',
  onChange,
  placeholder = 'HH : MM',
  label = 'Time',
  disabled = false,
  selectedDate,
  restaurantTimeZone
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const now = new Date();
  const currentHours = now.getHours();
  const defaultHour = currentHours % 12 || 12;
  const defaultMinute = now.getMinutes();
  const defaultPeriod: 'AM' | 'PM' = currentHours >= 12 ? 'PM' : 'AM';

  const [hour, setHour] = useState(defaultHour);
  const [minute, setMinute] = useState(defaultMinute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(defaultPeriod);
  const [isDragging, setIsDragging] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('hour');
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [wasCanceled, setWasCanceled] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
    if (value) {
      const parsed = parseTime(value);
      if (parsed) {
        setHour(parsed.hour);
        setMinute(parsed.minute);
        setPeriod(parsed.period);
      }
    }
  }, [value]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calculateModalPosition = useCallback(() => {
    if (!inputRef.current) return;

    const isMobile = window.innerWidth < 768;
    const anchorRect = inputRef.current.getBoundingClientRect();

    // Get actual modal height if available, otherwise use constant
    let modalHeight = 420; // Approximate height of the time picker modal
    if (modalRef.current) {
      const modalRect = modalRef.current.getBoundingClientRect();
      if (modalRect.height > 0) {
        modalHeight = modalRect.height;
      }
    }

    const spacing = 8;

    // Position the bottom of the modal 8px above the top of the input element
    // Since we're using position: fixed, we use viewport coordinates directly (no scroll offset)
    const desiredTop = anchorRect.top - modalHeight - spacing;
    const spaceAbove = anchorRect.top;

    // Always position above with 8px spacing
    // If not enough space, position as close to 8px above as possible
    const finalTop = spaceAbove >= modalHeight + spacing
      ? desiredTop
      : Math.max(spacing, desiredTop);

    // For mobile, center horizontally; for desktop, align to left edge of input
    const finalLeft = isMobile
      ? window.innerWidth / 2
      : anchorRect.left;

    setModalPosition({
      top: finalTop,
      left: finalLeft,
    });
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Update modal position on scroll/resize and when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Use setTimeout to ensure modal is rendered before calculating position
    const timeoutId = setTimeout(() => {
      calculateModalPosition();
    }, 0);

    window.addEventListener('scroll', calculateModalPosition, true);
    window.addEventListener('resize', calculateModalPosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', calculateModalPosition, true);
      window.removeEventListener('resize', calculateModalPosition);
    };
  }, [isOpen, calculateModalPosition]);

  const handleInputClick = () => {
    if (!disabled) {
      calculateModalPosition();
      setIsOpen(true);
      setSelectionMode('hour');
      // Reset interaction flags when opening
      setWasCanceled(false);
      setHasUserInteracted(false);
    }
  };

  const handleHourInputFocus = () => {
    setSelectionMode('hour');
  };

  const handleMinuteInputFocus = () => {
    setSelectionMode('minute');
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= 12) {
      setHour(val);
    } else if (e.target.value === '') {
      setHour(1);
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0 && val <= 59) {
      setMinute(val);
    } else if (e.target.value === '') {
      setMinute(0);
    }
  };

  const handleClockClick = (value: number) => {
    // Prevent selection of disabled times
    if (selectionMode === 'hour') {
      // Check if the entire hour is disabled (all minutes in that hour are in the past)
      const isDisabled = isHourDisabled(value, period, selectedDate, restaurantTimeZone);
      if (isDisabled) return;
      setHour(value);
      setHasUserInteracted(true);
      // Automatically switch to minute mode after selecting an hour
      setSelectionMode('minute');
    } else if (selectionMode === 'minute') {
      // Ensure we have a valid hour before checking minutes
      // Use the current hour state, which should be set when user selects an hour
      const hourToCheck = hour >= 1 && hour <= 12 ? hour : 12; // Default to 12 if invalid
      const isDisabled = isTimeDisabled(hourToCheck, value, period, selectedDate, restaurantTimeZone);
      if (isDisabled) return;
      setMinute(value);
      setHasUserInteracted(true);
      // Commit and close after selecting a minute (same as period selection)
      const formattedTime = formatTime(hour, value, period);
      setInputValue(formattedTime);
      onChange?.(formattedTime);
      setIsOpen(false);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!isDragging && (e as React.MouseEvent).type !== 'click') return;

    // Don't handle drag in period mode
    if (selectionMode === 'period') return;

    const clock = clockRef.current;
    if (!clock) return;

    const rect = clock.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = calculateAngle(centerX, centerY, e.clientX, e.clientY);

    if (selectionMode === 'hour') {
      const newHour = getHourFromAngle(angle);
      // Prevent dragging to disabled hours (check if entire hour is disabled)
      if (!isHourDisabled(newHour, period, selectedDate, restaurantTimeZone)) {
        setHour(newHour);
        setHasUserInteracted(true);
        // Auto-switch to minute mode after selecting hour via drag
        setSelectionMode('minute');
      }
    } else if (selectionMode === 'minute') {
      const newMinute = getMinuteFromAngle(angle);
      // Round to nearest 5 minutes
      const roundedMinute = Math.round(newMinute / 5) * 5;
      const finalMinute = roundedMinute === 60 ? 0 : roundedMinute;
      // Prevent dragging to disabled minutes
      const hourToCheck = hour >= 1 && hour <= 12 ? hour : 12;
      if (!isTimeDisabled(hourToCheck, finalMinute, period, selectedDate, restaurantTimeZone)) {
        setMinute(finalMinute);
        setHasUserInteracted(true);
        // Commit and close after selecting minute via drag (same as period selection)
        const formattedTime = formatTime(hour, finalMinute, period);
        setInputValue(formattedTime);
        onChange?.(formattedTime);
        setIsOpen(false);
      }
    }
  }, [isDragging, selectionMode, hour, period, selectedDate, restaurantTimeZone, onChange]);

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        handleDrag(e);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleDrag]);

  // Commit time selection when modal closes (but not if canceled)
  const prevIsOpenRef = useRef(isOpen);
  useEffect(() => {
    // When modal closes (isOpen changes from true to false), commit the selection only if:
    // 1. Not canceled by user
    // 2. User has actually interacted with the time picker
    // 3. The selected time is not disabled
    if (prevIsOpenRef.current && !isOpen && !wasCanceled && hasUserInteracted) {
      const isCurrentTimeDisabled = isTimeDisabled(hour, minute, period, selectedDate, restaurantTimeZone);
      if (!isCurrentTimeDisabled) {
        const formattedTime = formatTime(hour, minute, period);
        setInputValue(formattedTime);
        onChange?.(formattedTime);
      }
    }
    prevIsOpenRef.current = isOpen;

    // Reset flags when modal opens
    if (isOpen && !prevIsOpenRef.current) {
      setWasCanceled(false);
      setHasUserInteracted(false);
    }
  }, [isOpen, hour, minute, period, onChange, wasCanceled, hasUserInteracted, selectedDate, restaurantTimeZone]);

  // Generate clock numbers based on mode
  // Show minute numbers when in period mode (keep showing the selected minute)
  const clockNumbers = selectionMode === 'hour'
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : Array.from({ length: 12 }, (_, i) => i * 5);

  const clockRadius = 110; // Distance from center to numbers

  // Calculate angle for the clock hand
  // Show minute hand when in period mode (keep showing the selected minute)
  const handAngle = selectionMode === 'hour'
    ? getHourAngle(hour)
    : getMinuteAngle(minute);

  // Get current selected value for display
  // Show minute value when in period mode (keep showing the selected minute)
  const selectedValue = selectionMode === 'hour' ? hour : minute;

  // Footer handlers
  const handleCancel = () => {
    setWasCanceled(true);
    setHasUserInteracted(false);
    // Reset to original values if they exist
    if (value) {
      const parsed = parseTime(value);
      if (parsed) {
        setHour(parsed.hour);
        setMinute(parsed.minute);
        setPeriod(parsed.period);
      }
      setInputValue(value);
    } else {
      // If no original value, clear the input and reset to defaults
      setInputValue('');
      setHour(defaultHour);
      setMinute(defaultMinute);
      setPeriod(defaultPeriod);
    }
    setIsOpen(false);
  };

  const handleConfirm = () => {
    // Only confirm if the selected time is not disabled
    const isCurrentTimeDisabled = isTimeDisabled(hour, minute, period, selectedDate, restaurantTimeZone);
    if (!isCurrentTimeDisabled) {
      const formattedTime = formatTime(hour, minute, period);
      setInputValue(formattedTime);
      onChange?.(formattedTime);
    }
    setIsOpen(false);
  };

  const handlePeriodSelect = (selectedPeriod: 'AM' | 'PM') => {
    setPeriod(selectedPeriod);
    setHasUserInteracted(true);
  };

  return (
    <div className={styles.timePickerContainer} ref={containerRef}>
      <div className={styles.inputWrapper}>
        {inputValue && (
          <div className={styles.floatingLabel}>
            <span className={styles.floatingLabelText}>{label}</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          placeholder={placeholder}
          onClick={handleInputClick}
          onChange={(e) => setInputValue(e.target.value)}
          className={styles.timeInput}
          disabled={disabled}
          readOnly
        />
        <div className={styles.timeIcon}>
          <TimeIcon />
        </div>
      </div>

      {isOpen && createPortal(
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          <div
            ref={modalRef}
            className={styles.clockModal}
            style={{
              position: 'fixed',
              top: `${modalPosition.top}px`,
              left: `${modalPosition.left}px`,
              transform: window.innerWidth < 768 ? 'translateX(-50%)' : 'none',
            }}
          >
            <div className={styles.clockHeader}>
              <h3 className={styles.selectTimeTitle}>Select time</h3>
              <div className={styles.timeInputSection}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(hour).padStart(2, '0')}
                  onChange={handleHourChange}
                  onFocus={handleHourInputFocus}
                  className={`${styles.hourMinuteInput} ${selectionMode === 'hour' ? styles.active : ''}`}
                  readOnly
                />
                <span className={styles.timeSeparator}>:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(minute).padStart(2, '0')}
                  onChange={handleMinuteChange}
                  onFocus={handleMinuteInputFocus}
                  className={`${styles.hourMinuteInput} ${selectionMode === 'minute' ? styles.active : ''}`}
                  readOnly
                />
                <div className={`${styles.periodToggle} ${selectionMode === 'period' ? styles.periodActive : ''}`}>
                  <button
                    className={`${styles.periodButton} ${period === 'AM' ? styles.active : ''}`}
                    onClick={() => {
                      setPeriod('AM');
                      setHasUserInteracted(true);
                      // After selecting AM/PM, commit the time and close the picker
                      handlePeriodSelect('AM');
                    }}
                  >
                    AM
                  </button>
                  <button
                    className={`${styles.periodButton} ${period === 'PM' ? styles.active : ''}`}
                    onClick={() => {
                      setPeriod('PM');
                      setHasUserInteracted(true);
                      // After selecting AM/PM, commit the time and close the picker
                      handlePeriodSelect('PM');
                    }}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            <div
              className={styles.clockFace}
              ref={clockRef}
              onClick={(e) => handleDrag(e)}
            >
              {/* Clock ticks */}
              {Array.from({ length: 60 }, (_, i) => i).map((tick) => {
                const isMajor = tick % 5 === 0;
                if (!isMajor && tick % 1 !== 0) return null;
                return (
                  <div
                    key={tick}
                    className={`${styles.clockTick} ${isMajor ? styles.major : ''}`}
                    style={{ '--angle': `${tick * 6}deg` } as React.CSSProperties}
                  />
                );
              })}

              {/* Clock numbers */}
              {clockNumbers.map((num, index) => {
                const displayNum = selectionMode === 'hour' ? num : num;
                const position = selectionMode === 'hour' ? num : (num / 5) || 12;
                const pos = getClockNumberPosition(position, clockRadius);
                const isSelected = selectionMode === 'hour' ? hour === num : minute === num;

                // Check if this time is disabled
                // When checking hours: disable only if ALL minutes in that hour are in the past
                // When checking minutes: disable if that specific minute is in the past
                // Period mode doesn't use clock numbers, so this only applies to hour and minute modes
                const isDisabled = selectionMode === 'hour'
                  ? isHourDisabled(num, period, selectedDate, restaurantTimeZone)
                  : selectionMode === 'minute'
                    ? isTimeDisabled(hour >= 1 && hour <= 12 ? hour : 12, num, period, selectedDate, restaurantTimeZone)
                    : false;

                return (
                  <div
                    key={index}
                    className={`${styles.clockNumber} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
                    style={{
                      left: `calc(50% + ${pos.x}px)`,
                      top: `calc(50% + ${pos.y}px)`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => handleClockClick(displayNum)}
                  >
                    {String(displayNum).padStart(2, '0')}
                  </div>
                );
              })}

              {/* Selected value indicator at top */}
              <div
                className={styles.selectedValueIndicator}
                style={{ '--angle': `${handAngle}deg` } as React.CSSProperties}
              >
                {String(selectedValue).padStart(2, '0')}
              </div>

              {/* Clock hand */}
              <div
                className={styles.clockHand}
                style={{ '--angle': `${handAngle}deg` } as React.CSSProperties}
              />

              {/* Clock hand end (draggable) */}
              <div
                className={styles.clockHandEnd}
                style={{ '--angle': `${handAngle}deg` } as React.CSSProperties}
                onMouseDown={handleDragStart}
              />

              {/* Clock center */}
              <div className={styles.clockCenter} />
            </div>

            {/* Footer for mobile only */}
            {isMobile && (
              <CommonFooter
                onCancel={handleCancel}
                onConfirm={handleConfirm}
                styles={{
                  footerContainer: 'w-full flex flex-row gap-4 px-4 pt-4',
                  cancelButton: `${styles.mobileFooterButton} ${styles.cancelButton}`,
                  confirmButton: `${styles.mobileFooterButton} ${styles.confirmButton}`,
                  cancelButtonText: 'Cancel',
                  confirmButtonText: 'Confirm',
                }}
              />
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default TimePicker;

