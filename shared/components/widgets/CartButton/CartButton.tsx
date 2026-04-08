import CartIcon from '../../../../assets/Icons/CartIcon';
import styles from './CartButton.module.scss';

type CartButtonProps = {
  count?: number;
  amount?: number | string;
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  isCalculatingTotals?: boolean;
};

const CartButton = ({ count = 0, amount, onClick, className, label = 'Cart', isCalculatingTotals = false }: CartButtonProps) => {
  const hasItems = count > 0;
  const displayAmount =
    amount === undefined
      ? undefined
      : typeof amount === 'number'
        ? `$${amount?.toFixed(2)}`
        : amount;

  return (
    <button
      type="button"
      aria-label="Cart"
      className={`${styles.cartButton} ${hasItems ? styles.hasItems : ''} ${className}`}
      onClick={onClick}
    >
      <div className={styles.iconWrap}>
        <CartIcon />
        {hasItems && <span className={styles.badge}>{count}</span>}
      </div>
      {hasItems && (
        <div className={styles.cartDetails}>
          <span className={styles.label}>{label}</span>
          <span className={styles.divider} aria-hidden="true" />
          {isCalculatingTotals ? (
            <span className={styles.amountShimmer} aria-hidden="true" />
          ) : (
            displayAmount && <span className={styles.amount}>{displayAmount}</span>
          )}
        </div>
      )}
    </button>
  );
};

export default CartButton;
