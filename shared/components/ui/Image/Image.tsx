import React, { useState } from 'react';
import { cn } from '../../../utils/utils';
import defaultFallbackSrc from '../../../../assets/with inner shadow.svg';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  showSkeleton?: boolean;
  className?: string;
}

const Image: React.FC<ImageProps> = ({
  src,
  alt,
  showSkeleton = true,
  className,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && showSkeleton && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}

      <img
        src={hasError ? defaultFallbackSrc : src}
        alt={alt}
        onLoad={handleLoad}
        onError={(e) => {
          setHasError(true);
          (e.target as HTMLImageElement).src = defaultFallbackSrc;
        }}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        {...props}
      />
    </div>
  );
};

export default Image;
