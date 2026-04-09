import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Carousel from '../components/Carousel'
import Cart from '../components/Cart'
import { useCart } from '../context/CartContext'
import { categories, menuItems } from '../data/menuData'

const platterSizeOptions = [
  { id: 'quarter', label: 'Quarter Tray', multiplier: 0.6, unitLabel: 'quarter tray', servesMultiplier: 0.5 },
  { id: 'half', label: 'Half Tray', multiplier: 0.8, unitLabel: 'half tray', servesMultiplier: 0.75 },
  { id: 'full', label: 'Full Tray', multiplier: 1, unitLabel: 'full tray', servesMultiplier: 1 },
]

const platterModifierSections = [
  {
    id: 'cheese',
    title: 'Cheese Style',
    type: 'single',
    options: [
      { id: 'american', label: 'American Cheese', priceDelta: 0 },
      { id: 'swiss', label: 'Swiss Cheese', priceDelta: 1.5 },
      { id: 'double-cheese', label: 'Extra Cheese', priceDelta: 2.5 },
    ],
  },
  {
    id: 'toppings',
    title: 'Add Extras',
    type: 'multi',
    options: [
      { id: 'grilled-onions', label: 'Grilled Onions', priceDelta: 1.5 },
      { id: 'pickles', label: 'Extra Pickles', priceDelta: 1 },
      { id: 'bacon', label: 'Crispy Bacon', priceDelta: 4 },
      { id: 'jalapeno', label: 'Jalapeno Relish', priceDelta: 1.5 },
    ],
  },
  {
    id: 'sauce',
    title: 'House Sauce',
    type: 'single',
    options: [
      { id: 'signature', label: 'Signature Sauce', priceDelta: 0 },
      { id: 'bbq', label: 'Smoky BBQ', priceDelta: 0.75 },
      { id: 'ranch', label: 'Ranch Dip Cups', priceDelta: 1.25 },
    ],
  },
]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState(0)
  const [menuLayout, setMenuLayout] = useState('grid')
  const [modifierItem, setModifierItem] = useState(null)
  const [modifierState, setModifierState] = useState({
    size: 'full',
    cheese: 'american',
    toppings: [],
    sauce: 'signature',
    quantity: 1,
  })
  const sectionRefs = useRef({})
  const isAutoScrollingRef = useRef(false)
  const { addToCart, isInCart, getCartItemIndex, getCartItemQuantity, increaseQuantity, decreaseQuantity } = useCart()

  useEffect(() => { window.scrollTo(0, 0) }, [])

  const highlightedItems = new Set([0, 1, 3])
  const stickyCategoryOffset = 168

  useEffect(() => {
    const updateActiveCategoryFromScroll = () => {
      if (isAutoScrollingRef.current) return

      let nextActive = 0
      categories.forEach((_, index) => {
        const section = sectionRefs.current[index]
        if (!section) return
        const sectionTop = section.getBoundingClientRect().top
        if (sectionTop - stickyCategoryOffset <= 0) nextActive = index
      })

      setActiveCategory(prev => (prev === nextActive ? prev : nextActive))
    }

    window.addEventListener('scroll', updateActiveCategoryFromScroll, { passive: true })
    updateActiveCategoryFromScroll()

    return () => {
      window.removeEventListener('scroll', updateActiveCategoryFromScroll)
    }
  }, [])

  const scrollToCategory = (index) => {
    const section = sectionRefs.current[index]
    if (!section) return

    setActiveCategory(index)
    isAutoScrollingRef.current = true
    const scrollTop = section.getBoundingClientRect().top + window.scrollY - stickyCategoryOffset
    window.scrollTo({ top: scrollTop, behavior: 'smooth' })

    window.setTimeout(() => {
      isAutoScrollingRef.current = false
    }, 550)
  }

  const openModifierModal = (item) => {
    setModifierItem(item)
    setModifierState({
      size: 'full',
      cheese: 'american',
      toppings: [],
      sauce: 'signature',
      quantity: 1,
    })
  }

  const closeModifierModal = () => {
    setModifierItem(null)
  }

  const toggleMultiOption = (sectionId, optionId) => {
    setModifierState(prev => {
      const current = prev[sectionId]
      const next = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId]
      return { ...prev, [sectionId]: next }
    })
  }

  const getConfiguredPlatter = () => {
    if (!modifierItem) return null

    const selectedSize = platterSizeOptions.find(option => option.id === modifierState.size) || platterSizeOptions[2]
    const selectedCheese = platterModifierSections[0].options.find(option => option.id === modifierState.cheese)
    const selectedSauce = platterModifierSections[2].options.find(option => option.id === modifierState.sauce)
    const selectedToppings = platterModifierSections[1].options.filter(option => modifierState.toppings.includes(option.id))

    const modifierUpcharge = [
      selectedCheese?.priceDelta || 0,
      selectedSauce?.priceDelta || 0,
      ...selectedToppings.map(option => option.priceDelta || 0),
    ].reduce((sum, value) => sum + value, 0)

    const unitPrice = Number((modifierItem.price * selectedSize.multiplier + modifierUpcharge).toFixed(2))
    const serves = Math.max(4, Math.round(modifierItem.serves * selectedSize.servesMultiplier))
    const selectedModifiers = [
      `Size: ${selectedSize.label}`,
      selectedCheese ? `Cheese: ${selectedCheese.label}` : null,
      selectedSauce ? `Sauce: ${selectedSauce.label}` : null,
      ...selectedToppings.map(option => option.label),
    ].filter(Boolean)

    const cartKey = [
      modifierItem.name,
      selectedSize.id,
      modifierState.cheese,
      [...modifierState.toppings].sort().join(','),
      modifierState.sauce,
    ].join('|')

    return {
      ...modifierItem,
      price: unitPrice,
      serves,
      unit: selectedSize.unitLabel,
      cartKey,
      selectedModifiers,
      quantity: modifierState.quantity,
    }
  }

  const configuredPlatter = getConfiguredPlatter()
  const configuredTotal = configuredPlatter ? configuredPlatter.price * modifierState.quantity : 0

  const addConfiguredPlatterToCart = () => {
    if (!configuredPlatter) return
    Array.from({ length: modifierState.quantity }).forEach(() => addToCart(configuredPlatter))
    closeModifierModal()
  }

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
              Famous<br />
              <span className="gradient-text">Steakburger Catering</span>
            </h1>
            <p className="th-muted text-base max-w-lg leading-relaxed mb-4">
              Platters, trays, and shake packs for any event. The original better burger since 1934.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/my-orders" className="btn-ghost text-sm py-2.5 px-5 inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                View My Orders
              </Link>
            </div>
          </div>

          {/* Right: Offers Carousel */}
          <div className="md:w-1/2 flex flex-col justify-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <Carousel slideCount={3} autoPlay={true} interval={4000}>
              <div className="w-full flex-shrink-0">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=350&fit=crop" alt="Catering Deal" className="w-full h-44 object-cover" />
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
                  <img src="https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=350&fit=crop" alt="Shake Package" className="w-full h-44 object-cover" />
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
                  <img src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=350&fit=crop" alt="Party Bundle" className="w-full h-44 object-cover" />
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
            <div className="sticky top-16 z-30 -mx-2 px-2 py-3 mb-8 glass-nav border-y border-black/5 dark:border-white/5 rounded-2xl">

              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
                  {categories.map((category, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToCategory(index)}
                      className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${activeCategory === index
                        ? 'bg-primary-500 text-white'
                        : 'border border-black/10 dark:border-white/10 th-muted hover:th-heading'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 glass rounded-xl p-1 flex-shrink-0">
                  <button
                    onClick={() => setMenuLayout('grid')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${menuLayout === 'grid' ? 'bg-primary-500/20 text-primary-400' : 'th-faint hover:th-muted'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setMenuLayout('compact')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${menuLayout === 'compact' ? 'bg-primary-500/20 text-primary-400' : 'th-faint hover:th-muted'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 7h3M5 12h3M5 17h3M11 7h8M11 12h8M11 17h8" />
                    </svg>
                  </button>
                </div>

              </div>
            </div>

            <div className="space-y-10">
              {categories.map((category, categoryIndex) => {
                const items = menuItems[category] || []
                const isSteakburgerCategory = category === 'Steakburger Platters'

                return (
                  <section
                    key={category}
                    ref={element => {
                      sectionRefs.current[categoryIndex] = element
                    }}
                    className="scroll-mt-44"
                  >
                    <h2 className="font-display text-2xl font-bold th-heading mb-5">{category}</h2>

                    {menuLayout === 'grid' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {items.map((item, index) => (
                          <div key={`grid-${categoryIndex}-${index}`} className="glass rounded-3xl p-5 hover-card group">
                            <div className="flex items-stretch gap-4">
                              <div className="min-w-0 flex-1 flex flex-col">
                                <h3 className="font-display font-bold th-heading group-hover:text-primary-400 transition-colors mb-1.5 text-lg leading-tight">
                                  {item.name}
                                </h3>
                                <p className="th-faint text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                                  {item.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 mb-5">
                                  <span className="badge-glass text-primary-300 text-xs backdrop-blur-md">Serves {item.serves}</span>
                                  <span className="badge-glass th-ghost text-xs backdrop-blur-md">{item.unit}</span>
                                </div>

                                <div className="flex items-end justify-between gap-4">
                                  <div>
                                    <span className="text-xl font-bold gradient-text">${item.price.toFixed(2)}</span>
                                    <span className="text-xs th-ghost ml-1">/ {item.unit.split(' ')[0]}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="w-28 sm:w-36 md:w-40 shrink-0 flex flex-col items-end justify-between ml-auto">
                                <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-3xl overflow-hidden">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                                  <div className="absolute top-2 left-2">
                                    {highlightedItems.has(index) && (
                                      <span className="badge-glass text-primary-300 text-[11px] backdrop-blur-md">
                                        Popular
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-4 w-full flex justify-end">
                                  <button
                                    onClick={() => isSteakburgerCategory ? openModifierModal(item) : addToCart(item)}
                                    className="relative w-11 h-11 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 transition-colors inline-flex items-center justify-center shadow-lg shadow-primary-500/30"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                    {getCartItemQuantity(item) > 0 && (
                                      <span className="absolute -top-2 -right-2 min-w-[21px] h-[21px] px-1 rounded-full bg-white text-primary-500 text-xs font-bold inline-flex items-center justify-center leading-none border border-primary-200 shadow-sm">
                                        {getCartItemQuantity(item)}
                                      </span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {menuLayout === 'compact' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {items.map((item, index) => (
                          <div key={`compact-${categoryIndex}-${index}`} className="glass rounded-2xl overflow-hidden hover-card group">
                            <div className="relative">
                              <img src={item.image} alt={item.name} className="w-full h-28 object-cover" />
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
                                <button
                                  onClick={() => isSteakburgerCategory ? openModifierModal(item) : addToCart(item)}
                                  className="relative w-8 h-8 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                  {getCartItemQuantity(item) > 0 && (
                                    <span className="absolute -top-2 -right-2 min-w-[19px] h-[19px] px-1 rounded-full bg-white text-primary-500 text-[11px] font-bold inline-flex items-center justify-center leading-none border border-primary-200 shadow-sm">
                                      {getCartItemQuantity(item)}
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          </div>

        </div>
      </section>

      {modifierItem && configuredPlatter && (
        <div className="fixed inset-0 z-[70]">
          <button className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={closeModifierModal} aria-label="Close modifier modal" />
          <div className="absolute inset-y-4 right-4 left-4 md:left-auto md:w-[560px] glass-strong rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center gap-4 px-6 py-5 border-b border-black/5 dark:border-white/5">
              <button onClick={closeModifierModal} className="w-11 h-11 rounded-full border border-black/10 dark:border-white/10 th-muted flex items-center justify-center hover:th-heading transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <span className="font-display text-2xl th-heading">Customize platter</span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex gap-4 items-start pb-6 border-b border-black/5 dark:border-white/5">
                <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0">
                  <img src={modifierItem.image} alt={modifierItem.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-3xl leading-tight th-heading mb-2">{modifierItem.name}</h2>
                  <p className="th-muted text-sm leading-relaxed">{modifierItem.description}</p>
                </div>
              </div>

              <section className="py-6 border-b border-black/5 dark:border-white/5">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h3 className="font-display text-xl th-heading">Choose size</h3>
                    <p className="th-muted text-sm">Full tray is selected by default</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {platterSizeOptions.map(option => {
                    const selected = modifierState.size === option.id
                    const optionPrice = (modifierItem.price * option.multiplier).toFixed(2)
                    return (
                      <button
                        key={option.id}
                        onClick={() => setModifierState(prev => ({ ...prev, size: option.id }))}
                        className={`rounded-3xl border p-4 text-left transition-all ${selected ? 'border-primary-400 bg-primary-500/10 shadow-[0_0_0_1px_rgba(199,33,41,0.15)]' : 'border-black/10 dark:border-white/10 hover:border-primary-300/40'}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="font-semibold th-heading">{option.label}</span>
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'border-primary-500 bg-primary-500 text-white' : 'border-black/15 dark:border-white/15'}`}>
                            {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                          </span>
                        </div>
                        <p className="text-sm th-faint mb-2">Serves about {Math.max(4, Math.round(modifierItem.serves * option.servesMultiplier))}</p>
                        <p className="font-semibold text-primary-400">${optionPrice}</p>
                      </button>
                    )
                  })}
                </div>
              </section>

              {platterModifierSections.map(section => (
                <section key={section.id} className="py-6 border-b border-black/5 dark:border-white/5 last:border-b-0">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <h3 className="font-display text-xl th-heading">{section.title}</h3>
                      <p className="th-muted text-sm">{section.type === 'single' ? 'Choose one' : 'Pick any extras you want'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {section.options.map(option => {
                      const selected = section.type === 'single'
                        ? modifierState[section.id] === option.id
                        : modifierState[section.id].includes(option.id)

                      return (
                        <button
                          key={option.id}
                          onClick={() => section.type === 'single'
                            ? setModifierState(prev => ({ ...prev, [section.id]: option.id }))
                            : toggleMultiOption(section.id, option.id)}
                          className={`rounded-3xl border p-4 text-left transition-all ${selected ? 'border-primary-400 bg-primary-500/10 shadow-[0_0_0_1px_rgba(199,33,41,0.15)]' : 'border-black/10 dark:border-white/10 hover:border-primary-300/40'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold th-heading">{option.label}</div>
                              <div className="text-sm th-faint mt-1">{option.priceDelta > 0 ? `+$${option.priceDelta.toFixed(2)}` : 'Included'}</div>
                            </div>
                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'border-primary-500 bg-primary-500 text-white' : 'border-black/15 dark:border-white/15'}`}>
                              {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="px-6 py-5 border-t border-black/5 dark:border-white/5 bg-white/60 dark:bg-slate-950/30 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModifierState(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                    className="w-12 h-12 rounded-full border border-primary-300/40 th-heading flex items-center justify-center text-xl"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-display text-2xl th-heading">{modifierState.quantity}</span>
                  <button
                    onClick={() => setModifierState(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                    className="w-12 h-12 rounded-full border border-primary-300/40 th-heading flex items-center justify-center text-xl"
                  >
                    +
                  </button>
                </div>
                <button onClick={addConfiguredPlatterToCart} className="flex-1 btn-primary text-base py-4 flex items-center justify-center gap-3 rounded-[28px]">
                  Add to cart
                  <span className="text-white/70">|</span>
                  <span>${configuredTotal.toFixed(2)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Indicator */}
      <Cart />
    </main>
  )
}
