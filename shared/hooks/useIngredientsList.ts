// useIngredientsList.ts
import { useQuery } from '@tanstack/react-query';
import { menuService } from '../../features/menu/services/menuService';

export const useIngredientsList = () =>
  useQuery({
    queryKey: ['ingredientsList'],
    queryFn: () => menuService.getIngredientsList(),
    staleTime: 10 * 60 * 1000, // avoid re-fetch for 10 mins
  });
