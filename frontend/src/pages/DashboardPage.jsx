import { useQueries } from '@tanstack/react-query'
import { getSummary, getPerformance, getRisk, getCorrelation, getSectors } from '../api/portfolio'
import MetricCard from '../components/MetricCard'
import SkeletonCard from '../components/SkeletonCard'
import RiskAlert from '../components/RiskAlert'
import ErrorState from '../components/ErrorState'
import PortfolioValueChart from '../charts/PortfolioValueChart'
import AllocationPieChart from '../charts/AllocationPieChart'
import StockPerformanceChart from '../charts/StockPerformanceChart'
import DrawdownChart from '../charts/DrawdownChart'
import CorrelationMatrix from '../charts/CorrelationMatrix'
import SectorChart from '../charts/SectorChart'

export default function DashboardPage() {
  const [summaryQ, performanceQ, riskQ, correlationQ, sectorsQ] = useQueries({
    queries: [
      { queryKey: ['portfolio', 'summary'], queryFn: getSummary },
      { queryKey: ['portfolio', 'performance'], queryFn: () => getPerformance(90) },
      { queryKey: ['portfolio', 'risk'], queryFn: getRisk },
      { queryKey: ['portfolio', 'correlation'], queryFn: getCorrelation },
      { queryKey: ['portfolio', 'sectors'], queryFn: getSectors },
    ]
  })

  const loading = summaryQ.isLoading || performanceQ.isLoading || riskQ.isLoading
  const error = summaryQ.error || performanceQ.error || riskQ.error

  if (error) return <ErrorState message={error.message || "Failed to fetch dashboard data"} onRetry={() => window.location.reload()} />

  return (
    <div className="p-4 space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <MetricCard label="Total Invested" value={summaryQ.data.total_invested} format="currency" />
            <MetricCard label="Current Value"  value={summaryQ.data.current_value}  format="currency" />
            <MetricCard label="Profit / Loss"  value={summaryQ.data.profit_loss}    format="currency" signed />
            <MetricCard label="Return %"       value={summaryQ.data.return_pct}     format="percent"  signed />
          </>
        )}
      </div>

      {/* Main Grid Restructure - Dense Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left/Center Column - Charts */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-sm">
            <h3 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-wider">Portfolio vs Benchmark (90D)</h3>
            {performanceQ.data && <PortfolioValueChart data={performanceQ.data} />}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-sm">
              <h3 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-wider">Drawdown Risk</h3>
              {performanceQ.data && <DrawdownChart data={performanceQ.data} />}
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-sm">
              <h3 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-wider">Holdings Performance</h3>
              {summaryQ.data && <StockPerformanceChart holdings={summaryQ.data.holdings} />}
            </div>
          </div>
          {riskQ.data?.alerts?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-bold text-gray-400 mb-2 tracking-wider">Active Alerts</h3>
              {riskQ.data.alerts.map((alert, i) => (
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

        {/* Right Column - Allocation & Correlation */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-sm">
            <h3 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-wider">Asset Allocation</h3>
            {summaryQ.data && <AllocationPieChart holdings={summaryQ.data.holdings} />}
          </div>
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-sm">
            <h3 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-wider">Sector Overview</h3>
            {sectorsQ.data && <SectorChart data={sectorsQ.data} />}
          </div>
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-sm">
            <h3 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-wider">Holdings Correlation</h3>
            {correlationQ.data && <CorrelationMatrix data={correlationQ.data} />}
          </div>
        </div>
      </div>
    </div>
  )
}
