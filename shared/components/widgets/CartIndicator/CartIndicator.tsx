import styles from './CartIndicator.module.scss';
import ShoppingCart from '../../../../assets/Icons/ShoppingCart';

interface CartIndicatorProps {
  quantity: number;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const CartIndicator = ({ quantity, size = 'md', onClick }: CartIndicatorProps) => {
  if (quantity === 0) return null;

  const sizeClass = styles[`size${size.toUpperCase()}`];

  return (
    <div
      className={`${styles.indicator} ${sizeClass}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <ShoppingCart size={typeof window !== 'undefined' && window.innerWidth <= 1024 ? 12 : 14} />
      <span className={styles.badge}>{quantity}</span>
    </div>
  );
};

export default CartIndicator;
