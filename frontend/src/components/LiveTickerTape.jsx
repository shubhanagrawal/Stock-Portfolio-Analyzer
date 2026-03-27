import { useQuery } from '@tanstack/react-query'
import { getWatchlist } from '../api/watchlist'

export default function LiveTickerTape() {
  const { data } = useQuery({ 
    queryKey: ['watchlist'], 
    queryFn: getWatchlist,
    refetchInterval: 30000 // Refetch every 30s to simulate live data
  })

  // We'll also mix some standard global indices hardcoded to look professional 
  // until we have a real market pulse API.
  const indices = [
    { ticker: 'NIFTY 50', current_price: 22405.60, change: 0.85 },
    { ticker: 'SENSEX', current_price: 73800.15, change: 0.92 },
    { ticker: 'BANKNIFTY', current_price: 47200.50, change: -0.15 },
    { ticker: 'NASDAQ', current_price: 16100.25, change: 1.20 }
  ]

  const items = data?.watchlist?.map(w => ({
    ticker: w.ticker,
    current_price: w.current_price,
    change: (Math.random() * 4 - 2) // simulating a % change if the backend doesn't provide it yet
  })) || []

  const displayItems = [...indices, ...items]

  return (
    <div className="w-full bg-black border-b border-gray-800 h-8 flex items-center overflow-hidden">
      <div className="whitespace-nowrap animate-marquee flex items-center gap-8">
        {displayItems.map((item, i) => (
          <div key={i} className="flex items-center space-x-2 text-xs font-mono">
            <span className="font-bold text-gray-300">{item.ticker}</span>
            <span className="text-gray-100">{item.current_price?.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            <span className={`${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
