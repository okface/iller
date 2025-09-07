import React from 'react'

export function Badge({ className = '', children }) {
  return <span className={["inline-flex items-center rounded-full px-2 py-0.5 text-xs border", className].join(' ')}>{children}</span>
}
