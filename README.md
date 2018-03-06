# Node.js code presentation

## gdaxApi.js

It is module for GDAX exchange. It uses official GDAX node api and performs calls different endpoints like: 
fetchCashPairs, fetchCurrencies, fetch OrderBook.

## httpOrderBook.js

It is module for working with exchange orderBook by http requests. It dispatches action to store all fetched data
in redux store

## providersFactory.js

It is module for confguring providers for all exchange api. each provider consist of different sets of components 
like httpOrderBook.js 

## socketClientProvider.js

It is module creates socket channel for sending exchanges tickers data updates to connected clients.
