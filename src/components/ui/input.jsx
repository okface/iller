import React from 'react'

export function Input({ className = '', ...props }) {
  return <input className={["border rounded-lg px-3 py-2 text-sm", className].join(' ')} {...props} />
}
