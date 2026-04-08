import React from 'react'
import styles from './DashedDivider.module.scss'

interface DashedDividerProps {
  className?: string;
}

const DashedDivider: React.FC<DashedDividerProps> = ({ className }) => {
  return (
    <div className={`${styles.dashedDivider} ${className || ''}`}></div>
  )
}

export default DashedDivider