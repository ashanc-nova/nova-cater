import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorePath } from '../../../hooks/useStorePath';
import { useCartStore } from '../../../../features/cart/stores/cartStore';
import styles from './Header.module.scss';
import LoginModal from '../../../../features/login/LoginModal';
import YourOrdersIcon from '../../../../assets/YourOrdersIcon';
import LogoutIcon from '../../../../assets/LogoutIcon';
import ProfileDropdown from '../../widgets/ProfileDropdown/ProfileDropdown';
import { useRestaurantStore } from '../../../../features/cart/stores/restaurantStore';
import { getImageUrl } from '../../../utils/utils';
import { useAuthStatus } from '../../../hooks/useAuthStatus';
import { useGiftCardPurchaseSettings } from '../../../../features/giftCard/hooks/useGiftCardPurchaseSettings';
import StoreIcon from '../../../../assets/Icons/StoreIcon';
import PencilIcon from '../../../../assets/PencilIcon';
import UserAvatar from '../../widgets/UserAvatar/UserAvatar';
import CartButton from '../../widgets/CartButton/CartButton';
import { getNextStoreTimeLabel } from '../../../utils/storeStatusUtils';
import { useBusinessUiConfig } from '../../../../features/business/stores/businessConfigStore';
import BackButton from '../../../../assets/Icons/BackButton';
import GiftCardButton from '../../widgets/GiftCardButton/GiftCardButton';
import NovaTabLogo from '../../../../assets/Icons/NovaTabLogo';
import NovaTabLogoMob from '../../../../assets/Icons/NovaTabLogoMob';
import DefaultLogo from '../../../../assets/StoreSubDued.svg'
import UserMenuModal from '../../ui/UserMenuModal/UserMenuModal';
import type { MenuItem as UserMenuItem } from '../../ui/UserMenuModal/UserMenuModal';

interface HeaderProps {
  onCartClick?: () => void;
  /** Optional slot for order floater in the header bar (injected by orders feature via composition) */
  orderFloaterDesktopSlot?: ReactNode;
  /** Optional slot for mobile bottom order floater (injected by orders feature via composition) */
  orderFloaterMobileSlot?: ReactNode;
  /** When true, renders only the back button (e.g. for Location page). */
  backOnly?: boolean;
}

