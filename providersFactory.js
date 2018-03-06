import HttpBook from '../dataProviders/components/httpBook'
import HttpBooks from '../dataProviders/components/httpBooks'
import HttpTicker from '../dataProviders/components/httpTicker'
import SocketBook from '../dataProviders/components/socketBook'
import SocketTicker from '../dataProviders/components/socketTicker'
import Provider from '../dataProviders/provider'
import * as managers from '../dataProviders/orderBookManagers/index'
import * as createConfig from '../dataProviders/providersCreateConfig'
import * as preparers from '../exchangeApi/dataPreparers'
import * as utils from '../tools/providerFactoryUtils'

export default (exchanges, store) => {
  // configuring all exchanges data providers here and save to array
  const providers = [
    ...createHttpSimpleProviders(exchanges, store),
    ...createSocketSimpleProviders(exchanges, store),
    ...createHttpEntireBookProviders(exchanges, store),
    ...createSocketManagedBookProviders(exchanges, store),
  ]

  // run processing logic for all providers
  providers.forEach((provider) => {
    provider.getAll().forEach((component) => {
      if (component.requireStartCall) {
        component.processing()
      }
    })
  })
}

/*
  Here we creating socket providers
 */
const createSocketSimpleProviders = (exchanges, store) => exchanges
  .filter(exchange => createConfig.socketSimple.includes(exchange.code))
  .map((exchange) => {
    // initializing params
    const { code } = exchange
    const symbols = utils.mapAllNames(exchange.cashPairs)
    const params = {
      exchange: utils.findExchange(exchanges, code),
      store,
    }

    // initializing components
    // socketBook - subscribing orderBook socket channel for exchange api
    const socketBook = new SocketBook(params)
    // socketTicker - subscribing ticker socket channel for exchange api
    const socketTicker = new SocketTicker(params)
    // middleware for binding socket updates
    const bookManager = new managers[code]({
      ticker: socketTicker.processing.bind(socketTicker),
      book: socketBook.processing.bind(socketBook),
    }, symbols)
    bookManager.processBookCache()

    // return new provider with chained components
    return new Provider()
      .add(socketBook)
      .add(socketTicker)
  })

const createHttpSimpleProviders = (exchanges, store) => exchanges
  .filter(exchange => createConfig.httpSimple.includes(exchange.code))
  .map((exchange) => {
    const { code } = exchange
    const params = utils.getParams(code, exchanges, store)

    return new Provider()
      .add(new HttpBook(params))
      .add(new HttpTicker(params))
  })

const createHttpEntireBookProviders = (exchanges, store) => exchanges
  .filter(exchange => createConfig.httpEntireBook.includes(exchange.code))
  .map((exchange) => {
    const { code } = exchange
    const params = utils.getParams(code, exchanges, store)

    return new Provider()
      .add(new HttpBooks(params))
      .add(new HttpTicker(params))
  })

const createSocketManagedBookProviders = (exchanges, store) => exchanges
  .filter(exchange => createConfig.socketManagedBook.includes(exchange.code))
  .map((exchange) => {
    const { code } = exchange
    const preparer = preparers[code]
    const params = {
      exchange,
      store,
    }

    const symbols = utils.mapWsNames(exchange.cashPairs)
    const socketBook = new SocketBook(params)
    const socketTicker = new SocketTicker(params)

    preparer.prepareSocketUpdates(
      symbols,
      socketBook.processing.bind(socketBook),
      socketTicker.processing.bind(socketTicker)
    )

    return new Provider()
      .add(socketBook)
      .add(socketTicker)
  })

const createHitbtcProvider = (exchanges, store) => {
  const code = 'hitbtc'
  const params = utils.getParams(code, exchanges, store)
  const { exchange } = params
  const symbols = utils.mapAllNames(exchange.cashPairs)
  const socketBook = new SocketBook({
    exchange,
    store,
  })

  const bookManager = new managers[code]({
    book: socketBook.processing.bind(socketBook),
  }, symbols)
  bookManager.processBookCache()

  const provider = new Provider()
    .add(socketBook)
    .add(new HttpTicker(params))

  return [provider]
}

const createBitfinexProvider = (exchanges, store) => {
  const code = 'bitfinex'
  const params = utils.getParams(code, exchanges, store)
  const { exchange, preparer } = params
  const symbols = utils.mapWsNames(exchange.cashPairs)

  const socketBook = new SocketBook({
    exchange,
    store,
  })

  preparer.prepareSocketUpdates(
    symbols,
    socketBook.processing.bind(socketBook),
  )

  const provider = new Provider()
    .add(socketBook)
    .add(new HttpTicker(params))

  return [provider]
}
