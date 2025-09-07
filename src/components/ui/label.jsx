import React from 'react'

export function Label({ className = '', ...props }) {
  return <label className={["text-xs text-slate-600", className].join(' ')} {...props} />
}
