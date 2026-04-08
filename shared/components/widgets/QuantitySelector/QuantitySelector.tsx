import { RoundButton, type RoundButtonSize } from '../../QuantityButtons/QuantityButtons';
import { useIsMobile } from '../../../hooks/useIsMobile';
import styles from './QuantitySelector.module.scss';

interface QuantitySelectorProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const QuantitySelector = ({
  quantity,
  onDecrease,
  onIncrease,
  min = 1,
  max = 99,
  size = 'md',
}: QuantitySelectorProps) => {
  const isMobile = useIsMobile();
  const roundButtonSize: RoundButtonSize =
    size === 'sm' ? 'xsmall' : isMobile ? 'medium' : 'large';
  const sizeClass = styles[`size${size.toUpperCase()}`];
  return (
    <div className={`${styles.container} ${sizeClass}`}>
      <RoundButton
        variant="decrementor"
        size={roundButtonSize}
        onClick={onDecrease}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
        {...(size === 'sm' ? { iconWidth: 8, iconHeight: 8 } : {})}
      />
      <span className={styles.quantity}>{quantity}</span>
      <RoundButton
        variant="incrementor"
        size={roundButtonSize}
        onClick={onIncrease}
        disabled={quantity >= max}
        aria-label="Increase quantity"
        {...(size === 'sm' ? { iconWidth: 14, iconHeight: 14} : {})}
      />
    </div>
  );
};

export default QuantitySelector;