const Header = ({
  onCartClick,
  orderFloaterDesktopSlot = null,
  orderFloaterMobileSlot = null,
  backOnly = false,
}: HeaderProps) => {
  const { cart, isCalculatingTotals } = useCartStore();
  const navigate = useNavigate();
  const sp = useStorePath();
  const locationPath = sp('/location');
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { restaurant } = useRestaurantStore();
  const { brandLogo, columnLayout } = useBusinessUiConfig();
  const { isUserLoggedIn, userInitials, refreshAuthStatus, handleLogout } = useAuthStatus();
  const { data: giftCardSettings } = useGiftCardPurchaseSettings();

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    refreshAuthStatus();
  };
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const menuItems = [
    {
      id: 'orders',
      label: 'Your orders',
      icon: YourOrdersIcon,
      onClick: () => {
        navigate(sp('/orders'));
        setIsProfileOpen(false);
      },
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: LogoutIcon,
      onClick: () => {
        handleLogout();
        setIsProfileOpen(false);
      },
    },
  ];

  const mobileMenuItems: UserMenuItem[] = [
    {
      id: 'orders',
      icon: <YourOrdersIcon size={20} />,
      label: 'Your orders',
      onClick: () => navigate('/orders'),
    },
    {
      id: 'logout',
      icon: <LogoutIcon size={20} />,
      label: 'Logout',
      onClick: () => handleLogout(),
    },
  ];

  const handleAvatarClick = () => {
    if (window.innerWidth < 768) {
      setIsUserMenuOpen(true);
    } else {
      setIsProfileOpen(true);
    }
  };
  const restaurantLogoUrl = getImageUrl(restaurant?.imageUrl || '');
  const [logoWidth, setLogoWidth] = useState<number | null>(null);
  const FIXED_HEIGHT = 44;

  // Calculate aspect ratio when image loads
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const calculatedWidth = FIXED_HEIGHT * aspectRatio;
      setLogoWidth(calculatedWidth);
    }
  };

  // Reset width when logo URL changes
  useEffect(() => {
    setLogoWidth(null);
  }, [restaurantLogoUrl]);
  const isGiftCardEnabled =
    giftCardSettings?.giftCardPurchaseEnableConfig.cardTypeSetting.isDigitalCardPurchaseEnabled;

  const isRestaurantClosed =
    restaurant?.storeStatus?.isStoreClosed || cart?.storeStatus?.isStoreClosed;

  if (backOnly) {
    return (
      <header className={`${styles.header} ${styles.backOnly}`}>
        <div className={styles.backOnlyBar}>
          <div className={styles.backButtonWrapper}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={styles.backButton}
              aria-label="Go back"
            >
              <BackButton />
            </button>
          </div>
          <div className={styles.center}>
            <button
              type="button"
              aria-label="Logo"
              className={styles.logoContainer}
              onClick={() => navigate(sp('/'))}
            >
              <img src={restaurantLogoUrl} alt={restaurant?.name} onLoad={handleImageLoad} />
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className={`${styles.header}`}>
        <div className={`${styles.bar}${columnLayout === 3 ? ` ${styles.bar3ColumnLayout}` : ''}`}>
          <div className={styles.left}>
          <div className={styles.storeLocationIconContainer} onClick={() => navigate(locationPath)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(locationPath)} aria-label="Change location">
            <span className={styles.storeIconDefault}>
              <StoreIcon width={20} height={20} />
            </span>
            <span className={styles.storeIconHover} aria-hidden><PencilIcon /></span>
          </div>
            <button
              type="button"
              aria-label="Logo"
              className={styles.storeLogoMobileContainer}
              onClick={() => navigate(locationPath)}
            >
              <div className={styles.storeLogoMobileImageContainer}>
                {brandLogo ? (
                  <img src={brandLogo} alt={restaurant?.name} onLoad={handleImageLoad} />
                ) : (
                  <NovaTabLogoMob />
                )}
              </div>
            </button>

            <button
              type="button"
              className={styles.meta}
              onClick={() => navigate(locationPath)}
              aria-label="Change location"
            >
              <div className={styles.name}>{restaurant?.name}</div>
              <div className={styles.statusRow}>
                <span
                  className={`${styles.statusPill} ${restaurant?.storeStatus?.isStoreClosed || cart?.storeStatus?.isStoreClosed ? styles.closed : styles.open}`}
                >
                  <span className={styles.statusDot} />
                  {restaurant?.storeStatus?.isStoreClosed || cart?.storeStatus?.isStoreClosed
                    ? 'Closed'
                    : 'Open now'}
                </span>
                <>
                  <span className={styles.dotIcon} />
                  <span className={styles.subtle}>
                    {getNextStoreTimeLabel(restaurant?.storeStatus, isRestaurantClosed)}
                  </span>
                </>
              </div>
            </button>
          </div>

          <div className={styles.center}>
            <button
              type="button"
              aria-label="Logo"
              className={styles.logoContainer}
              onClick={() => navigate(sp('/'))}
            >
              {brandLogo ? (
                <img src={brandLogo} alt={restaurant?.name} onLoad={handleImageLoad} />
              ) : (
                <NovaTabLogo />
              )}
            </button>
          </div>

          <div className={styles.right}>
            {orderFloaterDesktopSlot}
            <div className={styles.cartButtonContainer}>
              <CartButton
                count={itemCount}
                amount={itemCount > 0 ? cart.total : undefined}
                label={itemCount > 0 ? 'Checkout' : 'Cart'}
                onClick={onCartClick}
                isCalculatingTotals={isCalculatingTotals}
              />
            </div>
            {isGiftCardEnabled && (
              <div className={styles.giftCardButtonContainer}>
                <GiftCardButton onClick={() => navigate(sp('/buy-gift-card'))} />
              </div>
            )}

            {isUserLoggedIn ? (
              <>
                <div className={styles.userAvatarContainer}>
                  <UserAvatar
                    userInitials={userInitials || ''}
                    onClick={handleAvatarClick}
                  />
                </div>
                <ProfileDropdown
                  isOpen={isProfileOpen}
                  onClose={() => setIsProfileOpen(false)}
                  menuItems={menuItems}
                />
                <UserMenuModal
                  isOpen={isUserMenuOpen}
                  onClose={() => setIsUserMenuOpen(false)}
                  menuItems={mobileMenuItems}
                />
              </>
            ) : (
              <UserAvatar
                userInitials={userInitials || ''}
                onClick={() => setIsLoginModalOpen(true)}
              />
            )}
          </div>
        </div>

        {isLoginModalOpen && (
          <LoginModal
            onClose={() => setIsLoginModalOpen(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </header>

      {/* Mobile: order floater slot (injected by orders feature when present) */}
      {orderFloaterMobileSlot}
    </>
  );
};

export default Header;
