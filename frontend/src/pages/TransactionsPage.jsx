import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { getAllTransactions, createTransaction, deleteTransaction } from '../api/transactions'
import ErrorState from '../components/ErrorState'

export default function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  if (isLoading) return <div className="p-6">Loading transactions...</div>
  if (error) return <ErrorState message={error.message} />

  const txns = data?.transactions || []

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
          <p className="text-sm text-gray-500">{data?.total || 0} transactions recorded</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Ticker</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-right">Quantity</th>
                <th className="px-6 py-4 font-medium text-right">Price</th>
                <th className="px-6 py-4 font-medium text-right">Value</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {txns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No transactions found. Add your first trade!
                  </td>
                </tr>
              ) : (
                txns.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{txn.transaction_date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{txn.ticker}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        txn.transaction_type === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {txn.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">{txn.quantity}</td>
                    <td className="px-6 py-4 text-right tabular-nums">₹{parseFloat(txn.price).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td className="px-6 py-4 text-right tabular-nums font-medium">
                      ₹{(parseFloat(txn.quantity) * parseFloat(txn.price)).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center space-x-3">
                        <button 
                          title="Delete"
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          onClick={() => {
                            if (window.confirm(`Delete ${txn.transaction_type} of ${txn.ticker}?`)) {
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

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Add Transaction</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate({
                ...formData,
                quantity: parseFloat(formData.quantity),
                price: parseFloat(formData.price)
              })
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticker (e.g. RELIANCE.NS)</label>
                <input 
                  required
                  type="text" 
                  value={formData.ticker}
                  onChange={e => setFormData({...formData, ticker: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                  placeholder="INFY.NS"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select 
                    value={formData.transaction_type}
                    onChange={e => setFormData({...formData, transaction_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    required
                    type="date" 
                    value={formData.transaction_date}
                    onChange={e => setFormData({...formData, transaction_date: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input 
                    required
                    type="number" 
                    step="0.0001"
                    min="0.0001"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
