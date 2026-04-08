import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Carousel from '../components/Carousel'
import Cart from '../components/Cart'
import { useCart } from '../context/CartContext'
import { categories, menuItems } from '../data/menuData'

export default function Home() {
  const [activeCategory, setActiveCategory] = useState(0)
  const [menuLayout, setMenuLayout] = useState('grid')
  const { addToCart, isInCart, getCartItemIndex, getCartItemQuantity, increaseQuantity, decreaseQuantity } = useCart()

  useEffect(() => { window.scrollTo(0, 0) }, [])

  const currentItems = menuItems[categories[activeCategory]] || []

  return (
    <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      {/* Hero Section: 2 columns */}
      <section className="mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-stretch">
          {/* Left: Branding */}
          <div className="md:w-1/2 flex flex-col justify-center animate-slide-up">
            <div className="inline-flex items-center gap-2 badge-glass text-primary-300 mb-3 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse-slow"></span>
              Catering &bull; Platters &bull; Party Trays
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-5xl th-heading mb-3 tracking-tight leading-tight">
              Famous<br/>
              <span className="gradient-text">Steakburger Catering</span>
            </h1>
            <p className="th-muted text-base max-w-lg leading-relaxed mb-4">
              Platters, trays, and shake packs for any event. The original better burger since 1934.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/my-orders" className="btn-ghost text-sm py-2.5 px-5 inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                View My Orders
              </Link>
            </div>
          </div>

          {/* Right: Offers Carousel */}
          <div className="md:w-1/2 flex flex-col justify-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <Carousel slideCount={3} autoPlay={true} interval={4000}>
              <div className="w-full flex-shrink-0">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=350&fit=crop" alt="Catering Deal" className="w-full h-44 object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-3 left-4">
                    <span className="badge-glass text-primary-300 text-xs">20% OFF</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-lg th-heading mb-1">First Catering Order</h3>
                  <p className="th-muted text-sm">Get 20% off your first catering order of $100+</p>
                </div>
              </div>
              <div className="w-full flex-shrink-0">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=350&fit=crop" alt="Shake Package" className="w-full h-44 object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-3 left-4">
                    <span className="badge-glass text-primary-300 text-xs">FREE SHAKES</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-lg th-heading mb-1">Free Shake Pack</h3>
                  <p className="th-muted text-sm">Order 3+ platters and get a 10-cup shake pack free</p>
                </div>
              </div>
              <div className="w-full flex-shrink-0">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=350&fit=crop" alt="Party Bundle" className="w-full h-44 object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-3 left-4">
                    <span className="badge-glass text-primary-300 text-xs">PARTY BUNDLE</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-lg th-heading mb-1">The Game Day Bundle</h3>
                  <p className="th-muted text-sm">2 burger platters + fries tray + drinks for $139.99</p>
                </div>
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      {/* Menu + Cart Section */}
      <section>
        <div>
          {/* Menu Section */}
          <div>
            {/* Category Tabs + Layout Toggle */}
            <div className="flex items-center justify-between mb-8 gap-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
                {categories.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveCategory(index)}
                    className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                      activeCategory === index
                        ? 'bg-primary-500 text-white'
                        : 'border border-black/10 dark:border-white/10 th-muted hover:th-heading'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {/* Layout Toggle */}
              <div className="flex gap-1 glass rounded-xl p-1 flex-shrink-0">
                <button
                  onClick={() => setMenuLayout('grid')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    menuLayout === 'grid' ? 'bg-primary-500/20 text-primary-400' : 'th-faint hover:th-muted'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setMenuLayout('compact')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    menuLayout === 'compact' ? 'bg-primary-500/20 text-primary-400' : 'th-faint hover:th-muted'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* GRID LAYOUT (2 col) */}
            {menuLayout === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {currentItems.map((item, index) => (
                  <div key={`grid-${index}`} className="glass rounded-3xl overflow-hidden hover-card group">
                    <div className="relative">
                      <img src={item.image} alt={item.name} className="w-full h-44 object-cover"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        <span className="badge-glass text-primary-300 text-xs backdrop-blur-md">Serves {item.serves}</span>
                        <span className="badge-glass th-ghost text-xs backdrop-blur-md">{item.unit}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display font-bold th-heading group-hover:text-primary-400 transition-colors mb-1.5">{item.name}</h3>
                      <p className="th-faint text-sm leading-relaxed mb-4 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold gradient-text">${item.price.toFixed(2)}</span>
                          <span className="text-xs th-ghost ml-1">/ {item.unit.split(' ')[0]}</span>
                        </div>
                        <div>
                          {!isInCart(item) ? (
                            <button onClick={() => addToCart(item)} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                              Add
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button onClick={() => decreaseQuantity(getCartItemIndex(item))} className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 th-heading hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-all duration-200 text-sm font-medium">-</button>
                              <span className="w-8 text-center th-heading font-bold text-sm">{getCartItemQuantity(item)}</span>
                              <button onClick={() => increaseQuantity(getCartItemIndex(item))} className="w-8 h-8 rounded-xl bg-primary-500/20 border border-primary-500/30 text-primary-300 hover:bg-primary-500/30 flex items-center justify-center transition-all duration-200 text-sm font-medium">+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COMPACT GRID LAYOUT (3 col) */}
            {menuLayout === 'compact' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currentItems.map((item, index) => (
                  <div key={`compact-${index}`} className="glass rounded-2xl overflow-hidden hover-card group">
                    <div className="relative">
                      <img src={item.image} alt={item.name} className="w-full h-28 object-cover"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute bottom-2 left-2">
                        <span className="badge-glass text-primary-300 text-[10px] backdrop-blur-md">Serves {item.serves}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-display font-bold text-sm th-heading group-hover:text-primary-400 transition-colors mb-0.5 truncate">{item.name}</h3>
                      <p className="text-[10px] th-ghost mb-1.5 truncate">{item.unit}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold gradient-text">${item.price.toFixed(2)}</span>
                        <div>
                          {!isInCart(item) ? (
                            <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                            </button>
                          ) : (
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => decreaseQuantity(getCartItemIndex(item))} className="w-6 h-6 rounded-md bg-black/5 dark:bg-white/5 th-heading flex items-center justify-center text-xs font-medium transition-all">-</button>
                              <span className="w-5 text-center th-heading font-bold text-xs">{getCartItemQuantity(item)}</span>
                              <button onClick={() => increaseQuantity(getCartItemIndex(item))} className="w-6 h-6 rounded-md bg-primary-500/20 text-primary-300 flex items-center justify-center text-xs font-medium transition-all">+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Floating Cart Indicator */}
      <Cart />
    </main>
  )
}
