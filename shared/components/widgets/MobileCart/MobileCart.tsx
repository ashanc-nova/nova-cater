import styles from './MobileCart.module.scss';
import ShoppingCart from '../../../../assets/Icons/ShoppingCart';
import RightChevronIcon from '../../../../assets/Icons/chevrons/RightChevronIcon';
interface MobileCartProps {
  itemCount: number;
  totalPrice: number;
  onCartClick: () => void;
  isCalculatingTotals?: boolean;
}
const MobileCart = ({ itemCount, totalPrice, onCartClick, isCalculatingTotals = false }: MobileCartProps) => {
  return (
    <div className={styles.cartBar} onClick={onCartClick}>
      <div className={styles.iconContainer}>
        <ShoppingCart size={16} color="var(--icon-invert-primary, #F8F8FB)" />
      </div>
      <div className={styles.cartBarContent}>
        <span className={styles.cartBarContentUp}>YOUR CART</span>
        <div className={styles.cartBarContentDown}>
          <div className={styles.cartItems}>{itemCount} items</div>
          <div className={styles.cartItemsSeparator}></div>
          <div className={styles.cartTotal}>
            {isCalculatingTotals ? (
              <span className={styles.totalShimmer} aria-hidden="true" />
            ) : (
              <>
                ${totalPrice?.toFixed(2)} <span className={styles.tax}>+ taxes</span>
              </>
            )}
          </div>
        </div>
        <div className={styles.rightChevronButton}>
          <RightChevronIcon width={20} height={20} color="var(--color-type-brand)" />
        </div>
      </div>
    </div>
  );
};

export default MobileCart;
