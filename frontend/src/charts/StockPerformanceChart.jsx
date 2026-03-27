import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid } from 'recharts'

export default function StockPerformanceChart({ holdings }) {
  if (!holdings || holdings.length === 0) return <div className="text-gray-500 text-sm py-10 text-center">No holdings to display.</div>

  const data = holdings.map(h => ({
    name: h.ticker.replace('.NS', ''),
    returnPct: parseFloat((h.return_pct * 100).toFixed(2))
  })).sort((a,b) => b.returnPct - a.returnPct)

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262a33" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip 
          cursor={{ fill: '#262a33' }}
          contentStyle={{ backgroundColor: '#1a1d24', borderColor: '#262a33', color: '#f1f5f9', fontSize: '12px' }}
          formatter={(value) => `${value}%`} 
        />
        <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
        <Bar dataKey="returnPct" radius={[2, 2, 0, 0]} maxBarSize={40}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.returnPct >= 0 ? '#10b981' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
