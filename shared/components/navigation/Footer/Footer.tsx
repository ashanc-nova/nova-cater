import { Link } from 'react-router-dom';
import LoginModal from '../../../../features/login/LoginModal';
import { useState } from 'react';
import { useAuthStatus } from '../../../hooks/useAuthStatus';
import { useBusinessUiConfig } from '../../../../features/business/stores/businessConfigStore';
import { useCartStore } from '../../../../features/cart/stores/cartStore';

const Footer = ({ restaurantName }: { restaurantName: string }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isUserLoggedIn, handleLogout, refreshAuthStatus } = useAuthStatus();
  const { columnLayout } = useBusinessUiConfig();
  const { cart } = useCartStore();
  const hasCartItems = (cart?.items?.length ?? 0) > 0;
  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    refreshAuthStatus();
  };
  const handleLogoutClick = () => {
    handleLogout();
  };
  return (
    <footer className={`${columnLayout === 3 ? 'max-w-[1320px]' : 'max-w-[1124px] px-4 lg:px-6 sm:px-6'} w-full border-t border-[#d3d3d5] mx-auto `}>
      <div className={`px-4 py-6 md:pb-6 md:pt-6 md:px-4 ${hasCartItems ? 'pb-[119px]' : 'pb-6'}`}>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-0">
          <h3
            className="text-sm font-medium leading-[21px] md:text-xl md:font-semibold md:leading-[30px] bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(180deg, #171719 22.37%, #747475 115.79%)',
            }}
          >
            {restaurantName}
          </h3>
          <nav className="flex flex-col gap-4 md:flex-row md:gap-12">
            {/* <Link
              to="https://www.novatab.com/privacypolicy"
              className="text-xs font-normal leading-[18px] text-[#121214] no-underline transition-colors duration-200 md:text-base md:leading-6"
            >
              Privacy policy
            </Link> */}
            <Link
              to="/"
              target="_blank"
              className="text-xs font-normal leading-[18px] text-[#121214] no-underline transition-colors duration-200 md:text-base md:leading-6"
              onClick={(e) => e.preventDefault()}
            >
              {isUserLoggedIn ? (
                <span onClick={handleLogoutClick}>Logout</span>
              ) : (
                <span onClick={() => setIsLoginModalOpen(true)}>Login</span>
              )}
            </Link>
          </nav>
        </div>
      </div>
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </footer>
  );
};

export default Footer;
