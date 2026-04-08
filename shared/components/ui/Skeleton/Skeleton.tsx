// src/components/atoms/Skeleton/Skeleton.tsx
import React from 'react';
import { cn } from '../../../../shared/utils/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}) => {
  const baseStyles = 'animate-pulse bg-gray-200 rounded';

  const variants = {
    text: 'h-4',
    rectangular: 'h-4',
    circular: 'rounded-full',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(baseStyles, variants[variant], index === lines - 1 ? 'w-3/4' : 'w-full')}
            style={{ width, height }}
          />
        ))}
      </div>
    );
  }

  return <div className={cn(baseStyles, variants[variant], className)} style={{ width, height }} />;
};

export default Skeleton;
