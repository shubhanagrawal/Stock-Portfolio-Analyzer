import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function PortfolioValueChart({ data }) {
  if (!data || !data.portfolio || data.portfolio.length === 0) return <div className="text-gray-500 text-sm py-10 text-center">No performance data available.</div>

  const chartData = data.portfolio.map((p, i) => ({
    date: p.date,
    portfolio: parseFloat(p.value.toFixed(2)),
    benchmark: parseFloat(data.benchmark[i]?.value.toFixed(2))
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262a33" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={30} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1a1d24', borderColor: '#262a33', color: '#f1f5f9', fontSize: '12px' }}
          itemStyle={{ color: '#e2e8f0' }}
          formatter={(v) => v.toFixed(2)} 
        />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} iconType="circle" />
        <Line dataKey="portfolio" stroke="#3b82f6" name="Portfolio Value" dot={false} strokeWidth={2} activeDot={{ r: 4 }} />
        <Line dataKey="benchmark" stroke="#64748b" name="NIFTY 50" dot={false} strokeWidth={1.5} strokeDasharray="4 4" />
      </LineChart>
    </ResponsiveContainer>
  )
}
