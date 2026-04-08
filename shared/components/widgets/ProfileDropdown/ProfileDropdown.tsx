import React, { useEffect, useRef } from 'react';
import styles from './ProfileDropdown.module.scss';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  onClick: () => void;
}
interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  menuItems
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className={styles.profileDropdown}>
      {menuItems.map((item, index) => {
        const IconComponent = item.icon;
        
        return (
          <div key={item.id}>
            <div className={styles.menuItem} onClick={item.onClick}>
              <IconComponent className={styles.icon} size={20} />
              <span className={styles.label}>{item.label}</span>
            </div>
            {index < menuItems.length - 1 && (
              <hr className={styles.divider} />
            )}
          </div>
        );
      })}
    </div>
  );
};
export default ProfileDropdown;