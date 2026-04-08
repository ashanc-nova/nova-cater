import React from 'react';
import styles from './Tag.module.scss';
import type { AllergenIconComponent } from '../../../iconMaps/allergenConstants';

export interface TagStyle {
  color?: string;
  backgroundColor?: string;
}

interface TagProps {
  icon?: AllergenIconComponent; // SVG component or emoji (optional)
  /** When provided, renders an img with this URL instead of icon component (e.g. secondary_image) */
  iconUrl?: string;
  /** Optional inline styles for tag wrapper (backgroundColor) and text (color) */
  tagStyle?: TagStyle;
  text: string;
  onClick?: () => void;
  className?: string;
}

export const Tag: React.FC<TagProps> = ({
  icon,
  iconUrl,
  tagStyle,
  text,
  onClick,
  className = '',
}) => {
  const IconComponent = icon;
  const wrapperStyle: React.CSSProperties = tagStyle?.backgroundColor
    ? { backgroundColor: tagStyle.backgroundColor }
    : {};
  const textStyle: React.CSSProperties = tagStyle?.color ? { color: tagStyle.color } : {};
  return (
    <div
      className={`${styles.tag} ${className}`}
      style={wrapperStyle}
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
      {iconUrl ? (
        <img src={iconUrl} alt="" className={styles.icon} />
      ) : (
        icon && <IconComponent className={styles.icon} />
      )}
      <span className={styles.text} style={textStyle}>
        {text}
      </span>
    </div>
  );
};

export default Tag;
