# Node.js code presentation

## gdaxApi.js

It is module for GDAX exchange. It uses official GDAX node api and performs calls for different endpoints like: 
fetchCashPairs, fetchCurrencies, fetch OrderBook.

## httpOrderBook.js

It is module for working with exchange orderBook by http requests. It dispatches actions for storing all fetched data
in redux store

## providersFactory.js

It is module for configuring providers for all exchange api. Each provider consists of different sets of components 
like httpOrderBook.js 

## socketClientProvider.js

This module creates socket channel for sending exchanges tickers data updates to connected clients.
