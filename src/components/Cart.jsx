import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { cart, increaseQuantity, decreaseQuantity, removeFromCart, cartTotal } = useCart()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const proceedToCheckout = () => {
    localStorage.setItem('snsAppCart', JSON.stringify(cart))
    navigate('/order-details')
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (cart.length === 0) return null

  return (
    <>
      {/* Floating cart indicator - right edge */}
      <div
        className="fixed right-0 inset-y-0 z-50 hidden lg:flex items-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Collapsed tab */}
        <div className={`transition-all duration-300 ease-in-out ${hovered ? 'opacity-0 pointer-events-none translate-x-2' : 'opacity-100 translate-x-0'}`}>
          <div className="bg-gradient-to-b from-primary-500 to-primary-700 text-white rounded-l-[28px] w-[74px] py-5 cursor-pointer shadow-glow flex flex-col items-center gap-3">
            <div className="relative w-10 h-10 rounded-full border border-white/20 bg-black/10 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full border border-white bg-primary-700 text-[10px] font-bold leading-none flex items-center justify-center shadow-sm">
                {totalItems}
              </span>
            </div>
            <div className="w-11 border-t border-white/70"></div>
            <span className="text-[12px] font-semibold">${cartTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Expanded flyout on hover */}
        <div
          className={`fixed right-0 top-16 h-[calc(100vh-4rem-8px)] transition-all duration-300 ease-in-out ${hovered ? 'opacity-100 translate-x-0' : 'opacity-0 pointer-events-none translate-x-4'}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="glass-strong rounded-l-2xl shadow-xl w-[360px] h-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-black/5 dark:border-white/5">
              <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <span className="text-sm font-bold th-heading">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
              <span className="text-xs th-faint ml-auto">${cartTotal.toFixed(2)}</span>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
              {cart.map((item, index) => (
                <div key={index} className="group flex items-center justify-between px-3 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div className="min-w-0 flex-1 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 bg-black/5 dark:bg-white/5">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold th-heading truncate">{item.name}</p>
                      <p className="text-xs th-ghost mt-0.5 truncate">{item.quantity} × {item.unit} · Serves {item.serves * item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button onClick={() => decreaseQuantity(index)} className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 th-muted flex items-center justify-center text-xs font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-all">-</button>
                    <span className="w-5 text-center th-heading font-bold text-xs">{item.quantity}</span>
                    <button onClick={() => increaseQuantity(index)} className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-300 flex items-center justify-center text-xs font-bold hover:bg-primary-500/30 transition-all">+</button>
                    <div className="w-5 h-6 flex items-center justify-center">
                      <button
                        onClick={() => removeFromCart(index)}
                        aria-label={`Remove ${item.name}`}
                        className="text-red-500/85 hover:text-red-500 transition-all opacity-0 translate-x-1 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto flex items-center justify-center"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout */}
            <div className="p-4 border-t border-black/5 dark:border-white/5">
              <button
                onClick={proceedToCheckout}
                className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
              >
                Checkout
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile floating bar */}
      <div className="fixed bottom-6 left-4 right-4 lg:hidden z-50">
        <button
          onClick={proceedToCheckout}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-700 text-white shadow-glow-lg flex items-center justify-between px-5 hover:scale-[1.02] transition-transform duration-200"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span className="text-sm font-bold">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
          </div>
          <span className="text-sm font-bold">${cartTotal.toFixed(2)} →</span>
        </button>
      </div>
    </>
  )
}
