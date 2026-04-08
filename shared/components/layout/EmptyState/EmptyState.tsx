import React from 'react';
import { cn } from '../../../utils/utils';
import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  isMobile?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  isMobile = false,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {icon && <div className="flex items-center justify-center mb-4">{icon}</div>}

      <h3 className="text-lg font-medium text-[#121214] mb-[4px] leading-[26px] tracking-[-0.05px]">
        {title}
      </h3>

      {description && (
        <p
          className={`text-sm text-gray-500 text-center mb-6 max-w-sm ${isMobile ? 'max-w-[288px]' : ''}`}
        >
          {description}
        </p>
      )}

      {action && (
        <button className={styles.emptyStateButton} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
