import { useRestaurantDomainResolver } from './useRestaurantDomainResolver';
import { useRestaurantDetailsQuery } from './useRestaurantDetailsQuery';
import { useRestaurantStateSync } from './useRestaurantStateSync';

const useGetRestaurantDetails = () => {
  const { domainName, refIdToUse } = useRestaurantDomainResolver();
  const { data, isLoading } = useRestaurantDetailsQuery({
    domainName,
    refId: refIdToUse,
  });

  useRestaurantStateSync({
    details: data,
    isLoading,
  });

  return { restaurantDetails: data, isRestaurantLoading: isLoading };
};

export default useGetRestaurantDetails;
