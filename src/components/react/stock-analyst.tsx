import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Settings,
  DollarSign,
  BarChart3,
  Clock,
  AlertCircle,
  Info,
  Target,
  Calendar
} from 'lucide-react';
import * as d3 from 'd3';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  weekHigh52: number;
  weekLow52: number;
  priceHistory: Array<{ date: string; price: number; }>;
}

interface PredictionData {
  endOfDay: {
    price: number;
    confidence: number;
    range: { min: number; max: number; };
  };
  sevenDay: {
    price: number;
    confidence: number;
    range: { min: number; max: number; };
  };
}

interface LLMSummary {
  background: string;
  news: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  riskAssessment: string;
  opportunities: string;
}

interface WidgetConfig {
  selectedStock: string;
  autoRefresh: boolean;
  refreshInterval: number;
  showPredictions: boolean;
  theme: 'light' | 'dark';
}

const DEFAULT_CONFIG: WidgetConfig = {
  selectedStock: 'AAPL',
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  showPredictions: true,
  theme: 'light'
};

// Mock stock data for demonstration
const MOCK_STOCKS: { [key: string]: StockData } = {
  'AAPL': {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 182.34,
    change: 2.45,
    changePercent: 1.36,
    volume: 45678900,
    marketCap: 2834567890000,
    peRatio: 28.45,
    weekHigh52: 199.62,
    weekLow52: 164.08,
    priceHistory: [
      { date: '2024-01-15', price: 180.25 },
      { date: '2024-01-16', price: 181.45 },
      { date: '2024-01-17', price: 179.89 },
      { date: '2024-01-18', price: 181.23 },
      { date: '2024-01-19', price: 182.34 },
    ]
  },
  'MSFT': {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 409.87,
    change: -3.21,
    changePercent: -0.78,
    volume: 23456789,
    marketCap: 3045678901234,
    peRatio: 32.18,
    weekHigh52: 420.45,
    weekLow52: 309.45,
    priceHistory: [
      { date: '2024-01-15', price: 412.25 },
      { date: '2024-01-16', price: 411.45 },
      { date: '2024-01-17', price: 413.89 },
      { date: '2024-01-18', price: 413.08 },
      { date: '2024-01-19', price: 409.87 },
    ]
  },
  'GOOGL': {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 142.56,
    change: 1.89,
    changePercent: 1.34,
    volume: 34567890,
    marketCap: 1789012345678,
    peRatio: 24.67,
    weekHigh52: 152.34,
    weekLow52: 129.45,
    priceHistory: [
      { date: '2024-01-15', price: 140.25 },
      { date: '2024-01-16', price: 141.45 },
      { date: '2024-01-17', price: 140.89 },
      { date: '2024-01-18', price: 140.67 },
      { date: '2024-01-19', price: 142.56 },
    ]
  },
  'TSLA': {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 248.92,
    change: 8.45,
    changePercent: 3.51,
    volume: 67890123,
    marketCap: 789012345678,
    peRatio: 45.23,
    weekHigh52: 299.29,
    weekLow52: 138.80,
    priceHistory: [
      { date: '2024-01-15', price: 240.25 },
      { date: '2024-01-16', price: 242.45 },
      { date: '2024-01-17', price: 244.89 },
      { date: '2024-01-18', price: 240.47 },
      { date: '2024-01-19', price: 248.92 },
    ]
  }
};

