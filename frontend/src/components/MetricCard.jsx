import React from 'react'

export default function MetricCard({ label, value, format = 'currency', signed = false }) {
  let displayValue = '-'
  let colorClass = 'text-gray-900'
  
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
        colorClass = 'text-green-600'
      } else if (value < 0) {
        colorClass = 'text-red-600'
      }
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <h4 className={`text-2xl font-bold ${colorClass}`}>{displayValue}</h4>
    </div>
  )
}
