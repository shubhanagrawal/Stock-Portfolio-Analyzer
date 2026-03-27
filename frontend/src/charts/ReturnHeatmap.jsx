export default function ReturnHeatmap({ data }) {
  if (!data || !data.data || data.data.length === 0) {
    return <div className="text-gray-500 text-sm py-10 text-center">No return data yet.</div>
  }

  const getColor = (ret) => {
    if (ret > 0.02) return 'bg-[#10b981] text-white font-bold'
    if (ret > 0.005) return 'bg-[#064e3b] text-gray-200'
    if (ret > -0.005) return 'bg-[#1a1d24] text-gray-500 border border-gray-800'
    if (ret > -0.02) return 'bg-[#450a0a] text-gray-200'
    return 'bg-[#ef4444] text-white font-bold'
  }

  // Group by month
  const months = {}
  data.data.forEach(d => {
    if (!months[d.month]) months[d.month] = []
    months[d.month].push(d)
  })

  return (
    <div className="space-y-4 overflow-x-auto w-full pb-2">
      <div className="flex space-x-4 min-w-max">
        {Object.entries(months).map(([month, days]) => (
          <div key={month} className="flex flex-col">
            <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">{month}</p>
            <div className="grid grid-cols-5 gap-1">
              {days.map((d, i) => (
                <div
                  key={i}
                  title={`${d.date}: ${(d.return_val * 100).toFixed(2)}%`}
                  className={`w-6 h-6 rounded-sm text-[9px] flex items-center justify-center cursor-default transition-transform hover:scale-110 ${getColor(d.return_val)}`}
                >
                  {d.day}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-gray-500 pt-2 font-mono">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#ef4444] inline-block"></span> &lt; -2%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#450a0a] inline-block"></span> -2% to 0</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#1a1d24] border border-gray-800 inline-block"></span> ~0%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#064e3b] inline-block"></span> 0 to +2%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#10b981] inline-block"></span> &gt; +2%</span>
      </div>
    </div>
  )
}
