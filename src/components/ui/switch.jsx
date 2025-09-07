import React from 'react'

export function Switch({ id, checked, onCheckedChange }) {
  return (
    <input id={id} type="checkbox" checked={checked} onChange={e => onCheckedChange?.(e.target.checked)} className="h-4 w-4"/>
  )
}
