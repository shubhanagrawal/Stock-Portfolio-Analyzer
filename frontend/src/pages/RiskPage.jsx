import { useQuery } from '@tanstack/react-query'
import { getRisk, getReport } from '../api/portfolio'
import MetricCard from '../components/MetricCard'
import RiskAlert from '../components/RiskAlert'
import SkeletonCard from '../components/SkeletonCard'
import ErrorState from '../components/ErrorState'
import { Download, AlertTriangle } from 'lucide-react'

export default function RiskPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['portfolio', 'risk'], queryFn: getRisk })

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Advanced Risk Analytics</h2>
          <p className="text-sm text-gray-500">Trailing 1-year performance metrics</p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <MetricCard 
              label="Sharpe Ratio (Annual)" 
              value={hasData ? parseFloat(data.sharpe_ratio.toFixed(2)) : undefined} 
              format="raw" 
            />
            <MetricCard 
              label="Volatility (Annual)" 
              value={hasData ? data.volatility_annual : undefined} 
              format="percent" 
            />
            <MetricCard 
              label="Max Drawdown" 
              value={hasData ? data.max_drawdown : undefined} 
              format="percent" 
            />
          </>
        )}
      </div>

      {data?.max_drawdown_period?.start && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-sm">
          <span className="font-semibold text-gray-700">Max Drawdown Period: </span>
          <span className="text-gray-600">{data.max_drawdown_period.start} to {data.max_drawdown_period.end}</span>
        </div>
      )}

      {/* Constraints Warnings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mt-8 mb-4">Risk Constraints</h3>
        {data?.alerts?.length === 0 ? (
          <div className="bg-green-50 text-green-800 p-4 rounded-lg flex items-start border border-green-200">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold">Portfolio is Healthy</h3>
              <p className="text-sm mt-1">No risk alerts triggered. Exposure, volatility, and returns are within normal parameters.</p>
            </div>
          </div>
        ) : (
          data?.alerts?.map((alert, i) => (
            <RiskAlert key={i} type={alert.type} message={alert.message} severity={alert.severity} />
          ))
        )}
      </div>
      
      {/* Concentration Table */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Asset Concentration</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Asset Ticker</th>
                <th className="px-6 py-4 font-medium text-right">Portfolio Weight</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.concentration?.length > 0 ? (
                data.concentration.sort((a,b) => b.weight_pct - a.weight_pct).map((item) => {
                  const isHigh = item.weight_pct > 40
                  return (
                    <tr key={item.ticker}>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.ticker}</td>
                      <td className="px-6 py-4 text-right tabular-nums">{item.weight_pct.toFixed(2)}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isHigh ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {isHigh ? 'Overweight' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan="3" className="px-6 py-4 text-center">No assets found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
