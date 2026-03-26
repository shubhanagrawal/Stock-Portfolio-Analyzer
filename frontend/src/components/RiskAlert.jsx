import { AlertTriangle, Info, AlertCircle } from 'lucide-react'

export default function RiskAlert({ type, message, severity }) {
  const configs = {
    high: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />
    },
    medium: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />
    },
    low: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const { bg, border, text, icon } = configs[severity] || configs.low

  return (
    <div className={`flex items-start p-4 mb-4 border rounded-lg ${bg} ${border}`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className={`ml-3 ${text}`}>
        <h3 className="text-sm font-semibold">{type}</h3>
        <p className="text-sm mt-1">{message}</p>
      </div>
    </div>
  )
}
