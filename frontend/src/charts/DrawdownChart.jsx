import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DrawdownChart({ data }) {
  if (!data || !data.portfolio || data.portfolio.length === 0) return <div className="text-gray-500 text-sm py-10 text-center">No drawdown data available yet.</div>

  const chartData = data.portfolio.map(p => ({
    date: p.date,
    drawdown: parseFloat(((p.drawdown ?? 0) * 100).toFixed(2))
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto', 0]} />
        <Tooltip formatter={(v) => `${v.toFixed(2)}%`} />
        <Area dataKey="drawdown" stroke="#f43f5e" fill="rgba(244,63,94,0.15)" name="Drawdown %" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
