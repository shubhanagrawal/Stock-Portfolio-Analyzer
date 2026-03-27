import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Upload, FileText } from 'lucide-react'
import { getAllTransactions, createTransaction, deleteTransaction, importCSV } from '../api/transactions'
import ErrorState from '../components/ErrorState'

export default function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    ticker: '',
    transaction_type: 'BUY',
    quantity: '',
    price: '',
    transaction_date: new Date().toISOString().split('T')[0]
  })
  
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['transactions'], queryFn: getAllTransactions })

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions'])
      queryClient.invalidateQueries(['portfolio'])
      setIsModalOpen(false)
      setFormData({ ticker: '', transaction_type: 'BUY', quantity: '', price: '', transaction_date: new Date().toISOString().split('T')[0] })
    },
    onError: (err) => {
      alert(err.detail || 'Failed to add transaction')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions'])
      queryClient.invalidateQueries(['portfolio'])
    }
  })

  const importMutation = useMutation({
    mutationFn: importCSV,
    onSuccess: (result) => {
      setImportResult(result)
      queryClient.invalidateQueries(['transactions'])
      queryClient.invalidateQueries(['portfolio'])
    },
    onError: (err) => {
      alert(err.detail || 'Failed to import CSV')
    }
  })

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      importMutation.mutate(file)
    }
  }

  if (isLoading) return <div className="p-6 text-gray-500 font-mono text-sm">LOADING TRANSACTIONS...</div>
  if (error) return <ErrorState message={error.message} />

  const txns = data?.transactions || []

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center bg-gray-900 border border-gray-800 p-4 rounded-sm">
        <div>
          <h2 className="text-sm uppercase font-bold text-gray-100 tracking-wider">Transaction Ledger</h2>
          <p className="text-xs text-gray-400 font-mono mt-1">TOTAL RECORDS: {data?.total || 0}</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
            className="flex items-center space-x-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-sm transition-colors text-xs font-bold uppercase disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{importMutation.isPending ? 'IMPORTING...' : 'IMPORT CSV'}</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-sm transition-colors text-xs font-bold uppercase"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW TRADE</span>
          </button>
        </div>
      </div>

      {importResult && (
        <div className="bg-gray-900 p-4 border border-emerald-900/50 rounded-sm">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-emerald-500 mt-0.5" />
            <div>
              <p className="text-xs font-mono font-bold text-emerald-400 uppercase">
                IMPORT COMPLETE: {importResult.imported} RECORDS PROCESSED
              </p>
              {importResult.errors?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-xs font-mono text-red-500">{err}</p>
                  ))}
                </div>
              )}
              <button onClick={() => setImportResult(null)} className="text-[10px] uppercase font-bold text-gray-500 mt-2 hover:text-gray-300 tracking-wider">
                [ DISMISS ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300 font-mono whitespace-nowrap">
            <thead className="bg-[#0b0c10] text-gray-500 border-b border-gray-800">
              <tr>
                <th className="px-4 py-3 font-semibold tracking-wider">DATE</th>
                <th className="px-4 py-3 font-semibold tracking-wider">TICKER</th>
                <th className="px-4 py-3 font-semibold tracking-wider">TYPE</th>
                <th className="px-4 py-3 font-semibold text-right tracking-wider">QTY</th>
                <th className="px-4 py-3 font-semibold text-right tracking-wider">PRICE</th>
                <th className="px-4 py-3 font-semibold text-right tracking-wider">VALUE</th>
                <th className="px-4 py-3 font-semibold text-center tracking-wider">ACT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {txns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-600">
                    NO TRANSACTIONS FOUND IN LEDGER.
                  </td>
                </tr>
              ) : (
                txns.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-2.5">{txn.transaction_date}</td>
                    <td className="px-4 py-2.5 font-bold text-gray-100">{txn.ticker}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider ${
                        txn.transaction_type === 'BUY' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50' : 'bg-red-900/30 text-red-400 border border-red-900/50'
                      }`}>
                        {txn.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">{txn.quantity}</td>
                    <td className="px-4 py-2.5 text-right">₹{parseFloat(txn.price).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      ₹{(parseFloat(txn.quantity) * parseFloat(txn.price)).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-center">
                        <button 
                          title="Delete"
                          className="text-gray-500 hover:text-red-500 transition-colors"
                          onClick={() => {
                            if (window.confirm(`DELETE ${txn.transaction_type} OF ${txn.ticker}?`)) {
                              deleteMutation.mutate(txn.id)
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-sm shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#0b0c10]">
              <h3 className="text-sm font-bold text-gray-100 tracking-wider uppercase">Execute Trade</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-300">&times;</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate({
                ...formData,
                quantity: parseFloat(formData.quantity),
                price: parseFloat(formData.price)
              })
            }} className="p-6 space-y-4 font-mono text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">Ticker Symbol</label>
                <input 
                  required
                  type="text" 
                  value={formData.ticker}
                  onChange={e => setFormData({...formData, ticker: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                  placeholder="e.g. RELIANCE.NS"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">Order Type</label>
                  <select 
                    value={formData.transaction_type}
                    onChange={e => setFormData({...formData, transaction_type: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">Execution Date</label>
                  <input 
                    required
                    type="date" 
                    value={formData.transaction_date}
                    onChange={e => setFormData({...formData, transaction_date: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none style-color-scheme-dark" 
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">Volume</label>
                  <input 
                    required
                    type="number" 
                    step="0.0001"
                    min="0.0001"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">Price (₹)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold tracking-wider text-gray-400 bg-transparent border border-gray-600 rounded-sm hover:bg-gray-800 uppercase"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-xs font-bold tracking-wider text-white bg-indigo-600 border border-transparent rounded-sm hover:bg-indigo-500 uppercase disabled:opacity-50"
                >
                  {createMutation.isPending ? 'EXECUTING...' : 'CONFIRM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
