import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Lottie from "lottie-react";
import loaderAnimation from "../../assets/lotties/loader.json";

import useGetRestaurantDetails from "../hooks/useGetRestaurantDetails";
import { useBusinessConfig } from "../../features/business/hooks/useBusinessConfig";

const AppBootstrapGate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { restaurantDetails, isRestaurantLoading } =
    useGetRestaurantDetails();

  const { businessConfig, isLoading: isBusinessConfigLoading } =
    useBusinessConfig(restaurantDetails?.businessRefId);

  const isEnterprise =
    restaurantDetails?.isEnterprise === true ||
    businessConfig?.type === "enterprise";
  const isLoading = isRestaurantLoading || isBusinessConfigLoading;

  useEffect(() => {
    if (isLoading) return;

    const path = location.pathname;

    // =========================
    // ENTERPRISE MODE
    // =========================
    if (isEnterprise) {
      // Allow /location (enterprise landing) and /store/ routes
      if (path === "/location") return;
      if (path.startsWith("/store/")) return;
      navigate("/location", { replace: true });
      return;
    }

    // =========================
    // RESTAURANT MODE
    // =========================
    // All routes pass through (including /location for store details)

  }, [isEnterprise, isLoading, location.pathname, navigate]);

  // Skip bootstrap loader on /location — LocationSelector has its own loading flow.
  // Still render the gate so the enterprise redirect useEffect runs after loading completes.
  const isLocationPage =
    location.pathname === '/location' || location.pathname.endsWith('/location');

  if (isLoading && !isLocationPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Lottie
          animationData={loaderAnimation}
          loop
          className="w-[92px] h-[94px]"
        />
      </div>
    );
  }

  return <Outlet />;
};

export default AppBootstrapGate;