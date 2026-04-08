import React, { useCallback } from 'react';
import styles from './RoundButton.module.scss';

interface RoundButtonProps {
  icon?: React.ReactNode;
  text?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'linear' | 'white' | 'remaining-pill' | 'search-trigger' | 'back';
  disabled?: boolean;
  size?: '28px' | '24px' | '20px' | '32px' | 'small' | 'medium' | 'large' | '26px';
  ariaLabel?: string;
}
type RoundButtonVariant = NonNullable<RoundButtonProps['variant']>;
type RoundButtonSize = NonNullable<RoundButtonProps['size']>;

const RoundButton: React.FC<RoundButtonProps> = ({
  icon,
  text,
  onClick,
  className,
  variant = 'linear',
  disabled = false,
  size = 'large',
  ariaLabel,
}) => {
  const variantClassMap: Record<RoundButtonVariant, string> = {
    linear: styles.roundButton,
    white: styles.roundButtonWhite,
    'remaining-pill': styles.roundButtonRemainingPill,
    'search-trigger': styles.roundButtonSearchTrigger,
    back: styles.roundButtonBack,
  };

  const sizeClassMap: Record<RoundButtonSize, string> = {
    '20px': styles.size20px,
    '24px': styles.size24px,
    '26px': styles.size26px,
    '28px': styles.size28px,
    '32px': styles.size32px,
    small: styles.sizeSmall,
    medium: styles.sizeMedium,
    large: styles.sizeLarge,
  };

  const getButtonClass = () => {
    const baseClass = variantClassMap[variant];
    const sizeClass = sizeClassMap[size] || styles.sizeLarge;
    const disabledClass = disabled ? styles.disabled : '';
    return `${baseClass} ${sizeClass} ${disabledClass}`;
  };
  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick?.();
    }
  }, [onClick, disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    },
    [onClick, disabled]
  );

  return (
    <div
      className={`${getButtonClass()} ${className || ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={ariaLabel ? 'button' : undefined}
      tabIndex={ariaLabel && !disabled ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {icon || (
        <span
          className={
            variant === 'remaining-pill'
              ? `${styles.remainingPillLabel} [font-feature-settings:'liga'_off,'clig'_off]`
              : `font-inter text-[10px] font-medium leading-[16px] tracking-[0.05px] text-[#8B8B8C] [font-feature-settings:'liga'_off,'clig'_off]`
          }
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default RoundButton;
