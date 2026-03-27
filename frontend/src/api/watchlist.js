import client from './client'

export const getWatchlist = () => client.get('/watchlist')
export const addToWatchlist = (ticker) => client.post('/watchlist', { ticker })
export const removeFromWatchlist = (ticker) => client.delete(`/watchlist/${ticker}`)
