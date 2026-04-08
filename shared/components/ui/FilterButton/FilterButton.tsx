import React from 'react';
import styles from './FilterButton.module.scss';

interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isActive?: boolean;
  variant?: 'mobile' | 'desktop';
}

const FilterButton: React.FC<FilterButtonProps> = ({
  children,
  isActive = false,
  variant = 'desktop',
  className = '',
  ...props
}) => {
  const isMobile = variant === 'mobile';
  
  if (isMobile && isActive) {
    // Use wrapper div for gradient border
    return (
      <div className={styles.mobileActiveWrapper}>
        <button className={`${styles.mobileButton} ${styles.mobileActive} ${className}`} {...props}>
          {children}
        </button>
      </div>
    );
  }
  
  if (!isMobile && isActive) {
    // Use wrapper div for gradient border on desktop
    return (
      <div className={styles.desktopActiveWrapper}>
        <button className={`${styles.desktopButton} ${styles.desktopActive} ${className}`} {...props}>
          {children}
        </button>
      </div>
    );
  }
  
  const buttonClass = isMobile
    ? `${styles.mobileButton} ${styles.mobileInactive} ${className}`
    : `${styles.desktopButton} ${styles.desktopInactive} ${className}`;

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};

export default FilterButton;

