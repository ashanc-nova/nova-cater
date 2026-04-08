import React from 'react';
import styles from '../../../../styles/components/WhiteIcon.module.scss';
interface WhiteIconProps {
  icon: React.ReactNode | string;
}
const WhiteIcon = ({ icon }: WhiteIconProps) => {
  return (
    <div
      className={`w-11 h-11 rounded-full border flex items-center justify-center text-white ${styles.whiteIcon}`}
    >
      {icon}
    </div>
  );
};

export default WhiteIcon;
