import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, AlertCircle } from 'lucide-react';

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image: string;
}

const CryptoWidget = () => {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // List of popular cryptocurrencies to display
  const cryptoIds = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana', 'dogecoin'];

  // Mock data for demonstration when API is unavailable
  const mockCryptoData: CryptoData[] = [
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'btc',
      current_price: 67234.50,
      price_change_percentage_24h: 2.45,
      market_cap: 1326789012345,
      image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'eth',
      current_price: 3456.78,
      price_change_percentage_24h: -1.23,
      market_cap: 415672834567,
      image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
    },
    {
      id: 'binancecoin',
      name: 'BNB',
      symbol: 'bnb',
      current_price: 592.34,
      price_change_percentage_24h: 0.87,
      market_cap: 86234567890,
      image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png'
    },
    {
      id: 'cardano',
      name: 'Cardano',
      symbol: 'ada',
      current_price: 0.457,
      price_change_percentage_24h: -2.10,
      market_cap: 16123456789,
      image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png'
    },
    {
      id: 'solana',
      name: 'Solana',
      symbol: 'sol',
      current_price: 187.92,
      price_change_percentage_24h: 4.56,
      market_cap: 89234567890,
      image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
    },
    {
      id: 'dogecoin',
      name: 'Dogecoin',
      symbol: 'doge',
      current_price: 0.13456,
      price_change_percentage_24h: 1.89,
      market_cap: 19876543210,
      image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png'
    }
  ];

  const fetchCryptoData = async () => {
    try {
      setError(null);
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${cryptoIds.join(',')}&order=market_cap_desc&per_page=10&page=1&sparkline=false`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCryptos(data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      // If API fails (e.g., CORS in development), fall back to mock data
      console.warn('API fetch failed, using mock data:', err);
      setCryptos(mockCryptoData);
      setLastUpdated(new Date());
      setLoading(false);
      // Don't set error state when using fallback data
    }
  };

  // Fetch data on component mount and set up auto-refresh
  useEffect(() => {
    fetchCryptoData();

    // Set up auto-refresh every 30 seconds
    intervalRef.current = setInterval(fetchCryptoData, 30000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    setLoading(true);
    fetchCryptoData();
  };

  // Format price with appropriate decimal places
  const formatPrice = (price: number): string => {
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  // Format market cap
  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  };

  // Format percentage change
  const formatPercentageChange = (change: number): string => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="rounded-xl bg-white p-8 shadow-2xl">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-xl font-bold text-gray-800">Error Loading Crypto Data</h2>
            <p className="mb-4 text-gray-600">{error}</p>
            <button
              onClick={handleRefresh}
              className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center text-2xl font-bold text-gray-800">
                <DollarSign className="mr-2 h-8 w-8 text-green-500" />
                Crypto Price Tracker
              </h1>
              {lastUpdated && (
                <p className="mt-1 text-sm text-gray-600">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`rounded-lg p-2 transition-colors ${
                loading
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Crypto Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading && cryptos.length === 0 ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-xl bg-white p-6 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gray-300"></div>
                  <div className="flex-1">
                    <div className="mb-2 h-4 w-24 rounded bg-gray-300"></div>
                    <div className="h-3 w-16 rounded bg-gray-300"></div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-2 h-6 w-32 rounded bg-gray-300"></div>
                  <div className="h-4 w-20 rounded bg-gray-300"></div>
                </div>
              </div>
            ))
          ) : (
            cryptos.map((crypto) => (
              <div key={crypto.id} className="rounded-xl bg-white p-6 shadow-lg transition-transform hover:scale-105">
                {/* Crypto Header */}
                <div className="mb-4 flex items-center space-x-4">
                  <img
                    src={crypto.image}
                    alt={crypto.name}
                    className="h-12 w-12 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{crypto.name}</h3>
                    <p className="text-sm font-medium uppercase text-gray-500">{crypto.symbol}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <p className="text-2xl font-bold text-gray-800">{formatPrice(crypto.current_price)}</p>
                </div>

                {/* Price Change */}
                <div className="mb-3 flex items-center space-x-2">
                  {crypto.price_change_percentage_24h >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      crypto.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {formatPercentageChange(crypto.price_change_percentage_24h)}
                  </span>
                  <span className="text-sm text-gray-500">24h</span>
                </div>

                {/* Market Cap */}
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Market Cap</p>
                  <p className="font-semibold text-gray-800">{formatMarketCap(crypto.market_cap)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 rounded-xl bg-white p-4 shadow-lg">
          <p className="text-center text-sm text-gray-600">
            Data provided by{' '}
            <a
              href="https://coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline hover:text-blue-600"
            >
              CoinGecko
            </a>
            {' • '}Auto-refreshes every 30 seconds
            {/* Show indicator if using mock data */}
            {cryptos.length > 0 && cryptos[0].current_price === 67234.50 && (
              <span className="ml-2 rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                Demo Data
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CryptoWidget;