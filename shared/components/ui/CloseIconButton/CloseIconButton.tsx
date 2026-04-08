import styles from './CloseIconButton.module.scss';
import GenericCrossPadded from '../../../../assets/images/GenericCrossPadded';

export const CloseIconButton = ({ onClose }: { onClose: () => void }): JSX.Element => {
  return (
    <button onClick={onClose} className={styles.closeButton} aria-label="Close modal">
      <GenericCrossPadded />
    </button>
  );
};
