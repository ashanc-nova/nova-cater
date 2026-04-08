import React from 'react';
import styles from './SegmentedToggle.module.scss';
interface Option {
  label: string;
  value: string;
}

interface SegmentedToggleProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export const SegmentedToggle: React.FC<SegmentedToggleProps> = ({ options, value, onChange }) => {
  return (
    <div className={styles.segmentedContainer}>
      {options.map((option) => {
        const isActive = option.value === value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-label={option.label}
                        className={`${styles.segment} ${isActive ? styles.active : ""}`}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
