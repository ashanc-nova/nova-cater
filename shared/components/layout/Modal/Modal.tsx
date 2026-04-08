import { createPortal } from 'react-dom';
import styles from './Modal.module.scss';
import { useBodyScrollLock } from '../../../../features/delivery/hooks/useBodyScrollLock';

export type ModalPosition = 'bottom' | 'right' | 'center';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: ModalPosition;
  className?: string;
}

const Modal = ({ isOpen, onClose, children, position = 'bottom', className = '' }: ModalProps) => {

  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  const positionClass = {
    bottom: styles.modalBottom,
    right: styles.modalRight,
    center: styles.modalCenter,
  }[position];

  return createPortal(
    <div className={styles.modalOverlay}>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div
        className={`${styles.modalContainer} ${positionClass} ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
