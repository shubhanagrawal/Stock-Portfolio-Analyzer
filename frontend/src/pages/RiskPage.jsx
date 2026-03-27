import { useQueries } from '@tanstack/react-query'
import { getRisk, getReport, getRolling, getHeatmap } from '../api/portfolio'
import MetricCard from '../components/MetricCard'
import SkeletonCard from '../components/SkeletonCard'
import ErrorState from '../components/ErrorState'
import RollingMetricsChart from '../charts/RollingMetricsChart'
import ReturnHeatmap from '../charts/ReturnHeatmap'
import { Download, AlertTriangle } from 'lucide-react'

export default function RiskPage() {
  const [riskQ, rollingQ, heatmapQ] = useQueries({
    queries: [
      { queryKey: ['portfolio', 'risk'], queryFn: getRisk },
      { queryKey: ['portfolio', 'rolling'], queryFn: () => getRolling(30) },
      { queryKey: ['portfolio', 'heatmap'], queryFn: getHeatmap },
    ]
  })

  const data = riskQ.data
  const isLoading = riskQ.isLoading
  const error = riskQ.error

  const handleDownload = async () => {
    try {
      const response = await getReport()
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'portfolio_report.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('Failed to download report')
    }
  }

  if (error) return <ErrorState message={error.message} />

  const hasData = data?.sharpe_ratio !== null && data?.sharpe_ratio !== undefined

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center bg-gray-900 p-4 border border-gray-800 rounded-sm">
        <div>
          <h2 className="text-sm uppercase font-bold text-gray-100 tracking-wider">Risk Analytics Terminal</h2>
          <p className="text-xs text-gray-400 font-mono mt-1">TRAILING 1-YEAR AGGREGATE</p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-sm transition-colors text-xs font-bold uppercase tracking-wide"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export SEC-CSV</span>
        </button>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <MetricCard label="Sharpe" value={hasData ? parseFloat(data.sharpe_ratio.toFixed(2)) : undefined} format="raw" />
            <MetricCard label="Sortino" value={data?.sortino_ratio != null ? parseFloat(data.sortino_ratio.toFixed(2)) : undefined} format="raw" />
            <MetricCard label="Beta" value={data?.beta != null ? parseFloat(data.beta.toFixed(2)) : undefined} format="raw" />
            <MetricCard label="Vol(Ann.)" value={hasData ? data.volatility_annual : undefined} format="percent" />
            <MetricCard label="Max DD" value={hasData ? data.max_drawdown : undefined} format="percent" />
            <MetricCard label="VaR(95%)" value={data?.var_95 != null ? data.var_95 : undefined} format="percent" />
          </>
        )}
      </div>

      {data?.max_drawdown_period?.start && (
        <div className="bg-gray-900 p-3 border border-gray-800 rounded-sm text-xs font-mono text-gray-300">
          <span className="text-red-400 font-bold mr-2">MAX DRAWDOWN PERIOD:</span>
          {data.max_drawdown_period.start} &rarr; {data.max_drawdown_period.end}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-sm">
          <h3 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-wider">Rolling Volatility / Sharpe (30D)</h3>
          {rollingQ.data && <RollingMetricsChart data={rollingQ.data} />}
          {rollingQ.isLoading && <div className="h-[280px] animate-pulse bg-gray-800 rounded-sm" />}
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-sm flex flex-col items-center">
          <h3 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-wider self-start">Daily Returns Heatmap</h3>
          {heatmapQ.data && <ReturnHeatmap data={heatmapQ.data} />}
          {heatmapQ.isLoading && <div className="h-[200px] animate-pulse bg-gray-800 rounded-sm w-full" />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Constraints */}
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-sm">
          <h3 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-wider">Boundary Violations</h3>
          {data?.alerts?.length === 0 ? (
            <div className="flex items-start text-emerald-400 text-xs font-mono p-3 bg-emerald-900/10 border border-emerald-900/50 rounded-sm">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>SYSTEM NOMINAL. NO RISK CONSTRAINTS BREACHED.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.alerts?.map((alert, i) => (
                <div key={i} className={`p-3 border-l-4 text-xs font-mono rounded-r-sm ${
                  alert.severity === 'high' ? 'bg-red-900/20 border-red-500 text-red-200' : 'bg-orange-900/20 border-orange-500 text-orange-200'
                }`}>
                  <span className="font-bold opacity-75 mr-2">[{alert.type.toUpperCase()}]</span> 
                  {alert.message}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Concentration Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-sm overflow-hidden">
          <h3 className="text-xs uppercase font-bold text-gray-400 p-4 border-b border-gray-800 tracking-wider bg-gray-900/50">Asset Weight Watch</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300 font-mono">
              <thead className="bg-[#0b0c10] text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-2 font-semibold">TICKER</th>
                  <th className="px-4 py-2 font-semibold text-right">WEIGHT</th>
                  <th className="px-4 py-2 font-semibold text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data?.concentration?.length > 0 ? (
                  [...data.concentration].sort((a,b) => b.weight_pct - a.weight_pct).map((item) => {
                    const isHigh = item.weight_pct > 40
                    return (
                      <tr key={item.ticker} className="hover:bg-gray-800/50">
                        <td className="px-4 py-2.5 font-bold text-gray-100">{item.ticker.replace('.NS', '')}</td>
                        <td className="px-4 py-2.5 text-right">{item.weight_pct.toFixed(2)}%</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`${isHigh ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isHigh ? 'WARN' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr><td colSpan="3" className="px-4 py-6 text-center text-gray-600">NO ACTIVE POSITIONS</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
