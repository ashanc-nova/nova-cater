import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './InfoPopover.module.scss';
import { CloseIconButton } from '../CloseIconButton/CloseIconButton';
import CloseButton32px from '../../../../assets/images/CloseButton32px';

export interface InfoPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
  title: string;
  children: React.ReactNode;
  maxHeight?: number;
  maxWidth?: number;
  icon?: React.ReactNode;
  subheader?: string;
  position?: 'top' | 'bottom' | 'auto';
}

const InfoPopover = ({
  isOpen,
  onClose,
  triggerRef,
  title,
  children,
  maxHeight = 400,
  maxWidth = 420,
  icon,
  subheader,
  position: forcedPosition = 'auto',
}: InfoPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Calculate and set position when opened
  useEffect(() => {
    if (isOpen && !isMobile) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;

        let finalPosition: 'top' | 'bottom';

        if (forcedPosition === 'auto') {
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          finalPosition = spaceBelow < maxHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
        } else {
          finalPosition = forcedPosition;
        }

        setPosition(finalPosition);
        setCoords({
          top: finalPosition === 'top' ? rect.top - 8 : rect.bottom + 8,
          left: rect.left - 180,
        });
        setIsVisible(true);
      }, 0);

      return () => clearTimeout(timeoutId);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, isMobile, forcedPosition, maxHeight, triggerRef]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen || (!isMobile && !isVisible)) return null;

  const content = (
    <>
      {isMobile && <div className={styles.overlay} onClick={onClose} />}

      {isMobile ? (
        <div className={styles.mobileContainer}>
          <div className={styles.mobileCloseButton} onClick={onClose}>
            <CloseButton32px />
          </div>

          <div ref={popoverRef} className={`${styles.popover} ${styles.mobile}`}>
            <Header />
            <div className={styles.content}>{children}</div>
          </div>
        </div>
      ) : (
        <div
          ref={popoverRef}
          className={`${styles.popover} ${styles.desktop} ${styles[position]} ${isVisible ? styles.visible : ''}`}
          style={{
            top: coords.top,
            left: coords.left,
            maxHeight,
            width: maxWidth,
            transform: position === 'top' ? 'translateY(-100%)' : undefined,
          }}
        >
          <Header />
          <div className={styles.content}>{children}</div>
        </div>
      )}
    </>
  );

  function Header() {
    return (
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          {icon && <div className={styles.icon}>{icon}</div>}
          <div className={styles.titleRow}>
            {subheader && <div className={styles.subheader}>{subheader}</div>}
            <h3 className={styles.title}>{title}</h3>
          </div>
        </div>
        {!isMobile && (
          <div className={styles.closeButton} onClick={onClose}>
            <CloseIconButton onClose={onClose} />
          </div>
        )}
      </div>
    );
  }

  return createPortal(content, document.body);
};

export default InfoPopover;
