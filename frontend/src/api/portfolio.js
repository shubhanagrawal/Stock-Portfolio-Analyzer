import client from './client'

export const getSummary = () => client.get('/portfolio/summary')
export const getPerformance = (days = 90) => {
  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setDate(toDate.getDate() - days)
  return client.get(`/portfolio/performance?from_date=${fromDate.toISOString().split('T')[0]}&to_date=${toDate.toISOString().split('T')[0]}`)
}
export const getRisk = () => client.get('/portfolio/risk')
export const getReport = () => client.get('/portfolio/report', { responseType: 'blob' })
export const getCorrelation = () => client.get('/portfolio/correlation')
export const getSectors = () => client.get('/portfolio/sectors')
export const getRolling = (window = 30) => client.get(`/portfolio/rolling?window=${window}`)
export const getHeatmap = () => client.get('/portfolio/heatmap')
