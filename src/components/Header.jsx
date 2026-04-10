import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useLocationContext } from '../context/LocationContext'
import HeaderLocationPopover from './HeaderLocationPopover'
import LocationSelectorModal from './LocationSelectorModal'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const { mode, toggle } = useTheme()
  const { selectedLocation } = useLocationContext()
  const locationTriggerRef = React.useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.pageYOffset > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleOpenLocationModal = () => {
      setLocationPopoverOpen(false)
      setLocationModalOpen(true)
    }

    window.addEventListener('sns:open-location-modal', handleOpenLocationModal)
    return () => window.removeEventListener('sns:open-location-modal', handleOpenLocationModal)
  }, [])

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass-nav py-2' : 'py-4'}`}>
        <nav className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
          {/* Left: Brand + Location selector */}
            <div className="relative">
              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:scale-105"
                  aria-label="Go to home"
                >
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </Link>

                <button
                  ref={locationTriggerRef}
                  onClick={() => setLocationPopoverOpen(prev => !prev)}
                  className="group rounded-2xl px-1.5 py-1 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 text-left"
                >
                  <div className="hidden md:block">
                    <p className="font-display font-bold text-xl leading-none th-heading tracking-tight">SNS</p>
                    <p className="text-xs th-muted mt-1 leading-none">
                      {selectedLocation ? `${selectedLocation.city}, ${selectedLocation.stateCode}` : 'Select location'}
                    </p>
                  </div>
                </button>
              </div>

              <HeaderLocationPopover
                open={locationPopoverOpen}
                onClose={() => setLocationPopoverOpen(false)}
                anchorRef={locationTriggerRef}
                onViewAllLocations={() => setLocationModalOpen(true)}
              />
            </div>

          {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              <Link to="/my-orders" className="px-4 py-2 rounded-xl text-sm font-medium th-muted hover:th-heading hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300">
                My Orders
              </Link>

            {/* Theme Toggle */}
              <button
                onClick={toggle}
                className="ml-2 w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300"
                title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {mode === 'dark' ? (
                  <svg className="w-4 h-4 th-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 th-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                  </svg>
                )}
              </button>
            </div>

          {/* Mobile: Theme Toggle + Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggle}
                className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300"
              >
                {mode === 'dark' ? (
                  <svg className="w-5 h-5 th-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 th-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                  </svg>
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="relative w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300"
              >
                {!mobileMenuOpen ? (
                  <svg className="w-5 h-5 th-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 th-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

        {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 glass rounded-2xl p-4 space-y-1 animate-slide-up">
              <button
                onClick={() => {
                  setLocationModalOpen(true)
                  setMobileMenuOpen(false)
                }}
                className="w-full text-left py-3 px-4 rounded-xl th-body hover:th-heading hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 font-medium"
              >
                Change Location
                <span className="block text-xs th-muted mt-0.5">
                  {selectedLocation ? `${selectedLocation.city}, ${selectedLocation.stateCode}` : 'Select location'}
                </span>
              </button>

              <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 rounded-xl th-body hover:th-heading hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 font-medium">
                My Orders
              </Link>
            </div>
          )}
        </nav>
      </header>

      <LocationSelectorModal open={locationModalOpen} onClose={() => setLocationModalOpen(false)} />
    </>
  )
}
