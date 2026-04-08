// ingredientsMapper.ts
import type { IngredientsList, Ingredients } from '../../features/menu/types/menu';

// Build a map from code to name using the ingredients master list
export const buildIngredientsMap = (list: IngredientsList[]) => {
  const map = new Map<string, string>();
  list.forEach((item) => {
    if (item.code && item.name) {
      map.set(item.code, item.name);
    }
  });
  return map;
};

// For each menu ingredient, fill in the name from the map using refId (which matches code in master list)
export const mapIngredientsWithNames = (
  ingredients: Ingredients[] | undefined,
  nameMap: Map<string, string>
): Ingredients[] =>

  (ingredients || []).map((ing) => {
    const name = ing.refId ? nameMap.get(ing.refId) : undefined;
    return {
      ...ing,
      name: ing.name || name || '',
    };
  });
