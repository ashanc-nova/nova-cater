import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocationContext } from '../context/LocationContext'

export default function HeaderLocationPopover({ open, onClose, anchorRef, onViewAllLocations }) {
  const { locations, selectedLocationId, setSelectedLocationId } = useLocationContext()
  const [query, setQuery] = useState('')
  const popoverRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const handleOutsideClick = event => {
      const clickedAnchor = anchorRef?.current && anchorRef.current.contains(event.target)
      const clickedPopover = popoverRef.current && popoverRef.current.contains(event.target)

      if (!clickedAnchor && !clickedPopover) {
        onClose()
      }
    }

    const handleEscape = event => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose, anchorRef])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const normalizedQuery = query.trim().toLowerCase()

  const filteredLocations = useMemo(() => {
    if (!normalizedQuery) return locations

    return locations.filter(location =>
      [
        location.name,
        location.city,
        location.address,
        location.stateName,
        location.stateCode,
        location.zipCode,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    )
  }, [locations, normalizedQuery])

  if (!open) return null

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 top-[calc(100%+12px)] z-[85] w-[min(360px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-[24px] border border-black/8 dark:border-white/10 shadow-2xl overflow-hidden bg-white dark:bg-slate-950"
    >
      <div className="p-4 border-b border-black/8 dark:border-white/10">
        <div className="h-11 glass-input rounded-xl border border-black/10 dark:border-white/10 flex items-center gap-2 px-3">
          <svg className="w-4 h-4 th-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.3-4.3m1.3-4.7a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Enter your location, address, state or ZIP"
            className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 text-sm th-body placeholder:th-faint"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="w-5 h-5 rounded-full th-muted hover:th-heading flex items-center justify-center transition-colors shrink-0"
              aria-label="Clear location search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[360px] overflow-y-auto p-3 space-y-2">
        <button
          onClick={() => {
            onClose()
            onViewAllLocations?.()
          }}
          className="text-sm text-primary-400 hover:text-primary-300 transition-colors underline underline-offset-4 px-1 pb-1"
        >
          View all locations
        </button>

        {filteredLocations.map(location => {
          const active = selectedLocationId === location.id
          return (
            <button
              key={location.id}
              onClick={() => {
                setSelectedLocationId(location.id)
                onClose()
              }}
              className={`w-full text-left rounded-2xl p-3.5 border transition-all ${
                active
                  ? 'border-primary-500/40 bg-primary-500/10'
                  : 'border-black/8 dark:border-white/10 glass-light hover:border-primary-400/30'
              }`}
            >
              <p className="font-semibold th-heading text-sm">{location.name}</p>
              <p className="text-sm th-muted mt-0.5">{location.city}, {location.stateCode} {location.zipCode}</p>
              <p className="text-xs th-faint mt-1.5">{location.address}</p>
            </button>
          )
        })}

        {filteredLocations.length === 0 && (
          <div className="rounded-2xl glass-light border border-black/8 dark:border-white/10 p-4">
            <p className="text-sm th-heading font-medium">No matching locations</p>
            <p className="text-xs th-muted mt-1">Try a city, state, address fragment, or ZIP code.</p>
          </div>
        )}
      </div>
    </div>
  )
}
