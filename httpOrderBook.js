import BaseComponent from './baseComponent'
import { updateExchangeCashPairTicker } from '../../redux/actions'

export default class extends BaseComponent {
  constructor(params) {
    super(params, true)
  }

  // run update loop
  processing() {
    setInterval(this.handleTick.bind(this), this.intervals.ticker)
  }

  async handleTick() {
    const { exchange, store, preparer } = this

    // fetch tickers data from exchange api
    const tickers = await preparer.fetchDayStats()

    // process data
    tickers.forEach((ticker) => {
      const exCashPair = exchange.cashPairs.find(item => item.name === ticker.symbol)
      if (exCashPair) {
        const { _id: cashPairId } = exCashPair.cash_pair
        // dispatch redux action for update new ticker data for some exchange and cashPair
        store.dispatch(updateExchangeCashPairTicker(exchange._id, cashPairId, ticker))
      }
    })
  }
}
