import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { tenantConfig } from '../data/tenantConfig'
import { getStorageValue, setStorageValue, storageKeys } from '../utils/storage'

const LocationContext = createContext()

function getDistanceInKm(lat1, lng1, lat2, lng2) {
  const toRadians = value => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const deltaLat = toRadians(lat2 - lat1)
  const deltaLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function LocationProvider({ children }) {
  const enterpriseLocations = tenantConfig.locations
  const [selectedLocationId, setSelectedLocationId] = useState(() => {
    const saved = getStorageValue(storageKeys.selectedLocationId)
    if (saved && enterpriseLocations.some(location => location.id === saved)) {
      return saved
    }
    return enterpriseLocations[0]?.id || ''
  })
  const [hasSavedLocation] = useState(() => {
    const saved = getStorageValue(storageKeys.selectedLocationId)
    return Boolean(saved && enterpriseLocations.some(location => location.id === saved))
  })

  useEffect(() => {
    if (selectedLocationId) {
      setStorageValue(storageKeys.selectedLocationId, selectedLocationId)
    }
  }, [selectedLocationId])

  useEffect(() => {
    if (hasSavedLocation) return
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords

        const nearestLocation = enterpriseLocations.reduce((closest, location) => {
          if (!closest) return location

          const closestDistance = getDistanceInKm(latitude, longitude, closest.lat, closest.lng)
          const nextDistance = getDistanceInKm(latitude, longitude, location.lat, location.lng)

          return nextDistance < closestDistance ? location : closest
        }, null)

        if (nearestLocation) {
          setSelectedLocationId(nearestLocation.id)
        }
      },
      () => {},
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000,
      }
    )
  }, [hasSavedLocation])

  const selectedLocation = useMemo(
    () => enterpriseLocations.find(location => location.id === selectedLocationId) || enterpriseLocations[0] || null,
    [selectedLocationId]
  )

  const states = useMemo(() => {
    const stateMap = new Map()
    for (const location of enterpriseLocations) {
      if (!stateMap.has(location.stateCode)) {
        stateMap.set(location.stateCode, { code: location.stateCode, name: location.stateName })
      }
    }
    return Array.from(stateMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const value = {
    locations: enterpriseLocations,
    states,
    selectedLocation,
    selectedLocationId,
    setSelectedLocationId,
  }

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocationContext() {
  return useContext(LocationContext)
}
