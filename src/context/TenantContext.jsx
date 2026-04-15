import React, { createContext, useContext } from 'react'
import { tenantConfig } from '../data/tenantConfig'

const TenantContext = createContext(tenantConfig)

export function TenantProvider({ children }) {
  return <TenantContext.Provider value={tenantConfig}>{children}</TenantContext.Provider>
}

export function useTenant() {
  return useContext(TenantContext)
}

