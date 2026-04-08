import React from 'react';
import Modal from '../../layout/Modal/Modal';
import CrossPadded from '../../../../assets/images/CrossPadded';
import styles from './UserMenuModal.module.scss';

export interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface UserMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

const UserMenuModal: React.FC<UserMenuModalProps> = ({
  isOpen,
  onClose,
  menuItems,
}) => {
  const handleMenuItemClick = (onClick: () => void) => {
    onClick();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="bottom" className={styles.modalWrapper}>
      <div className={styles.container}>
        <div className={styles.closeButton} onClick={onClose}>
          <CrossPadded />
        </div>

        <div className={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <div
              key={item.id}
              className={`${styles.menuItem} ${
                index === menuItems.length - 2 ? styles.hasDivider : ''
              }`}
              onClick={() => handleMenuItemClick(item.onClick)}
            >
              {item.icon}
              <span className={styles.menuText}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default UserMenuModal;

