import Gdax from 'gdax'
import axios from 'axios'

const publicClient = new Gdax.PublicClient()
const apiUrl = 'https://api.gdax.com'

const fetchCashPairs = () => new Promise((resolve, reject) => {
  // fetching cash pairs from gdax api
  publicClient.getProducts().then((data) => {
    const cashPairs = []
    // mapping data to needed format
    data.forEach(({ id, base_currency, quote_currency, base_min_size }) => {
      cashPairs.push({
        name: id,
        ws_name: id,
        base: base_currency,
        quote: quote_currency,
        base_min_size,
      })
    })
    resolve(cashPairs)
  }).catch(err => reject(err))
})

const fetchCurrencies = () => new Promise((resolve, reject) => {
  // fetching currencies from gdax api
  publicClient.getCurrencies().then((data) => {
    const currencies = []
    // mapping data to needed format
    data.forEach(({ id, name }) => {
      currencies.push({
        name: id,
        display_name: name,
      })
    })
    resolve(currencies)
  }).catch(err => reject(err))
})

const fetchDayStats = () => new Promise((resolve, reject) => {
  // fetching tickers from gdax api
  axios.get(`${apiUrl}/products/stats`)
    .then((data) => {
      resolve(data.data)
    }).catch(err => reject(err))
})

const fetchCashPairDayStats = cashPair => new Promise((resolve, reject) => {
  // fetching tickers by cash pair from gdax api
  publicClient.getProduct24HrStats(cashPair).then(({ high, last }) => {
    const data = {
      last,
      high,
    }

    resolve(data)
  }).catch(err => reject(err))
})

const fetchOrderBook = (cashPair, options) => new Promise((resolve) => {
  // fetching order book from gdax api
  publicClient.getProductOrderBook(cashPair, options).then(data => resolve(data))
})

export default {
  fetchCashPairDayStats,
  fetchCurrencies,
  fetchOrderBook,
  fetchCashPairs,
  fetchDayStats,
  fetchTicker,
}
