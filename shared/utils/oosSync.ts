// src/shared/utils/oosSync.ts

import type { MenuItem } from '../../features/menu/types/menu';
import type { CartItem } from '../../features/cart/types/cart';

/**
 * Merge cart OOS state into menu items
 * This ensures menu displays the most up-to-date OOS information
 */
export const syncMenuWithCartOOS = (menuItems: MenuItem[], cartItems: CartItem[]): MenuItem[] => {
  // Create a map of cart items by menu item ID
  const cartOOSMap = new Map<string, CartItem>();
  cartItems.forEach((cartItem) => {
    if (cartItem.availability && !cartItem.availability.isAvailable) {
      cartOOSMap.set(cartItem.menuItem.id, cartItem);
    }
  });

  // Merge OOS state
  return menuItems.map((menuItem) => {
    const cartItem = cartOOSMap.get(menuItem.id);

    if (!cartItem) {
      // No OOS info from cart, use menu API state
      return menuItem;
    }

    // Cart has OOS info for this item
    const availability = cartItem.availability!;

    // Case 1: Item-level OOS or Partial OOS
    if (
      availability.reason === 'item_out_of_stock' ||
      availability.reason === 'partial_stock_unavailable'
    ) {
      return {
        ...menuItem,
        isOutOfStock: true, // Mark item as OOS in menu
      };
    }

    if (availability.reason === 'menu_scheduling_unavailable') {
      return {
        ...menuItem,
        isSchedulingUnavailable: true,
        metadata: {
          ...menuItem.metadata,
          schedulingMessage: availability.schedulingMessage,
        },
      };
    }

    // Case 2: Modifier-level OOS
    if (
      availability.reason === 'customizations_unavailable' ||
      availability.reason === 'required_modifier_unavailable'
    ) {
      const unavailableModifierIds = availability.unavailableModifiers || [];

      // Update customizations to mark OOS modifiers
      const updatedCustomizations = menuItem.customizations?.map((customization) => ({
        ...customization,
        options: customization.options.map((option) => ({
          ...option,
          isOutOfStock: option.isOutOfStock || unavailableModifierIds.includes(option.id), // Merge OOS states
        })),
        hasOutOfStockItems:
          customization.hasOutOfStockItems ||
          customization.options.some((opt) => unavailableModifierIds.includes(opt.id)),
      }));

      return {
        ...menuItem,
        customizations: updatedCustomizations,
      };
    }

    return menuItem;
  });
};

/**
 * Check if menu needs refresh based on cart state
 * Returns true if cart has OOS items that might need menu refresh
 */
export const shouldRefreshMenu = (cartItems: CartItem[]): boolean => {
  return cartItems.some((item) => item.availability && !item.availability.isAvailable);
};

/**
 * Reset menu OOS state when cart is cleared
 * This removes cart-influenced OOS markers
 */
export const resetMenuOOS = (originalMenuItems: MenuItem[]): MenuItem[] => {
  // Return original menu items (from API) without cart-influenced OOS
  return originalMenuItems;
};
