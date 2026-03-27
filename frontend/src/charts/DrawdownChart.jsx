import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function DrawdownChart({ data }) {
  if (!data || !data.portfolio || data.portfolio.length === 0) return <div className="text-gray-500 text-sm py-10 text-center">No drawdown data available.</div>

  const chartData = data.portfolio.map(p => ({
    date: p.date,
    drawdown: parseFloat(((p.drawdown ?? 0) * 100).toFixed(2))
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262a33" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={30} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 0]} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1a1d24', borderColor: '#262a33', color: '#f1f5f9', fontSize: '12px' }}
          itemStyle={{ color: '#ef4444' }}
          formatter={(v) => `${v.toFixed(2)}%`} 
        />
        <Area dataKey="drawdown" stroke="#ef4444" fill="rgba(239,68,68,0.2)" name="Drawdown %" strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
