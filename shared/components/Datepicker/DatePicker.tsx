// Libraries
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

// Components
import CommonFooter from '../CommonFooter/CommonFooter';

// Utils
import { generateCalendarDates, getMonthName, formatDate, parseDate } from './dateUtils';

// Icons
import DateIcon from '../../../assets/Icons/DateIcon';
import ClosePaddedIcon from '../../../assets/Icons/ClosePaddedIcon';
import LeftArrow from '../../../assets/Icons/LeftArrow';
import RightArrow from '../../../assets/Icons/RightArrow';
import BackButton from '../../../assets/Icons/BackButton';

// Styles
import styles from './DatePicker.module.scss';

// Types && Constants
import type { CalendarDate } from './dateUtils';

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  allowedDates?: string[]; // Array of allowed date strings in YYYY-MM-DD format
}

type ViewMode = 'date' | 'month' | 'year';

const DatePicker: React.FC<DatePickerProps> = ({
  value = '',
  onChange,
  placeholder = 'MM / DD / YYYY',
  label = 'Date',
  disabled = false,
  minDate,
  maxDate,
  allowedDates,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('date');
  const [inputValue, setInputValue] = useState(value);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? parseDate(value) : null);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(selectedDate);
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate?.getMonth() ?? new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    selectedDate?.getFullYear() ?? new Date().getFullYear()
  );
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
    setSelectedDate(value ? parseDate(value) : null);
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
    let modalHeight = 570; // Approximate height of the calendar modal
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

  // Handle click outside to close calendar
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
      setViewMode('date');
      setTempSelectedDate(selectedDate);
    }
  };

  const handleDateSelect = (calendarDate: CalendarDate) => {
    // Check if date is within allowed range
    if (minDate && calendarDate.fullDate < minDate) return;
    if (maxDate && calendarDate.fullDate > maxDate) return;

    setTempSelectedDate(calendarDate.fullDate);

    // If clicking on a date from a different month, navigate to that month
    if (!calendarDate.isCurrentMonth) {
      setCurrentMonth(calendarDate.month);
      setCurrentYear(calendarDate.year);
      return; // Don't auto-close when navigating to different month
    }

    // On web view (non-mobile), automatically confirm and close modal
    if (!isMobile) {
      setSelectedDate(calendarDate.fullDate);
      const formattedDate = formatDate(calendarDate.fullDate);
      setInputValue(formattedDate);
      onChange?.(formattedDate);
      setIsOpen(false);
    }
    // On mobile, keep modal open so user can use footer buttons
  };

  const handleConfirm = () => {
    if (tempSelectedDate) {
      setSelectedDate(tempSelectedDate);
      const formattedDate = formatDate(tempSelectedDate);
      setInputValue(formattedDate);
      onChange?.(formattedDate);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setTempSelectedDate(selectedDate);
    setViewMode('date');
    setIsOpen(false);
  };

  const handleMonthSelect = (month: number) => {
    setCurrentMonth(month);
    setViewMode('date');
  };

  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
    setViewMode('date');
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const calendarDates = generateCalendarDates(currentMonth, currentYear, tempSelectedDate);
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Generate years (current year ± 6 years)
  const currentYearNow = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => currentYearNow - 5 + i);

  const isDateDisabled = (calendarDate: CalendarDate): boolean => {
    if (minDate && calendarDate.fullDate < minDate) return true;
    if (maxDate && calendarDate.fullDate > maxDate) return true;

    // If allowedDates is provided, check if the date is in the allowed list
    if (allowedDates && allowedDates.length > 0) {
      // Format date using local timezone to avoid UTC timezone conversion issues
      // Use the calendarDate properties directly since they're already in local timezone
      const year = calendarDate.year;
      const month = String(calendarDate.month + 1).padStart(2, '0');
      const day = String(calendarDate.date).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`; // Format as YYYY-MM-DD
      return !allowedDates.includes(dateString);
    }

    return false;
  };

  const getViewTitle = () => {
    if (viewMode === 'year') return 'Choose a year';
    if (viewMode === 'month') return 'Choose a month';
    return 'Choose a date';
  };

  return (
    <div className={styles.datePickerContainer} ref={containerRef}>
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
          className={styles.dateInput}
          disabled={disabled}
          readOnly
        />
        <div className={styles.calendarIcon}>
          <DateIcon />
        </div>
      </div>

      {isOpen &&
        createPortal(
          <>
            <div className={styles.backdrop} onClick={handleCancel} />
            <div
              ref={modalRef}
              className={styles.calendarModal}
              style={{
                position: 'fixed',
                      top: `${modalPosition.top}px`,
                      left: `${modalPosition.left}px`,
                transform: window.innerWidth < 768 ? 'translateX(-50%)' : 'none',
              }}
            >
              <div className={`${styles.calendarHeader} ${viewMode !== 'date' ? styles.hasBackButton : ''}`}>
                {viewMode !== 'date' && (
                  <button className={styles.backButton} onClick={() => setViewMode('date')}>
                    <BackButton />
                  </button>
                )}
                <span className={styles.calendarTitle}>{getViewTitle()}</span>
                <button className={styles.closeButton} onClick={handleCancel}>
                  <ClosePaddedIcon />
                </button>
              </div>

              <div className={styles.calendarBody}>
                {viewMode === 'date' && (
                  <>
                    <div className={styles.monthNavigation}>
                      <div className={styles.monthYearDisplay}>
                        <button
                          className={styles.monthYearButton}
                          onClick={() => setViewMode('month')}
                        >
                          {getMonthName(currentMonth)}
                        </button>
                        <span className={styles.separator}>/</span>
                        <button
                          className={styles.monthYearButton}
                          onClick={() => setViewMode('year')}
                        >
                          {currentYear}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button className={styles.navButton} onClick={handlePrevMonth}>
                          <LeftArrow />
                        </button>
                        <button className={styles.navButton} onClick={handleNextMonth}>
                          <RightArrow />
                        </button>
                      </div>
                    </div>

                    <div className={styles.calendarGrid}>
                      <div className={styles.weekDaysRow}>
                        {weekDays.map((day, index) => (
                          <div key={index} className={styles.weekDay}>
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className={styles.datesGrid}>
                        {calendarDates.map((calendarDate, index) => {
                          const disabled = isDateDisabled(calendarDate);
                          return (
                            <button
                              key={index}
                              className={`${styles.dateCell} ${
                                !calendarDate.isCurrentMonth ? styles.otherMonth : ''
                              } ${calendarDate.isToday ? styles.today : ''} ${
                                calendarDate.isSelected ? styles.selected : ''
                              }`}
                              onClick={() => handleDateSelect(calendarDate)}
                              disabled={disabled}
                            >
                              {calendarDate.date}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {viewMode === 'month' && (
                  <div className={styles.monthYearPickerContainer}>
                    <div className={styles.monthNavigation}>
                      <div className={styles.monthYearDisplay}>
                        <button
                          className={`${styles.monthYearButton} ${styles.selected}`}
                          onClick={() => setViewMode('month')}
                        >
                          {getMonthName(currentMonth)}
                        </button>
                        <span className={styles.separator}>/</span>
                        <button
                          className={styles.monthYearButton}
                          onClick={() => setViewMode('year')}
                        >
                          {currentYear}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className={styles.navButton}
                          onClick={() => setCurrentYear(currentYear - 12)}
                        >
                          <LeftArrow />
                        </button>
                        <button
                          className={styles.navButton}
                          onClick={() => setCurrentYear(currentYear + 12)}
                        >
                          <RightArrow />
                        </button>
                      </div>
                    </div>
                    <div className={styles.monthGrid}>
                      {months.map((month, index) => (
                        <button
                          key={index}
                          className={`${styles.monthYearCell} ${
                            index === currentMonth ? styles.selected : ''
                          }`}
                          onClick={() => handleMonthSelect(index)}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {viewMode === 'year' && (
                  <div className={styles.monthYearPickerContainer}>
                    <div className={styles.monthNavigation}>
                      <div className={styles.monthYearDisplay}>
                        <button
                          className={styles.monthYearButton}
                          onClick={() => setViewMode('month')}
                        >
                          {getMonthName(currentMonth)}
                        </button>
                        <span className={styles.separator}>/</span>
                        <button
                          className={`${styles.monthYearButton} ${styles.selected}`}
                          onClick={() => setViewMode('year')}
                        >
                          {currentYear}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className={styles.navButton} onClick={() => setCurrentYear(currentYear - 12)}>
                          <LeftArrow />
                        </button>
                        <button className={styles.navButton} onClick={() => setCurrentYear(currentYear + 12)}>
                          <RightArrow />
                        </button>
                      </div>
                    </div>
                    <div className={styles.yearGrid}>
                      {years.map((year) => (
                        <button
                          key={year}
                          className={`${styles.monthYearCell} ${
                            year === currentYear ? styles.selected : ''
                          }`}
                          onClick={() => handleYearSelect(year)}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {viewMode === 'date' && isMobile && (
                <div className={styles.footerContainer}>
                  <CommonFooter
                    onCancel={handleCancel}
                    onConfirm={handleConfirm}
                    styles={{
                      footerContainer: `w-full flex flex-row gap-4`,
                      cancelButton: `${styles.mobileFooterButton} ${styles.mobileCancelButton}`,
                      confirmButton: `${styles.mobileFooterButton} ${styles.mobileConfirmButton}`,
                      cancelButtonText: 'Cancel',
                      confirmButtonText: 'Confirm',
                    }}
                  />
                </div>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};

export default DatePicker;
