import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()
const THEME_STORAGE_KEY = 'snsThemeMode'
const THEME_SELECTED_KEY = 'snsThemeSelected'
const THEME_VERSION_KEY = 'snsThemeVersion'
const CURRENT_THEME_VERSION = '1'
const LEGACY_THEME_KEY = 'theme'

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    if (localStorage.getItem(THEME_VERSION_KEY) !== CURRENT_THEME_VERSION) {
      localStorage.setItem(THEME_VERSION_KEY, CURRENT_THEME_VERSION)
      localStorage.setItem(THEME_STORAGE_KEY, 'light')
      localStorage.setItem(THEME_SELECTED_KEY, 'false')
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
    localStorage.removeItem(LEGACY_THEME_KEY)
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
