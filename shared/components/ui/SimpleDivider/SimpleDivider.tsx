import React from 'react'
import styles from './SimpleDivider.module.scss'

interface SimpleDividerProps {
  className?: string;
}

const SimpleDivider = ({ className }: SimpleDividerProps) => {
  return (
    <div className={`${styles.simpleDivider} ${className || ''}`}></div>
  )
};

export default SimpleDivider;