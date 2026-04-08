import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '../../services/restaurantService';
import type { Restaurant } from '../../types/restaurant';

export const useRestaurantDetailsQuery = ({
  domainName,
  refId,
}: {
  domainName: string | null;
  refId: string;
}) => {
  const queryKey = domainName
    ? ['restaurantDetails', 'domain', domainName]
    : ['restaurantDetails', 'refId', refId];

  const queryFn = async (): Promise<Restaurant> => {
    if (!domainName) {
      return restaurantService.getRestaurantDetails(refId);
    }

    try {
      const domainDetails = await restaurantService.getRestaurantDetailsByDomain(domainName);
      if (domainDetails) {
        return domainDetails;
      }
      console.warn('Domain fetch empty → falling back to refId');
    } catch (err) {
      console.warn('Domain fetch failed → fallback to refId', err);
    }

    return restaurantService.getRestaurantDetails(refId);
  };

  return useQuery<Restaurant>({
    queryKey,
    queryFn,
  });
};

