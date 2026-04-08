import { useEffect } from 'react';
import { useRestaurantStore } from '../../features/cart/stores/restaurantStore';

export const useRestaurantStateSync = ({
  details,
  isLoading,
}: {
  details: any;
  isLoading: boolean;
}) => {
  const { setRestaurant, setLoading } = useRestaurantStore();

  useEffect(() => {
    if (details) {
      setRestaurant(details);
    }
  }, [details, setRestaurant]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);
};

