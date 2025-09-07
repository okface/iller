import React from 'react'

export function Textarea({ className = '', ...props }) {
  return <textarea className={["border rounded-lg px-3 py-2 text-sm w-full", className].join(' ')} {...props} />
}
