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
