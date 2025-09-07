import React from 'react'

export function Button({ children, className = '', variant = 'default', size = 'md', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50 disabled:pointer-events-none'
  const variants = {
    default: 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50',
    secondary: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100',
    ghost: 'bg-transparent text-slate-700 border-transparent hover:bg-slate-100',
  }
  const sizes = {
    md: 'px-3 py-2 text-sm',
    sm: 'px-2.5 py-1.5 text-xs',
    icon: 'p-2 text-sm',
  }
  return (
    <button className={[base, variants[variant], sizes[size], className].join(' ')} {...props}>
      {children}
    </button>
  )
}
