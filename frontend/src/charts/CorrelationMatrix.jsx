export default function CorrelationMatrix({ data }) {
  if (!data || !data.tickers || data.tickers.length < 2) {
    return <div className="text-gray-500 text-sm py-10 text-center">Need $\ge$ 2 holdings.</div>
  }

  const { tickers, matrix } = data

  const getColor = (val) => {
    if (val >= 0.7) return 'bg-[#ef4444] text-white font-bold'
    if (val >= 0.3) return 'bg-[#7f1d1d] text-red-100'
    if (val >= -0.3) return 'bg-[#1a1d24] text-gray-400'
    if (val >= -0.7) return 'bg-[#1e3a8a] text-blue-100'
    return 'bg-[#3b82f6] text-white font-bold'
  }

  return (
    <div className="overflow-x-auto w-full pb-2">
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr>
            <th className="px-2 py-1 bg-gray-900 sticky left-0 z-10 border-b border-gray-800"></th>
            {tickers.map(t => (
              <th key={t} className="px-2 py-1 text-gray-500 font-semibold text-center border-b border-gray-800 whitespace-nowrap">
                {t.replace('.NS', '')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickers.map((t1, i) => (
            <tr key={t1}>
              <td className="px-2 py-1.5 bg-gray-900 sticky left-0 z-10 text-gray-400 font-semibold border-r border-gray-800 text-right whitespace-nowrap">
                {t1.replace('.NS', '')}
              </td>
              {matrix[i].map((val, j) => (
                <td key={j} className="p-0.5 min-w-[36px]">
                  <div className={`w-full h-full flex items-center justify-center py-1 rounded-sm ${getColor(val)}`}>
                    {val.toFixed(2)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-gray-500 font-mono">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#3b82f6] inline-block"></span> Negative</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#1a1d24] inline-block"></span> Neutral</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#ef4444] inline-block"></span> Positive</span>
      </div>
    </div>
  )
}
