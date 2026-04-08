import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ToastProvider.module.scss';
import { setToastAnchorHandler, setToastHandler, type ToastOptions } from '../../../utils/toast';

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastState {
  message: string;
  options?: ToastOptions;
}

const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    setToast({ message, options });
  }, []);

  const handleClose = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    setToastHandler(showToast);
    return () => setToastHandler(null);
  }, [showToast]);

  useEffect(() => {
    setToastAnchorHandler(setAnchorElement);
    return () => setToastAnchorHandler(null);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast]);

  const handleAction = useCallback(() => {
    toast?.options?.onAction?.();
    handleClose();
  }, [toast, handleClose]);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  const shouldRenderToast = Boolean(toast && !anchorElement);
  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  const toastMarkup = shouldRenderToast ? (
    <div className={styles.toastWrapper} role="status" aria-live="polite">
      <div className={styles.toastBanner}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 16C0 7.16344 7.16344 0 16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16Z"
            fill="#F8F8FB"
            fill-opacity="0.1"
          />
          <path
            d="M17.604 23.5H14.396C10.5373 23.5 8.60792 23.5 7.89693 22.2449C7.18594 20.9899 8.17276 19.3262 10.1464 15.9987L11.7504 13.2944C13.6463 10.0982 14.5942 8.5 16 8.5C17.4057 8.5 18.3536 10.0981 20.2495 13.2944L21.8535 15.9987C23.8271 19.3262 24.814 20.9899 24.103 22.2449C23.392 23.5 21.4626 23.5 17.604 23.5Z"
            stroke="#F8F8FB"
            stroke-width="1.04167"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M16 13.5V17.25"
            stroke="#F8F8FB"
            stroke-width="1.04167"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M16 20.1602V20.1685"
            stroke="#F8F8FB"
            stroke-width="1.04167"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <p className={styles.message}>{toast.message}</p>
        {/* {toast.options?.actionLabel && (
          <button className={styles.actionButton} onClick={handleAction} type="button">
            {toast.options.actionLabel}
          </button>
        )} */}
        <button
          className={styles.closeButton}
          onClick={handleClose}
          type="button"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  ) : null;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toastMarkup && portalTarget && createPortal(toastMarkup, portalTarget)}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
