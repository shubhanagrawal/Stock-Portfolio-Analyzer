import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

export default function StockPerformanceChart({ holdings }) {
  if (!holdings || holdings.length === 0) return <div className="text-gray-500 text-sm py-10 text-center">No holdings to display.</div>

  const data = holdings.map(h => ({
    name: h.ticker,
    returnPct: parseFloat((h.return_pct * 100).toFixed(2))
  })).sort((a,b) => b.returnPct - a.returnPct)

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip formatter={(value) => `${value}%`} />
        <ReferenceLine y={0} stroke="#cbd5e1" />
        <Bar dataKey="returnPct" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.returnPct >= 0 ? '#10b981' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
