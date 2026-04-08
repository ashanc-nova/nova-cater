import React from 'react';
import Modal from '../../layout/Modal/Modal';
import CrossPadded from '../../../../assets/images/CrossPadded';
import styles from './MobilePopoverModal.module.scss';

interface MobilePopoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const MobilePopoverModal: React.FC<MobilePopoverModalProps> = ({
    isOpen,
    onClose,
    children,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} position="bottom" className={styles.modalWrapper}>
            <div className={styles.container}>
                <div className={styles.closeButton} onClick={onClose}>
                    <CrossPadded />
                </div>
                {children}
            </div>
        </Modal>
    );
};

export default MobilePopoverModal;

