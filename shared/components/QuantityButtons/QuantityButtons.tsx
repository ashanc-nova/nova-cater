import React from 'react';
import styles from './QuantityButton.module.scss';
import PlusPadded from '../../../assets/Icons/PlusPadded';
import Minus from '../../../assets/Icons/Minus';

export type RoundButtonSize = 'xsmall' | 'small' | 'medium' | 'large';
export type RoundButtonVariant = 'incrementor' | 'decrementor' | 'default';

export interface RoundButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  size?: RoundButtonSize;
  variant?: RoundButtonVariant;
  children?: React.ReactNode;
  iconWidth?: number | string;
  iconHeight?: number | string;
  iconColor?: string;
}

export const RoundButton: React.FC<RoundButtonProps> = ({
  size = 'large',
  variant = 'default',
  className,
  disabled,
  children,
  iconWidth,
  iconHeight,
  iconColor,
  ...props
}) => {
  const buttonClass = [
    styles.button,
    styles[size],
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  const renderContent = () => {
    const defaultColor = disabled ? '#00000040' : 'var(--color-background-button-primary-default)';

    // Create props object optionally to avoid overriding SVG defaults when undefined
    const iconProps: Record<string, any> = {};
    if (iconWidth !== undefined) iconProps.width = iconWidth;
    if (iconHeight !== undefined) iconProps.height = iconHeight;
    if (iconColor !== undefined) {
      iconProps.color = iconColor;
    } else {
      iconProps.color = defaultColor;
    }

    if (variant === 'incrementor') return <PlusPadded {...iconProps} />;
    if (variant === 'decrementor') return <Minus {...iconProps} />;
    return children;
  };

  return (
    <button
      className={buttonClass}
      disabled={disabled}
      {...props}
    >
      {renderContent()}
    </button>
  );
};
