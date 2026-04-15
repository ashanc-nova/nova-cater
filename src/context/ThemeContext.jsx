import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()
const THEME_STORAGE_KEY = 'appThemeMode'
const THEME_SELECTED_KEY = 'appThemeSelected'
const THEME_VERSION_KEY = 'appThemeVersion'
const CURRENT_THEME_VERSION = '1'
const LEGACY_THEME_KEYS = ['theme', 'snsThemeMode']
const LEGACY_SELECTED_KEYS = ['snsThemeSelected']

function getLegacyTheme() {
  return LEGACY_THEME_KEYS.map(key => localStorage.getItem(key)).find(Boolean)
}

function getLegacySelected() {
  return LEGACY_SELECTED_KEYS.some(key => localStorage.getItem(key) === 'true')
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    if (localStorage.getItem(THEME_VERSION_KEY) !== CURRENT_THEME_VERSION) {
      localStorage.setItem(THEME_VERSION_KEY, CURRENT_THEME_VERSION)
      const legacyTheme = getLegacyTheme()
      const legacySelected = getLegacySelected()
      localStorage.setItem(THEME_STORAGE_KEY, legacyTheme === 'dark' || legacyTheme === 'light' ? legacyTheme : 'light')
      localStorage.setItem(THEME_SELECTED_KEY, legacySelected ? 'true' : 'false')
    }

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    const themeSelected = localStorage.getItem(THEME_SELECTED_KEY) === 'true'

    if (!themeSelected) return 'light'
    return savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light'
  })

  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    LEGACY_THEME_KEYS.forEach(key => localStorage.removeItem(key))
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  }, [mode])

  const toggle = () => {
    localStorage.setItem(THEME_SELECTED_KEY, 'true')
    setMode(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
