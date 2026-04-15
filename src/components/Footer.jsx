import React from 'react'
import { Link } from 'react-router-dom'
import { useLocationContext } from '../context/LocationContext'
import { useTenant } from '../context/TenantContext'
import BrandMark from './BrandMark'

export default function Footer() {
  const { selectedLocation } = useLocationContext()
  const { brand, events } = useTenant()

  const openLocationModal = () => {
    window.dispatchEvent(new CustomEvent(events.openLocationModal))
  }

  return (
    <footer className="relative mt-12 md:mt-20">
      {/* Gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent"></div>

      <div className="glass-dark rounded-t-3xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-5 md:pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 mb-6 md:mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <BrandMark className="w-9 h-9" iconClassName="w-4.5 h-4.5" />
                <span className="font-display font-bold text-lg th-heading">{brand.displayName}</span>
              </div>
              <p className="th-faint text-[13px] leading-relaxed max-w-xs">{brand.description}</p>
            </div>

            {/* Quick Links */}
            <div className="md:contents">
              <div className="grid grid-cols-2 gap-5 md:block md:contents">
                <div>
                  <h3 className="font-display font-semibold th-heading mb-2.5 text-xs uppercase tracking-wider">Quick Links</h3>
                  <ul className="space-y-2">
                    <li><Link to="/" className="th-faint hover:text-primary-400 transition-colors duration-300 text-[13px]">Menu</Link></li>
                    <li><Link to="/my-orders" className="th-faint hover:text-primary-400 transition-colors duration-300 text-[13px]">My Orders</Link></li>
                    <li>
                      <button
                        onClick={openLocationModal}
                        className="th-faint hover:text-primary-400 transition-colors duration-300 text-[13px]"
                      >
                        Locations
                      </button>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display font-semibold th-heading mb-2.5 text-xs uppercase tracking-wider">Contact Us</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <svg className="w-3.5 h-3.5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      <span className="th-faint text-[13px] leading-relaxed break-words">{selectedLocation?.address}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <svg className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      <span className="th-faint text-[13px]">{selectedLocation?.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <svg className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      <span className="th-faint text-[13px] break-all">{selectedLocation?.emailAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-black/5 dark:border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 md:gap-4">
            <div className="flex items-center gap-3">
              <span className="th-ghost text-xs">&copy; 2026 {brand.legalName}. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              <a href="#" className="th-ghost hover:th-muted text-xs transition-colors">Privacy</a>
              <a href="#" className="th-ghost hover:th-muted text-xs transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
