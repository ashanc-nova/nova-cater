import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('snsAppCart')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('snsAppCart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (item) => {
    setCart(prev => {
      const itemKey = item.cartKey || item.name
      const existing = prev.find(c => (c.cartKey || c.name) === itemKey)
      if (existing) {
        return prev.map(c => (c.cartKey || c.name) === itemKey ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  const increaseQuantity = (index) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, quantity: item.quantity + 1 } : item))
  }

  const decreaseQuantity = (index) => {
    setCart(prev => {
      if (prev[index].quantity > 1) {
        return prev.map((item, i) => i === index ? { ...item, quantity: item.quantity - 1 } : item)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const isInCart = (item) => {
    if (item.cartKey) {
      return cart.some(c => (c.cartKey || c.name) === item.cartKey)
    }
    return cart.some(c => c.name === item.name)
  }

  const getCartItemIndex = (item) => {
    if (item.cartKey) {
      return cart.findIndex(c => (c.cartKey || c.name) === item.cartKey)
    }
    return cart.findIndex(c => c.name === item.name)
  }

  const getCartItemQuantity = (item) => {
    if (item.cartKey) {
      const found = cart.find(c => (c.cartKey || c.name) === item.cartKey)
      return found ? found.quantity : 0
    }
    return cart
      .filter(c => c.name === item.name)
      .reduce((sum, cartItem) => sum + cartItem.quantity, 0)
  }

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }, [cart])

  const clearCart = () => {
    setCart([])
    localStorage.removeItem('snsAppCart')
  }

  return (
    <CartContext.Provider value={{
      cart, setCart, addToCart, removeFromCart, increaseQuantity, decreaseQuantity,
      isInCart, getCartItemIndex, getCartItemQuantity, cartTotal, clearCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
