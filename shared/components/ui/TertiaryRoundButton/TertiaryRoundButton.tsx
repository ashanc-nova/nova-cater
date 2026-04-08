import React from 'react';
import styles from './TertiaryRoundButton.module.scss';

export type TertiaryRoundButtonSize = 'small' | 'medium' | 'large' | 'xlarge';

interface TertiaryRoundButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  size?: TertiaryRoundButtonSize;
}

const sizeClassMap: Record<TertiaryRoundButtonSize, string> = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
  xlarge: styles.sizeXlarge,
};

export const TertiaryRoundButton = ({
  children,
  className = '',
  size = 'small',
  ...props
}: TertiaryRoundButtonProps): JSX.Element => {
  return (
    <button
      type="button"
      className={`${styles.tertiaryRoundButton} ${sizeClassMap[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
