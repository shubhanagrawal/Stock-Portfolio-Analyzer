import { useQuery } from '@tanstack/react-query'
import { getTickerQuote } from '../api/market'
import { X, TrendingUp, TrendingDown, Activity, DollarSign, BarChart2 } from 'lucide-react'

export default function WatchlistDetailPanel({ ticker, onClose }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['quote', ticker],
    queryFn: () => getTickerQuote(ticker),
    enabled: !!ticker
  })

  // Format big numbers
  const formatCompact = (num) => {
    if (!num) return 'N/A'
    return Intl.NumberFormat('en-IN', { notation: "compact", maximumFractionDigits: 1 }).format(num)
  }

  const formatPrice = (num) => {
    if (!num) return 'N/A'
    return Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 font-mono">
      <div className="bg-gray-900 border border-indigo-500/30 rounded-sm shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)] w-full max-w-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 bg-[#0b0c10] flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <div>
            <h3 className="text-xl font-black text-white tracking-widest">{ticker}</h3>
            {data?.name && <p className="text-xs text-indigo-400 mt-1 uppercase tracking-wider truncate max-w-sm">{data.name}</p>}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors bg-gray-800 p-1.5 rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-indigo-500">
              <Activity className="w-8 h-8 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-widest">Receiving Telemetry...</p>
            </div>
          ) : error || data?.error ? (
            <div className="py-12 text-center text-red-500 text-xs font-bold uppercase tracking-wider bg-red-900/10 border border-red-900/50 rounded-sm">
              [SYSTEM FAULT] {error?.message || data?.error}
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Top Metrics row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0b0c10] border border-gray-800 p-3 rounded-sm flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Previous Close</span>
                  <span className="text-sm font-bold text-gray-200">{formatPrice(data.previousClose)}</span>
                </div>
                <div className="bg-[#0b0c10] border border-gray-800 p-3 rounded-sm flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Open</span>
                  <span className="text-sm font-bold text-gray-200">{formatPrice(data.open)}</span>
                </div>
                <div className="bg-[#0b0c10] border border-gray-800 p-3 rounded-sm flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500"/> Day High</span>
                  <span className="text-sm font-bold text-emerald-400">{formatPrice(data.dayHigh)}</span>
                </div>
                <div className="bg-[#0b0c10] border border-gray-800 p-3 rounded-sm flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500"/> Day Low</span>
                  <span className="text-sm font-bold text-red-400">{formatPrice(data.dayLow)}</span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm mt-4">
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500 font-bold text-[10px] tracking-wider uppercase">Market Cap</span>
                  <span className="text-gray-200 font-bold">{formatCompact(data.marketCap)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500 font-bold text-[10px] tracking-wider uppercase">Volume</span>
                  <span className="text-gray-200 font-bold">{formatCompact(data.volume)}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500 font-bold text-[10px] tracking-wider uppercase">52W High</span>
                  <span className="text-emerald-400 font-bold">{formatPrice(data.fiftyTwoWeekHigh)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500 font-bold text-[10px] tracking-wider uppercase">52W Low</span>
                  <span className="text-red-400 font-bold">{formatPrice(data.fiftyTwoWeekLow)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500 font-bold text-[10px] tracking-wider uppercase">P/E Ratio (TTM)</span>
                  <span className="text-gray-200 font-bold">{data.trailingPE ? data.trailingPE.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500 font-bold text-[10px] tracking-wider uppercase">Div Yield</span>
                  <span className="text-gray-200 font-bold">{data.dividendYield ? (data.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500 font-bold text-[10px] tracking-wider uppercase">Sector</span>
                  <span className="text-indigo-300 font-bold truncate max-w-[150px]" title={data.sector}>{data.sector}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500 font-bold text-[10px] tracking-wider uppercase">Industry</span>
                  <span className="text-indigo-300 font-bold truncate max-w-[150px]" title={data.industry}>{data.industry}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-[#0b0c10] border-t border-gray-800 p-3 text-center">
          <p className="text-[10px] text-gray-600 tracking-widest uppercase">END OF TECHNICAL SUMMARY</p>
        </div>
      </div>
    </div>
  )
}
