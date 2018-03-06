import config from 'config'
import _ from 'lodash'
import jsonDiffPatch from '@jimpick/jsondiffpatch'
import createProviders from './providersFactory'
import { exchangeRepo, cashPairRepo } from '../repositories/index'

const diffPatcher = jsonDiffPatch.create()

export default async (io, store) => {
  const {
    exchanges,
    cashPairs,
    defaultSymbol,
  } = await getDBEntities()

  // creating providers for fetching data from exchanges and saving to redux store
  try {
    createProviders(exchanges, store)
  } catch (err) {
    console.log(err.message)
  }

  const ticker = io.of('/ticker')

  // providing ticker socket lifecycle logic
  provideTickerSocket(ticker, store, cashPairs, defaultSymbol)
}

const provideTickerSocket = (io, store, cashPairs, defaultSymbol) => {
  // storing clients
  const clients = []

  // sending updates for all clients
  sendClientsUpdates(store, clients)

  // on new client connection
  io.on('connection', (socket) => {
    console.log('Client connected to ticker socket')
    const client = createClient(socket, defaultSymbol)
    clients.push(client)

    // on changing client filters
    socket.on('changeFilters', (filters) => {
      client.symbol = findCashPair(cashPairs, cashPair)
      client.socket.emit('data', store.getState())
    })

    // on client disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected from ticker socket')
      clients.splice(client, 1)
    })
  })
}

const sendClientsUpdates = (store, clients) => {
  // get current ticker state as previous
  let prevTickerState = store.getState()

  // send client updates every 1000 milliseconds
  setInterval(() => {
    //get current ticker state
    const tickerState = store.getState()
    // compute differences between previous and new ticker states
    const tickersDelta = diffPatcher.diff(prevTickerState, tickerState)
    // update previous ticker state
    prevTickerState = tickerState

    // if we have any differences
    if (tickersDelta) {
      /**
       * normalize data from:
       *   { price: [oldValue, newValue], volume: [oldValue, newValue] }
       * to:
       *   { price: newValue, volume: newValue }
       */
      const normalizedTickers = normalizeTickers(tickersDelta)

      clients.forEach((client) => {
        const { socket, filters } = client

        // each client has own applied filters, so we compute filtering
        const filteredTickers = filterTickerStoreByClientFilters(normalizedTickers, filters)
        // send filtered data for client
        socket.emit('data', filteredTickers)
    })
    }
  }, 1000)
}

// here we filtering tickers data by filters
const filterTickerStoreByClientFilters = (tickers, { symbol }) => Object
  .entries(tickers)
  .reduce((total, [key, tickerForCashPairs]) => {
  const filteredTicker = total[key] || {}
  filteredTicker[symbol._id] = tickerForCashPairs[symbol._id]
    total[key] = filteredTicker
}, {})

// create client object
const createClient = (socket, symbol) => ({
  socket,
  symbol,
  filters: {},
})

const normalizeTickers = tickers => _.mergeWith({}, tickers, (objValue, srcValue) => {
  if (_.isArray(srcValue)) {
    return srcValue[srcValue.length - 1]
  }
})

const findCashPair = (cashPairs, id) => cashPairs.find(item => item._id === id)

// getting some entities from database
const getDBEntities = async () => {
  const exchanges = await exchangeRepo.findAllAndFilterDeepRelations()
  const cashPairs = await cashPairRepo.findAllWithRelations()
  const defaultSymbol = await cashPairRepo.findOneByNameWithRelations(config.get('defaults.cashPair'))

  return {
    exchanges,
    cashPairs,
    defaultSymbol,
  }
}
