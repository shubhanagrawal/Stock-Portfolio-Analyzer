import client from './client'

export const getAllTransactions = () => client.get('/transactions')
export const createTransaction = (data) => client.post('/transactions', data)
export const updateTransaction = (id, data) => client.put(`/transactions/${id}`, data)
export const deleteTransaction = (id) => client.delete(`/transactions/${id}`)
export const importCSV = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return client.post('/transactions/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
