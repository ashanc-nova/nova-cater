import React from 'react'
import styles from './ErrorMessageStrip.module.scss'
import Warning from '../../../../assets/Icons/Warning';

interface ErrorMessageStripProps {
    icon?: React.ReactNode | string;
    message?: string;
    className?: string;
}

const ErrorMessageStrip = ({ icon = <Warning width={12} height={12} />, message = 'Invalid card details. Re-enter card number and PIN', className }: ErrorMessageStripProps) => {
  return (
    <div className={`${styles.errorMessageStrip} ${className || ''}`}>
        <div className={styles.iconContainer}>{icon}</div>
        <span className={styles.errorMessage}>{message}</span>
    </div>
  )
}

export default ErrorMessageStrip