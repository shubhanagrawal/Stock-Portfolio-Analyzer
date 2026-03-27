import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-center px-4 bg-gray-900 border border-gray-800 m-4 rounded-sm">
      <div className="w-16 h-16 bg-red-900/20 border border-red-500/50 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-sm font-bold text-gray-100 mb-2 uppercase tracking-wider">System Error</h3>
      <p className="text-gray-400 max-w-md mb-6 font-mono text-xs">{message || "UNABLE TO RETRIEVE TELEMETRY DATA. PLEASE RETRY."}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-sm hover:bg-indigo-500 transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  )
}
