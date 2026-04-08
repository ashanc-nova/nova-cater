import type { ItemMetadata } from '../../features/menu/types/menu';
import type {
  CartItem,
  CartItemAvailability,
  ApiCartMenuItem,
} from '../../features/cart/types/cart';
import { isMenuSchedulingUnavailable } from './menuSchedulingUtils';

/**
 * Check if an item is out of stock based on metadata
 */
export const isItemOutOfStock = (metadata?: ItemMetadata): boolean => {
  return metadata?.outOfStock?.outOfStock === true;
};

/**
 * Get available stock count
 */
export const getAvailableStock = (metadata?: ItemMetadata): number | undefined => {
  return metadata?.outOfStock?.availableStocks;
};

/**
 * Check if a modifier is out of stock
 */
export const isModifierOutOfStock = (modifierRefId: string, modifiers?: any[]): boolean => {
  if (!modifiers) return false;

  const modifier = modifiers.find((m: any) => m.refId === modifierRefId || m.id === modifierRefId);
  return modifier ? isItemOutOfStock(modifier.metadata) : false;
};

/**
 * Check if customization group has out-of-stock items
 */
export const hasOutOfStockModifiers = (options?: any[]): boolean => {
  if (!options) return false;
  return options.some((option) => isItemOutOfStock(option.metadata));
};

/**
 * Get unavailable modifiers from cart item
 */
export const getUnavailableModifiersFromCartItem = (cartItem: ApiCartMenuItem): string[] => {
  const unavailable: string[] = [];

  if (!cartItem.modifierTypes) return unavailable;

  cartItem.modifierTypes.forEach((modType) => {
    modType.modifiers.forEach((modifier) => {
      if (isItemOutOfStock(modifier.metadata)) {
        unavailable.push(modifier.name);
      }
    });
  });

  return unavailable;
};

/**
 * Check if required modifiers are available
 */
export const areRequiredModifiersAvailable = (customizations?: any[]): boolean => {
  if (!customizations) return true;

  const requiredCustomizations = customizations.filter((c) => c.required);

  for (const customization of requiredCustomizations) {
    const availableOptions = customization.options.filter(
      (opt: any) => !isItemOutOfStock(opt.metadata)
    );

    if (availableOptions.length === 0) {
      return false;
    }
  }

  return true;
};

/**
 * Selected customization shape for selection count validation (min/max per modifier group).
 */
export type SelectedCustomizationForValidation = {
  customizationId: string;
  selectedOptions: Array<{ quantity?: number }>;
}[];

/**
 * Check that in each required modifier group the selected count is >= minModifiersAllowed and <= maxModifiersAllowed.
 * Only required modifier groups are validated; optional modifiers are not considered.
 */
export const isModifierSelectionCountValid = (
  customizations: Array<{
    id: string;
    required: boolean;
    minSelections?: number;
    maxSelections?: number;
  }> | undefined,
  selectedCustomizations: SelectedCustomizationForValidation
): boolean => {
  if (!customizations || customizations.length === 0) return true;

  const requiredCustomizations = customizations.filter((c) => c.required);

  return requiredCustomizations.every((customization) => {
    const sel = selectedCustomizations.find((c) => c.customizationId === customization.id);
    const count = sel
      ? sel.selectedOptions.reduce((sum, o) => sum + (o.quantity ?? 1), 0)
      : 0;
    const min = customization.minSelections ?? 0;
    const max = customization.maxSelections ?? Number.POSITIVE_INFINITY;
    return count >= min && count <= max;
  });
};

/**
 * Check cart item availability
 */
export const checkCartItemAvailability = (apiCartItem: ApiCartMenuItem): CartItemAvailability => {
  // Check if menu item itself is out of stock
  if (isItemOutOfStock(apiCartItem.metadata)) {
    return {
      isAvailable: false,
      reason: 'item_out_of_stock',
    };
  }

  // Check if any modifiers are out of stock
  const unavailableModifiers = getUnavailableModifiersFromCartItem(apiCartItem);

  if (unavailableModifiers.length > 0) {
    return {
      isAvailable: false,
      reason: 'modifier_out_of_stock',
      unavailableModifiers,
    };
  }

  return {
    isAvailable: true,
  };
};

/**
 * Sort cart items - unavailable items first
 */
export const sortCartItemsByAvailability = (items: CartItem[]): CartItem[] => {
  return [...items].sort((a, b) => {
    const aAvailable = a.availability?.isAvailable !== false;
    const bAvailable = b.availability?.isAvailable !== false;

    if (!aAvailable && bAvailable) return -1;
    if (aAvailable && !bAvailable) return 1;
    return 0;
  });
};

/**
 * Check if cart has unavailable items
 */
export const hasUnavailableItems = (items: CartItem[]): boolean => {
  return items.some((item) => item.availability?.isAvailable === false);
};

/**
 * Check if item is unavailable (out of stock OR scheduling unavailable)
 */
export const isItemUnavailable = (metadata?: ItemMetadata): boolean => {
  return isItemOutOfStock(metadata) || isMenuSchedulingUnavailable(metadata);
};
