import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocationContext } from '../context/LocationContext'

function getMapEmbedUrl(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}&z=13&output=embed`
}

export default function LocationSelectorModal({ open, onClose }) {
  const { states, locations, selectedLocationId, setSelectedLocationId } = useLocationContext()
  const [activeState, setActiveState] = useState('')
  const [zipQuery, setZipQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const currentLocation = locations.find(location => location.id === selectedLocationId)
    setActiveState(currentLocation?.stateCode || states[0]?.code || '')
  }, [open, locations, selectedLocationId, states])

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [open])

  const normalizedZipQuery = zipQuery.trim().toLowerCase()
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredStates = useMemo(() => {
    if (!normalizedQuery && !normalizedZipQuery) return states

    return states.filter(state => {
      const stateMatch =
        state.name.toLowerCase().includes(normalizedQuery) ||
        state.code.toLowerCase().includes(normalizedQuery)

      if (stateMatch) return true

      return locations.some(location =>
        location.stateCode === state.code &&
        [location.name, location.city, location.address, location.stateName, location.stateCode, location.zipCode]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery) &&
        (!normalizedZipQuery || `${location.zipCode}`.toLowerCase().includes(normalizedZipQuery))
      )
    })
  }, [states, locations, normalizedQuery, normalizedZipQuery])

  useEffect(() => {
    if (!open) return
    if (filteredStates.length === 0) return
    if (!filteredStates.some(state => state.code === activeState)) {
      setActiveState(filteredStates[0].code)
    }
  }, [open, filteredStates, activeState])

  const stateLocations = useMemo(
    () => locations.filter(location => {
      if (location.stateCode !== activeState) return false
      const matchesZip = !normalizedZipQuery || `${location.zipCode}`.toLowerCase().includes(normalizedZipQuery)
      if (!normalizedQuery) return matchesZip

      return matchesZip && [location.name, location.city, location.address, location.stateName, location.stateCode, location.zipCode]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    }),
    [locations, activeState, normalizedQuery, normalizedZipQuery]
  )

  const selectedInState = stateLocations.find(location => location.id === selectedLocationId) || stateLocations[0] || null

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        aria-label="Close location selector"
      />

      <div className="absolute inset-4 md:inset-8 lg:inset-14 glass-strong rounded-[28px] overflow-hidden shadow-2xl flex flex-col">
        <div className="px-5 md:px-7 py-4 border-b border-black/8 dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <div className="h-10 w-40 glass-input rounded-xl border border-black/10 dark:border-white/10 flex items-center px-3">
              <input
                value={zipQuery}
                onChange={e => setZipQuery(e.target.value.replace(/[^\d-]/g, ''))}
                placeholder="ZIP code"
                className="w-full bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 text-sm th-body placeholder:th-faint"
              />
            </div>

            <div className="h-10 flex-1 glass-input rounded-xl border border-black/10 dark:border-white/10 flex items-center gap-2 px-3">
              <svg className="w-4 h-4 th-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.3-4.3m1.3-4.7a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search location, address, state"
                className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 text-sm th-body placeholder:th-faint"
              />
              {(searchQuery || zipQuery) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setZipQuery('')
                  }}
                  className="w-5 h-5 rounded-full th-muted hover:th-heading flex items-center justify-center transition-colors shrink-0"
                  aria-label="Clear search"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 th-muted flex items-center justify-center transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[220px_1fr_1.05fr] xl:grid-rows-[auto_1fr]">
          <div className="hidden xl:flex items-center border-r border-black/8 dark:border-white/10 px-4 md:px-5 pt-4 pb-2">
            <p className="text-xs uppercase tracking-[0.15em] th-faint">States</p>
          </div>
          <div className="hidden xl:flex items-center gap-2 border-r border-black/8 dark:border-white/10 px-4 md:px-5 pt-4 pb-2">
            <p className="text-xs uppercase tracking-[0.15em] th-faint">Locations</p>
          </div>
          <div className="hidden xl:flex items-center px-4 md:px-5 pt-4 pb-2">
            <p className="text-xs uppercase tracking-[0.15em] th-faint">Map View</p>
          </div>

          <aside className="border-r border-black/8 dark:border-white/10 p-4 md:p-5 xl:pt-2 overflow-y-auto">
            <p className="text-xs uppercase tracking-[0.15em] th-faint mb-3 xl:hidden">States</p>
            <div className="space-y-2">
              {filteredStates.map(state => {
                const active = activeState === state.code
                return (
                  <button
                    key={state.code}
                    onClick={() => setActiveState(state.code)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active ? 'bg-primary-500 text-white shadow-glow' : 'glass-light th-muted hover:th-heading'
                    }`}
                  >
                    {state.name}
                  </button>
                )
              })}

              {filteredStates.length === 0 && (
                <p className="text-sm th-muted px-2 py-1">No states match your search.</p>
              )}
            </div>
          </aside>

          <section className="border-r border-black/8 dark:border-white/10 p-4 md:p-5 xl:pt-2 overflow-y-auto">
            <div className="mb-3 xl:hidden">
              <p className="text-xs uppercase tracking-[0.15em] th-faint">Locations</p>
            </div>
            <div className="space-y-3">
              {stateLocations.map(location => {
                const active = selectedLocationId === location.id
                return (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocationId(location.id)}
                    className={`w-full text-left rounded-2xl p-4 border transition-all ${
                      active
                        ? 'border-primary-500/40 bg-primary-500/10'
                        : 'border-black/8 dark:border-white/10 glass-light hover:border-primary-400/30'
                    }`}
                  >
                    <p className="font-semibold th-heading">{location.name}</p>
                    <p className="text-sm th-muted">{location.city}, {location.stateCode}</p>
                    <p className="text-xs th-faint mt-1.5">{location.address}</p>
                  </button>
                )
              })}

              {stateLocations.length === 0 && (
                <p className="text-sm th-muted px-2 py-1">No locations found for this search.</p>
              )}
            </div>
          </section>

          <section className="p-4 md:p-5 xl:pt-2 flex flex-col min-h-0">
            <p className="text-xs uppercase tracking-[0.15em] th-faint mb-3 xl:hidden">Map View</p>

            {selectedInState && (
              <div className="glass rounded-2xl overflow-hidden h-full min-h-[320px]">
                <iframe
                  title="Location map"
                  src={getMapEmbedUrl(selectedInState.lat, selectedInState.lng)}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
