import React from 'react'

export default function MetricCard({ label, value, format = 'currency', signed = false }) {
  let displayValue = '-'
  let colorClass = 'text-gray-100'
  
  if (value !== undefined && value !== null) {
    if (format === 'currency') {
      displayValue = value.toLocaleString('en-IN', { 
        style: 'currency', 
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    } else if (format === 'percent') {
      displayValue = `${(value * 100).toFixed(2)}%`
    } else {
      displayValue = value.toString()
    }

    if (signed) {
      if (value > 0) {
        displayValue = `+${displayValue}`
        colorClass = 'text-emerald-400'
      } else if (value < 0) {
        colorClass = 'text-red-500'
      }
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded border border-gray-700 flex flex-col justify-center">
      <p className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">{label}</p>
      <h4 className={`text-xl font-mono tracking-tight ${colorClass}`}>{displayValue}</h4>
    </div>
  )
}
