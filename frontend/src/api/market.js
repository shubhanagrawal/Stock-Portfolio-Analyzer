import client from './client'

export const getTickerQuote = async (ticker) => {
  return await client.get(`/market/quote/${ticker}`)
}
