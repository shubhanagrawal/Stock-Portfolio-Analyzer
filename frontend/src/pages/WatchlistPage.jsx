import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../api/watchlist'
import ErrorState from '../components/ErrorState'
import WatchlistDetailPanel from '../components/WatchlistDetailPanel'
import { Plus, Trash2, Eye, TrendingUp, Info } from 'lucide-react'

export default function WatchlistPage() {
  const [ticker, setTicker] = useState('')
  const [selectedTicker, setSelectedTicker] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist
  })

  const addMutation = useMutation({
    mutationFn: addToWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist'])
      setTicker('')
    },
    onError: (err) => {
      alert(err.detail || 'Failed to add to watchlist')
    }
  })

  const removeMutation = useMutation({
    mutationFn: removeFromWatchlist,
    onSuccess: () => queryClient.invalidateQueries(['watchlist'])
  })

  if (error) return <ErrorState message={error.message} />

  const items = data?.watchlist || []

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-gray-900 border border-gray-800 p-4 rounded-sm">
        <div>
          <h2 className="text-sm uppercase font-bold text-gray-100 tracking-wider">Live Watchlist</h2>
          <p className="text-xs text-gray-400 font-mono mt-1">REAL-TIME TRACKING: {items.length} TICKERS</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-4 rounded-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (ticker.trim()) addMutation.mutate(ticker.trim().toUpperCase())
          }}
          className="flex items-center space-x-3"
        >
          <div className="flex-1">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="ENTER TICKER (E.G. TCS.NS)"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm outline-none placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            disabled={addMutation.isPending || !ticker.trim()}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-sm transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{addMutation.isPending ? 'ADDING...' : 'ADD'}</span>
          </button>
        </form>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 font-mono text-xs uppercase">SYNCING MARKET DATA...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center space-y-3 font-mono text-xs uppercase">
            <Eye className="w-8 h-8 text-gray-700" />
            <p>WATCHLIST EMPTY. INPUT TICKER SYMBOL ABOVE TO BEGIN.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300 font-mono">
              <thead className="bg-[#0b0c10] text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold tracking-wider">SYMBOL</th>
                  <th className="px-4 py-3 font-semibold text-right tracking-wider">LTP (₹)</th>
                  <th className="px-4 py-3 font-semibold tracking-wider">ONBOARDED</th>
                  <th className="px-4 py-3 font-semibold text-center tracking-wider">ACT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTicker(item.ticker)}
                  >
                    <td className="px-4 py-3 font-bold text-indigo-400">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="hover:underline">{item.ticker}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-100">
                      {item.current_price > 0 ? parseFloat(item.current_price).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.added_at ? new Date(item.added_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <button
                          title="Untrack"
                          className="text-gray-500 hover:text-red-500 transition-colors z-10 relative"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeMutation.mutate(item.ticker)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTicker && (
        <WatchlistDetailPanel 
          ticker={selectedTicker} 
          onClose={() => setSelectedTicker(null)} 
        />
      )}
    </div>
  )
}