// Mock LLM summaries
const MOCK_SUMMARIES: { [key: string]: LLMSummary } = {
  'AAPL': {
    background: 'Apple Inc. is a multinational technology company headquartered in Cupertino, California. Known for consumer electronics like iPhone, iPad, Mac computers, and services.',
    news: 'Recent iPhone 15 sales showing strong performance in international markets. App Store revenue continues to grow with increased developer adoption of new features.',
    sentiment: 'bullish',
    riskAssessment: 'Moderate risk due to supply chain dependencies and regulatory scrutiny in key markets.',
    opportunities: 'Expansion in emerging markets, AI integration in products, and growth in services revenue streams.'
  },
  'MSFT': {
    background: 'Microsoft Corporation develops, licenses, and supports software, services, devices and solutions worldwide. Major player in cloud computing with Azure.',
    news: 'Azure cloud services showing consistent growth. New AI integrations in Office 365 driving enterprise adoption. Gaming division performing well.',
    sentiment: 'bullish',
    riskAssessment: 'Low to moderate risk with diversified revenue streams and strong enterprise relationships.',
    opportunities: 'AI market leadership, continued cloud expansion, and enterprise digital transformation trends.'
  },
  'GOOGL': {
    background: 'Alphabet Inc. is the parent company of Google, operating in search, advertising, cloud computing, and various other technology sectors.',
    news: 'Search advertising revenue remains strong. Google Cloud gaining market share. AI developments in Bard and other products showing promise.',
    sentiment: 'neutral',
    riskAssessment: 'Regulatory challenges in multiple jurisdictions. Competition in AI and cloud markets intensifying.',
    opportunities: 'AI leadership position, autonomous vehicle technology through Waymo, and healthcare technology investments.'
  },
  'TSLA': {
    background: 'Tesla, Inc. designs, develops, manufactures, and sells electric vehicles and energy generation and storage systems worldwide.',
    news: 'Production ramping up at new facilities. Cybertruck deliveries beginning. Energy storage business growing rapidly.',
    sentiment: 'bullish',
    riskAssessment: 'High volatility due to production challenges and market competition. Dependent on CEO leadership.',
    opportunities: 'EV market expansion, autonomous driving technology, and energy storage market growth.'
  }
};

// Mock predictions
const MOCK_PREDICTIONS: { [key: string]: PredictionData } = {
  'AAPL': {
    endOfDay: { price: 184.50, confidence: 78, range: { min: 181.20, max: 187.80 } },
    sevenDay: { price: 186.25, confidence: 65, range: { min: 178.40, max: 194.10 } }
  },
  'MSFT': {
    endOfDay: { price: 412.30, confidence: 72, range: { min: 407.50, max: 417.10 } },
    sevenDay: { price: 415.60, confidence: 68, range: { min: 398.20, max: 433.00 } }
  },
  'GOOGL': {
    endOfDay: { price: 144.20, confidence: 75, range: { min: 141.80, max: 146.60 } },
    sevenDay: { price: 147.30, confidence: 62, range: { min: 138.90, max: 155.70 } }
  },
  'TSLA': {
    endOfDay: { price: 252.30, confidence: 69, range: { min: 245.80, max: 258.80 } },
    sevenDay: { price: 261.40, confidence: 58, range: { min: 235.20, max: 287.60 } }
  }
};

