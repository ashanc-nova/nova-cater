import Lottie from 'lottie-react';
import { DownloadIcon } from '../../../../assets/DownloadIcon';
import loaderAnimation from '../../../../assets/lotties/loader.json';
import styles from './DownloadInvoiceButton.module.scss';

export const DownloadInvoiceButton = ({
  handleDownloadInvoice,
  orderRefId,
  isLoading = false,
  className = '',
}: {
  handleDownloadInvoice: (orderRefId: string) => void;
  orderRefId: string;
  isLoading?: boolean;
  className?: string;
}) => {
  return (
    <button
      className={`${styles.downloadInvoiceButton} hidden md:flex text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        if (!isLoading) {
          handleDownloadInvoice(orderRefId);
        }
      }}
      disabled={isLoading}
    >
      {isLoading ? (
        <Lottie
          animationData={loaderAnimation}
          loop={true}
          style={{ width: '20px', height: '20px' }}
        />
      ) : (
        <DownloadIcon />
      )}
      Invoice
    </button>
  );
};
