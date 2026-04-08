import React from 'react';
import Lottie from 'lottie-react';
import styles from './PayNowButton.module.scss';
import PayNowIcon from '../../../../assets/PayNowIcon';
import buttonLoaderWhite from '../../../../assets/lotties/buttonLoaderWhite.json';

interface PayNowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  hideIcon?: boolean;
}

const PayNowButton: React.FC<PayNowButtonProps> = ({
  children = 'Pay now',
  className = '',
  isLoading = false,
  disabled,
  hideIcon = false,
  ...props
}) => {
  return (
    <button
      className={`${styles.payNowButton} ${isLoading ? styles.processingButton : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span>
            <Lottie animationData={buttonLoaderWhite} loop={true} />
          </span>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {!hideIcon && <span><PayNowIcon /></span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default PayNowButton;
