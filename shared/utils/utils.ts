import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { IMAGE_BASE_URL } from '../../configs/environments/config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the server base URL for images depending on environment.
 *
 * @param env (optional) Provide override environment string ('dev', 'qa', 'uat')
 */
export function getImageBaseUrl(env?: string): string {
  if (env) {
    switch (env) {
      case 'dev':
      case 'dev03':
        return 'https://dev03.as1.dev.bakeit360.com/unified/restaurant-microservice';
      case 'qa':
      case 'qa02':
        return 'https://qa02.as1.dev.bakeit360.com/unified/restaurant-microservice';
      case 'uat':
        return 'https://uat.as1.dev.bakeit360.com/unified/restaurant-microservice';
      default:
        // fallback to dev
        return 'https://dev03.as1.dev.bakeit360.com/unified/restaurant-microservice';
    }
  }
  // Environment default (from env file or fallback to dev03)
  return (
    import.meta.env.VITE_IMAGE_BASE_URL ||
    'https://dev03.as1.dev.bakeit360.com/unified/restaurant-microservice'
  );
}
export const getRestaurantLogoUrl = (restaurantId: string) => {
  return `${getImageBaseUrl()}/api/Restaurants/${restaurantId}/logo`;
};
export const getImageUrl = (imageName: string) => {
  return `${IMAGE_BASE_URL}${imageName}`;
};
