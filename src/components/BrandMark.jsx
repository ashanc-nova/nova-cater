import React from 'react'

export default function BrandMark({ className = 'w-10 h-10', iconClassName = 'w-5 h-5', roundedClassName = 'rounded-2xl' }) {
  return (
    <div className={`${className} ${roundedClassName} bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow`}>
      <svg className={`${iconClassName} text-white`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    </div>
  )
}