const StockAnalystWidget = () => {
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
  const [currentStock, setCurrentStock] = useState<StockData>(MOCK_STOCKS['AAPL']);
  const [predictions, setPredictions] = useState<PredictionData>(MOCK_PREDICTIONS['AAPL']);
  const [summary, setSummary] = useState<LLMSummary>(MOCK_SUMMARIES['AAPL']);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const chartRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('stock-analyst-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        // Load the saved stock
        if (MOCK_STOCKS[parsed.selectedStock]) {
          setCurrentStock(MOCK_STOCKS[parsed.selectedStock]);
          setPredictions(MOCK_PREDICTIONS[parsed.selectedStock]);
          setSummary(MOCK_SUMMARIES[parsed.selectedStock]);
        }
      } catch (error) {
        console.error('Failed to parse saved config:', error);
      }
    }
  }, []);

  // Save configuration to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('stock-analyst-config', JSON.stringify(config));
  }, [config]);

  // Set up auto-refresh
  useEffect(() => {
    if (config.autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchStockData(config.selectedStock);
      }, config.refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config.autoRefresh, config.refreshInterval, config.selectedStock]);

  // Listen for postMessage configuration from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'STOCK_ANALYST_CONFIG') {
        setConfig(prev => ({ ...prev, ...event.data.config }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchStockData = async (symbol: string) => {
    setLoading(true);
    try {
      // In a real implementation, you would fetch from a stock API
      // For demo purposes, we're using mock data with slight variations
      const baseStock = MOCK_STOCKS[symbol];
      if (baseStock) {
        const variation = (Math.random() - 0.5) * 2; // -1 to 1
        const updatedStock = {
          ...baseStock,
          price: baseStock.price + variation,
          change: baseStock.change + (variation * 0.5),
          changePercent: ((baseStock.price + variation - baseStock.price) / baseStock.price) * 100
        };
        setCurrentStock(updatedStock);
        setPredictions(MOCK_PREDICTIONS[symbol]);
        setSummary(MOCK_SUMMARIES[symbol]);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockSelect = (symbol: string) => {
    setConfig(prev => ({ ...prev, selectedStock: symbol }));
    fetchStockData(symbol);
    setShowSearchResults(false);
    setSearchTerm('');
  };

  const filteredStocks = Object.values(MOCK_STOCKS).filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format large numbers
  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  // Create mini chart
  useEffect(() => {
    if (!chartRef.current || !currentStock.priceHistory.length) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const width = 200 - margin.left - margin.right;
    const height = 60 - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain([0, currentStock.priceHistory.length - 1])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain(d3.extent(currentStock.priceHistory, d => d.price) as [number, number])
      .range([height, 0]);

    const line = d3.line<{ date: string; price: number }>()
      .x((d, i) => x(i))
      .y(d => y(d.price))
      .curve(d3.curveMonotoneX);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("path")
      .datum(currentStock.priceHistory)
      .attr("fill", "none")
      .attr("stroke", currentStock.change >= 0 ? "#10b981" : "#ef4444")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add dots for data points
    g.selectAll(".dot")
      .data(currentStock.priceHistory)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", (d, i) => x(i))
      .attr("cy", d => y(d.price))
      .attr("r", 2)
      .attr("fill", currentStock.change >= 0 ? "#10b981" : "#ef4444");

  }, [currentStock]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-4 h-4" />;
      case 'bearish': return <TrendingDown className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  return (
    <div className={`min-h-screen p-4 ${config.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className={`rounded-xl p-6 shadow-lg ${config.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              Stock Analyst
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchStockData(config.selectedStock)}
                disabled={loading}
                className={`p-2 rounded-lg transition-colors ${
                  loading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : config.theme === 'dark'
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-lg transition-colors ${
                  config.theme === 'dark'
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stock Search */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search stocks by symbol or company name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchResults(e.target.value.length > 0);
                }}
                className={`flex-1 p-2 rounded-lg border ${
                  config.theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            
            {showSearchResults && searchTerm && (
              <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-10 ${
                config.theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                {filteredStocks.map(stock => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleStockSelect(stock.symbol)}
                    className={`w-full p-3 text-left hover:bg-opacity-10 hover:bg-blue-500 flex items-center justify-between ${
                      config.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{stock.symbol}</div>
                      <div className="text-sm text-gray-500">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(stock.price)}</div>
                      <div className={`text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Main Stock Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock Overview */}
          <div className={`lg:col-span-2 rounded-xl p-6 shadow-lg ${config.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold">{currentStock.symbol}</h2>
                <p className="text-lg text-gray-500">{currentStock.name}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{formatCurrency(currentStock.price)}</div>
                <div className={`flex items-center justify-end gap-1 ${currentStock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {currentStock.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span>{currentStock.change >= 0 ? '+' : ''}{currentStock.change.toFixed(2)}</span>
                  <span>({currentStock.changePercent.toFixed(2)}%)</span>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-3 rounded-lg ${config.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-500">Volume</div>
                <div className="font-semibold">{currentStock.volume.toLocaleString()}</div>
              </div>
              <div className={`p-3 rounded-lg ${config.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-500">Market Cap</div>
                <div className="font-semibold">{formatLargeNumber(currentStock.marketCap)}</div>
              </div>
              <div className={`p-3 rounded-lg ${config.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-500">P/E Ratio</div>
                <div className="font-semibold">{currentStock.peRatio.toFixed(2)}</div>
              </div>
              <div className={`p-3 rounded-lg ${config.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-500">52W Range</div>
                <div className="font-semibold text-xs">
                  {formatCurrency(currentStock.weekLow52)} - {formatCurrency(currentStock.weekHigh52)}
                </div>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Price Trend</h3>
              <svg ref={chartRef} width="200" height="60" className="border rounded"></svg>
            </div>
          </div>

          {/* Predictions */}
          {config.showPredictions && (
            <div className={`rounded-xl p-6 shadow-lg ${config.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-purple-500" />
                Predictions
              </h3>
              
              <div className="space-y-4">
                {/* End of Day */}
                <div className={`p-4 rounded-lg ${config.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold">End of Day</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(predictions.endOfDay.price)}</div>
                  <div className="text-sm text-gray-500">
                    Confidence: {predictions.endOfDay.confidence}%
                  </div>
                  <div className="text-xs text-gray-400">
                    Range: {formatCurrency(predictions.endOfDay.range.min)} - {formatCurrency(predictions.endOfDay.range.max)}
                  </div>
                </div>

                {/* 7-Day */}
                <div className={`p-4 rounded-lg ${config.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span className="font-semibold">7-Day Target</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(predictions.sevenDay.price)}</div>
                  <div className="text-sm text-gray-500">
                    Confidence: {predictions.sevenDay.confidence}%
                  </div>
                  <div className="text-xs text-gray-400">
                    Range: {formatCurrency(predictions.sevenDay.range.min)} - {formatCurrency(predictions.sevenDay.range.max)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LLM Summary */}
        <div className={`rounded-xl p-6 shadow-lg ${config.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-indigo-500" />
            AI Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Company Background</h4>
              <p className="text-sm text-gray-600 mb-4">{summary.background}</p>
              
              <h4 className="font-semibold mb-2">Recent News</h4>
              <p className="text-sm text-gray-600">{summary.news}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                Market Sentiment 
                <span className={`flex items-center gap-1 ${getSentimentColor(summary.sentiment)}`}>
                  {getSentimentIcon(summary.sentiment)}
                  {summary.sentiment.toUpperCase()}
                </span>
              </h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-sm mb-1">Risk Assessment</h5>
                  <p className="text-sm text-gray-600">{summary.riskAssessment}</p>
                </div>
                
                <div>
                  <h5 className="font-medium text-sm mb-1">Opportunities</h5>
                  <p className="text-sm text-gray-600">{summary.opportunities}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-xl p-6 max-w-md w-full mx-4 ${config.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-xl font-semibold mb-4">Widget Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Auto Refresh</label>
                  <input
                    type="checkbox"
                    checked={config.autoRefresh}
                    onChange={(e) => setConfig(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Refresh Interval (seconds)</label>
                  <input
                    type="number"
                    value={config.refreshInterval / 1000}
                    onChange={(e) => setConfig(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) * 1000 }))}
                    min="5"
                    max="300"
                    className={`w-full p-2 rounded-lg border ${
                      config.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Show Predictions</label>
                  <input
                    type="checkbox"
                    checked={config.showPredictions}
                    onChange={(e) => setConfig(prev => ({ ...prev, showPredictions: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Theme</label>
                  <select
                    value={config.theme}
                    onChange={(e) => setConfig(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
                    className={`w-full p-2 rounded-lg border ${
                      config.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className={`px-4 py-2 rounded-lg ${
                    config.theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAnalystWidget;