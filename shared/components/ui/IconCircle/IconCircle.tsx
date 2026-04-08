import React from 'react';
import styles from './IconCircle.module.scss';

interface IconCircleProps {
  icon: React.ReactNode;
  size?: number; // Size in pixels (width/height)
  className?: string;
  onClick?: () => void;
}

const IconCircle: React.FC<IconCircleProps> = ({ icon, size = 36, className = '', onClick }) => {
  const clickableClass = onClick ? styles.clickable : '';

  return (
    <div
      className={`${styles.iconCircle} ${clickableClass} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {icon}
    </div>
  );
};

export default IconCircle;
