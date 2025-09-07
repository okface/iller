import React from 'react'

// Functional Select that renders a native <select>, while keeping API-compatible
// helper components so existing markup doesn't break.
export function Select({ value, onValueChange, children }) {
  // Extract items from <SelectContent><SelectItem value=...>label</SelectItem>...</SelectContent>
  const items = []
  React.Children.forEach(children, (child) => {
    if (!child || typeof child !== 'object') return
    // Look into SelectContent children
    const typeName = child.type && (child.type.displayName || child.type.name)
    if (typeName === 'SelectContent') {
      React.Children.forEach(child.props.children, (grand) => {
        if (!grand || typeof grand !== 'object') return
        const gType = grand.type && (grand.type.displayName || grand.type.name)
        if (gType === 'SelectItem') {
          items.push({ value: grand.props.value, label: grand.props.children })
        }
      })
    }
  })

  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className="border rounded-lg px-3 py-2 text-sm bg-white"
    >
      {items.map((it) => (
        <option key={String(it.value)} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  )
}

export function SelectTrigger({ className = '', children }) {
  return <div className={["hidden", className].join(' ')}>{children}</div>
}
SelectTrigger.displayName = 'SelectTrigger'

export function SelectContent({ children }) {
  return <>{children}</>
}
SelectContent.displayName = 'SelectContent'

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>
}
SelectItem.displayName = 'SelectItem'

export function SelectValue({ placeholder }) {
  return <span className="hidden">{placeholder}</span>
}
SelectValue.displayName = 'SelectValue'
