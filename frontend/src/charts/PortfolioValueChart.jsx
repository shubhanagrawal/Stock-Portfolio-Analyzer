import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function PortfolioValueChart({ data }) {
  if (!data || !data.portfolio || data.portfolio.length === 0) return <div className="text-gray-500 text-sm py-10 text-center">No performance data available yet. Add transactions to see the chart.</div>

  const chartData = data.portfolio.map((p, i) => ({
    date: p.date,
    portfolio: parseFloat(p.value.toFixed(2)),
    benchmark: parseFloat(data.benchmark[i]?.value.toFixed(2))
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip formatter={(v) => v.toFixed(2)} />
        <Legend />
        <Line dataKey="portfolio" stroke="#6366f1" name="Your Portfolio" dot={false} strokeWidth={2} />
        <Line dataKey="benchmark" stroke="#94a3b8" name="NIFTY 50"       dot={false} strokeWidth={1.5} strokeDasharray="4 4" />
      </LineChart>
    </ResponsiveContainer>
  )
}
