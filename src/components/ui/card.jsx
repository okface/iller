import React from 'react'

export function Card({ className = '', children }) {
  return <div className={["rounded-2xl bg-white border p-4", className].join(' ')}>{children}</div>
}

export function CardHeader({ className = '', children }) {
  return <div className={["border-b pb-2", className].join(' ')}>{children}</div>
}

export function CardTitle({ className = '', children }) {
  return <div className={["text-base font-semibold", className].join(' ')}>{children}</div>
}

export function CardContent({ className = '', children }) {
  return <div className={["pt-2", className].join(' ')}>{children}</div>
}
