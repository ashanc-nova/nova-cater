// src/components/atoms/Icon/Icon.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../../shared/utils/utils';

interface IconProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
}

const Icon: React.FC<IconProps> = ({ icon: IconComponent, size = 'md', className, color }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  return <IconComponent className={cn(sizes[size], className)} color={color} />;
};

export default Icon;
