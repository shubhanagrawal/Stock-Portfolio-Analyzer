import { useQueries } from '@tanstack/react-query'
import { getSummary, getPerformance, getRisk } from '../api/portfolio'
import MetricCard from '../components/MetricCard'
import SkeletonCard from '../components/SkeletonCard'
import RiskAlert from '../components/RiskAlert'
import ErrorState from '../components/ErrorState'
import PortfolioValueChart from '../charts/PortfolioValueChart'
import AllocationPieChart from '../charts/AllocationPieChart'
import StockPerformanceChart from '../charts/StockPerformanceChart'
import DrawdownChart from '../charts/DrawdownChart'

export default function DashboardPage() {
  const [summaryQ, performanceQ, riskQ] = useQueries({
    queries: [
      { queryKey: ['portfolio', 'summary'], queryFn: getSummary },
      { queryKey: ['portfolio', 'performance'], queryFn: () => getPerformance(90) },
      { queryKey: ['portfolio', 'risk'], queryFn: getRisk },
    ]
  })

  const loading = summaryQ.isLoading || performanceQ.isLoading || riskQ.isLoading
  const error = summaryQ.error || performanceQ.error || riskQ.error

  if (error) return <ErrorState message={error.message || "Failed to fetch dashboard data"} onRetry={() => window.location.reload()} />

  return (
    <div className="p-6 space-y-6">
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

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Portfolio vs NIFTY 50</h3>
          {performanceQ.data && <PortfolioValueChart data={performanceQ.data} />}
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Asset Allocation</h3>
          {summaryQ.data && <AllocationPieChart holdings={summaryQ.data.holdings} />}
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Stock Performance</h3>
          {summaryQ.data && <StockPerformanceChart holdings={summaryQ.data.holdings} />}
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Drawdown</h3>
          {performanceQ.data && <DrawdownChart data={performanceQ.data} />}
        </div>
      </div>

      {/* Risk alerts */}
      <div className="space-y-4">
        {riskQ.data?.alerts?.map((alert, i) => (
          <RiskAlert key={i} type={alert.type} message={alert.message} severity={alert.severity} />
        ))}
      </div>
    </div>
  )
}
