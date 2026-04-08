import {
  ALLERGEN_ICON_MAP,
  ALLERGEN_ICON_OOS_MAP,
  NON_CLOSED_ALLERGEN_ICON_MAP,
  ALLERGEN_NAME_MAPPING,
  type AllergenIconComponent,
} from './allergenConstants';
import DefaultAllergenIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/DefaultAllergenIcon';
import DefaultAllergenIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/DefaultAllergenIconNE';

export const getAllergenIcon = (
  allergenName: string,
  isOutOfStock: boolean = false,
  isNonClosed: boolean = false
): AllergenIconComponent => {
  const normalizedName = allergenName.toLowerCase().trim();
  const mappedName = ALLERGEN_NAME_MAPPING[normalizedName] || normalizedName;

  if (isOutOfStock) {
    return (
      ALLERGEN_ICON_OOS_MAP[mappedName] || ALLERGEN_ICON_OOS_MAP.default || DefaultAllergenIcon
    );
  }

  if (isNonClosed) {
    return (
      NON_CLOSED_ALLERGEN_ICON_MAP[mappedName] ||
      NON_CLOSED_ALLERGEN_ICON_MAP.default ||
      DefaultAllergenIconNE
    );
  }

  return ALLERGEN_ICON_MAP[mappedName] || DefaultAllergenIcon;
};

export const getAvailableAllergens = (): string[] => Object.keys(ALLERGEN_ICON_MAP);
