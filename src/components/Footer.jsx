import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative mt-20">
      {/* Gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent"></div>

      <div className="glass-dark rounded-t-3xl">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <span className="font-display font-bold text-xl th-heading">SNS</span>
              </div>
              <p className="th-faint leading-relaxed">Famous for steakburgers and hand-dipped milkshakes since 1934. The original better burger.</p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-display font-semibold th-heading mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link to="/" className="th-faint hover:text-primary-400 transition-colors duration-300 text-sm">Menu</Link></li>
                <li><Link to="/my-orders" className="th-faint hover:text-primary-400 transition-colors duration-300 text-sm">My Orders</Link></li>
                <li><a href="#" className="th-faint hover:text-primary-400 transition-colors duration-300 text-sm">Contact Us</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-display font-semibold th-heading mb-4 text-sm uppercase tracking-wider">Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span className="th-faint text-sm">2410 Blvd Ste 150, San Ramon, CA 94583</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  <span className="th-faint text-sm">(123) 456-7890</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <span className="th-faint text-sm">info@sns.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-black/5 dark:border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="th-ghost text-xs">&copy; 2024 SNS. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="th-ghost hover:th-muted text-xs transition-colors">Privacy</a>
              <a href="#" className="th-ghost hover:th-muted text-xs transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
