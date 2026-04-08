import { CateringProvider, useCatering } from './CateringContext'

export function CartProvider({ children }) {
  return <CateringProvider>{children}</CateringProvider>
}

export function useCart() {
  const {
    cartItems,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    isInCart,
    getCartItemIndex,
    getCartItemQuantity,
    cartTotal,
    clearCart,
  } = useCatering()

  return {
    cart: cartItems,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    isInCart,
    getCartItemIndex,
    getCartItemQuantity,
    cartTotal,
    clearCart,
  }
}
