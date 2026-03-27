import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function RollingMetricsChart({ data }) {
  if (!data || !data.dates || data.dates.length === 0) {
    return <div className="text-gray-500 text-sm py-10 text-center">Not enough data for 30-day rolling metrics.</div>
  }

  const chartData = data.dates.map((d, i) => ({
    date: d,
    volatility: parseFloat((data.rolling_volatility[i] * 100).toFixed(2)),
    sharpe: parseFloat(data.rolling_sharpe[i].toFixed(2))
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262a33" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={30} />
        <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1a1d24', borderColor: '#262a33', color: '#f1f5f9', fontSize: '12px' }}
        />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} iconType="circle" />
        <Line yAxisId="left" dataKey="volatility" stroke="#ef4444" name="Volatility %" dot={false} strokeWidth={1.5} />
        <Line yAxisId="right" dataKey="sharpe" stroke="#3b82f6" name="Sharpe Ratio" dot={false} strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  )
}
