import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#a855f7']

export default function SectorChart({ data }) {
  if (!data || !data.sectors || data.sectors.length === 0) {
    return <div className="text-gray-500 text-sm py-10 text-center">No sector data available.</div>
  }

  const chartData = data.sectors.map(s => ({
    name: s.sector,
    value: parseFloat(s.value.toFixed(2))
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#1a1d24', borderColor: '#262a33', color: '#f1f5f9', fontSize: '12px' }}
          itemStyle={{ color: '#e2e8f0' }}
          formatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)} 
        />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  )
}
