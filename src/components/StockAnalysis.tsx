'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import PriceChart from './PriceChart';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface StockAnalysisProps {
  symbol: string;
  onSelectStock?: (symbol: string) => void;
  analyzeCompetitors?: boolean;
}

export default function StockAnalysis({ symbol, onSelectStock, analyzeCompetitors = true }: StockAnalysisProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ symbol: string; name: string }>>([]);

  useEffect(() => {
    fetchStockData();
  }, [symbol]);

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    
    try {
      const url = `/api/stock?symbol=${symbol}${analyzeCompetitors ? '&analyzeCompetitors=true' : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.error || 'Failed to fetch stock data');
        setSuggestions(result.suggestions || []);
        return;
      }
      
      setData(result);
    } catch (err) {
      setError('Failed to load stock data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 whitespace-pre-line">{error || 'No data available'}</p>
        </div>
        
        {suggestions.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Did you mean one of these?
            </h3>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSelectStock?.(suggestion.symbol)}
                  className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-gray-700 border border-blue-200 dark:border-blue-700 rounded-lg transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-blue-900 dark:text-blue-100">
                        {suggestion.symbol}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        {suggestion.name}
                      </div>
                    </div>
                    <div className="text-blue-600 dark:text-blue-400">→</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const { quote, fundamentals, technicalIndicators, support, resistance, industryInsights, competitorComparison, sectorRanking, historicalData, news } = data;

  return (
    <div className="space-y-6">
      {/* Stock Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{quote.symbol}</h2>
            <p className="text-gray-600 dark:text-gray-400">{quote.name}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(quote.price)}
            </div>
            <div className={`flex items-center gap-1 ${quote.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {quote.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="text-lg font-semibold">
                {formatCurrency(quote.change)} ({formatPercent(quote.changePercent)})
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(quote.open)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">High</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(quote.high)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Low</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(quote.low)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Volume</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {(quote.volume / 1000000).toFixed(2)}M
            </p>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Price Chart (90 Days)</h3>
        <PriceChart data={historicalData} />
      </div>

      {/* Technical Indicators */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Technical Indicators</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">RSI (14)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {technicalIndicators.rsi?.toFixed(2) || 'N/A'}
            </p>
            {technicalIndicators.rsi && (
              <p className={`text-sm ${
                technicalIndicators.rsi > 70 ? 'text-red-600' :
                technicalIndicators.rsi < 30 ? 'text-green-600' :
                'text-gray-600'
              }`}>
                {technicalIndicators.rsi > 70 ? 'Overbought' :
                 technicalIndicators.rsi < 30 ? 'Oversold' : 'Neutral'}
              </p>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">MACD</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {technicalIndicators.macd.macd?.toFixed(2) || 'N/A'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Signal: {technicalIndicators.macd.signal?.toFixed(2) || 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">SMA 20</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {technicalIndicators.sma20 ? formatCurrency(technicalIndicators.sma20) : 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">SMA 50</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {technicalIndicators.sma50 ? formatCurrency(technicalIndicators.sma50) : 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">SMA 200</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {technicalIndicators.sma200 ? formatCurrency(technicalIndicators.sma200) : 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Bollinger Bands</p>
            <p className="text-sm text-gray-900 dark:text-white">
              Upper: {technicalIndicators.bollingerBands.upper ? formatCurrency(technicalIndicators.bollingerBands.upper) : 'N/A'}
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              Lower: {technicalIndicators.bollingerBands.lower ? formatCurrency(technicalIndicators.bollingerBands.lower) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Support & Resistance */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-green-600 mb-4">Support Levels</h3>
          <div className="space-y-2">
            {support.map((level: number, index: number) => (
              <div key={index} className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(level)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-red-600 mb-4">Resistance Levels</h3>
          <div className="space-y-2">
            {resistance.map((level: number, index: number) => (
              <div key={index} className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(level)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fundamentals - Comprehensive View */}
      {fundamentals && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📊 Fundamental Analysis</h3>
          
          {/* Valuation Metrics */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Valuation Ratios</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">P/E Ratio</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.peRatio?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">P/B Ratio</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.pbRatio?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">PEG Ratio</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.pegRatio?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Book Value</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.bookValue ? formatCurrency(fundamentals.bookValue) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Profitability Metrics */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Profitability</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">EPS (₹)</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.eps ? formatCurrency(fundamentals.eps) : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">ROE (%)</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.roe ? `${fundamentals.roe.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Market Cap</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.marketCap ? `₹${(fundamentals.marketCap / 10000000).toFixed(2)}Cr` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Health */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Financial Health</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Debt to Equity</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.debtToEquity?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Beta</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.beta?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Face Value</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.faceValue ? formatCurrency(fundamentals.faceValue) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Dividend Information */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Dividends</h4>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Dividend Yield (%)</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.dividendYield ? `${fundamentals.dividendYield.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Dividend Rate</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.dividend ? formatCurrency(fundamentals.dividend) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* 52 Week Range & Performance */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Performance & Range</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">52W High</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {fundamentals.fiftyTwoWeekHigh ? formatCurrency(fundamentals.fiftyTwoWeekHigh) : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">52W Low</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {fundamentals.fiftyTwoWeekLow ? formatCurrency(fundamentals.fiftyTwoWeekLow) : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Quarterly Growth</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.quarterlyGrowth ? `${fundamentals.quarterlyGrowth.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Yearly Growth</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {fundamentals.yearlyGrowth ? `${fundamentals.yearlyGrowth.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Industry Insights (AI-Powered) */}
      {industryInsights && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">🏭 Industry Insights (AI-Powered)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Sector Information</h4>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sector</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{industryInsights.sector}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Industry P/E Range</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{industryInsights.industryPE}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Industry Avg ROE</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{industryInsights.industryAvgROE}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Face Value (Typical)</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{industryInsights.faceValue}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Industry Trends</h4>
              <div className="space-y-2">
                {industryInsights.industryTrends.map((trend: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <span className="text-blue-600 dark:text-blue-400">📊</span>
                    <span className="text-gray-700 dark:text-gray-300">{trend}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Key Competitors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {industryInsights.competitors.map((competitor: any, index: number) => (
                <button
                  key={index}
                  onClick={() => onSelectStock?.(competitor.symbol)}
                  className="text-left bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 p-4 rounded-lg transition-all hover:shadow-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-gray-900 dark:text-white">{competitor.name}</h5>
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">{competitor.symbol}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{competitor.sector}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{competitor.description}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Click to analyze →</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Competitor Comparison (AI-Powered) */}
      {competitorComparison && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">⚖️ Competitor Comparison (AI-Powered)</h3>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg mb-6">
            <p className="text-gray-800 dark:text-gray-200">{competitorComparison.comparisonSummary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3">💪 Strengths</h4>
              <div className="space-y-2">
                {competitorComparison.strengths.map((strength: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 p-3 rounded border-l-4 border-green-500">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-3">⚠️ Weaknesses</h4>
              <div className="space-y-2">
                {competitorComparison.weaknesses.map((weakness: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 bg-orange-50 dark:bg-orange-900/20 p-3 rounded border-l-4 border-orange-500">
                    <span className="text-orange-600 dark:text-orange-400">!</span>
                    <span className="text-gray-700 dark:text-gray-300">{weakness}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Relative Pricing</h4>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{competitorComparison.relativePricing}</p>
          </div>
        </div>
      )}

      {/* Sector Ranking with Scores */}
      {sectorRanking && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg shadow-lg p-6 border-2 border-purple-300 dark:border-purple-700">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl">🏆</span>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Sector Analysis & Rankings</h3>
          </div>

          {/* Consistency Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-3 mb-4 text-sm">
            <p className="text-blue-900 dark:text-blue-100">
              ℹ️ <strong>Objective Rankings:</strong> All stocks are scored using the same criteria (fundamentals, technicals, valuation). 
              The rankings are consistent - the same stock will have the same score regardless of which competitor you search for.
              The highest-scoring stock is automatically selected as the best pick.
            </p>
          </div>

          {/* Best Pick Recommendation */}
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-900/20 p-5 rounded-lg mb-6 border-l-4 border-yellow-500">
            <h4 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2">💡 AI Recommendation</h4>
            <p className="text-gray-800 dark:text-gray-200 mb-3">{sectorRanking.recommendation}</p>
            <div className="inline-flex items-center gap-2 bg-yellow-200 dark:bg-yellow-800 px-4 py-2 rounded-full">
              <span className="text-2xl">⭐</span>
              <span className="font-bold text-yellow-900 dark:text-yellow-100">
                Best Pick: {sectorRanking.bestPick}
              </span>
            </div>
          </div>

          {/* Comprehensive Investment Analysis */}
          {(sectorRanking as any).bestInvestmentAnalysis && (sectorRanking as any).bestPickData && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-6 mb-6 border-2 border-emerald-400 dark:border-emerald-600 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">💎</span>
                <h4 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  Best Investment Opportunity: {(sectorRanking as any).bestInvestmentAnalysis.bestPickName}
                </h4>
              </div>

              {/* Stock Price & Key Metrics Overview */}
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Price</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency((sectorRanking as any).bestPickData.currentPrice)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">52-Week High</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(sectorRanking as any).bestPickData.fundamentals.fiftyTwoWeekHigh 
                      ? formatCurrency((sectorRanking as any).bestPickData.fundamentals.fiftyTwoWeekHigh) 
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">52-Week Low</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {(sectorRanking as any).bestPickData.fundamentals.fiftyTwoWeekLow 
                      ? formatCurrency((sectorRanking as any).bestPickData.fundamentals.fiftyTwoWeekLow) 
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Valuation Ratios */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📊 Valuation Ratios</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">P/E Ratio</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {(sectorRanking as any).bestPickData.fundamentals.peRatio?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">P/B Ratio</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {(sectorRanking as any).bestPickData.fundamentals.pbRatio?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">ROE %</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {(sectorRanking as any).bestPickData.fundamentals.roe?.toFixed(2) || 'N/A'}%
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Div Yield %</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {(sectorRanking as any).bestPickData.fundamentals.dividendYield?.toFixed(2) || 'N/A'}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Support & Resistance Levels */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3">📉 Support Levels</h5>
                  <div className="space-y-2">
                    {(sectorRanking as any).bestPickData.support && (sectorRanking as any).bestPickData.support.slice(0, 3).map((level: number, idx: number) => (
                      <div key={idx} className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(level)}</span>
                      </div>
                    ))}
                    {!(sectorRanking as any).bestPickData.support && <p className="text-gray-500">N/A</p>}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-3">📈 Resistance Levels</h5>
                  <div className="space-y-2">
                    {(sectorRanking as any).bestPickData.resistance && (sectorRanking as any).bestPickData.resistance.slice(0, 3).map((level: number, idx: number) => (
                      <div key={idx} className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(level)}</span>
                      </div>
                    ))}
                    {!(sectorRanking as any).bestPickData.resistance && <p className="text-gray-500">N/A</p>}
                  </div>
                </div>
              </div>

              {/* Entry Point & Target Prices */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 rounded-lg p-5 mb-4 border-2 border-green-400 dark:border-green-600">
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎯 Investment Strategy</h5>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">📍 Entry Point</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">
                      {(sectorRanking as any).bestPickData.score.entryPoint}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">🎯 Target 2026</p>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                      {(sectorRanking as any).bestPickData.score.targetPrice}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">🎯 Target 2027 (1Y)</p>
                    <p className="text-xl font-bold text-purple-700 dark:text-purple-400">
                      {(sectorRanking as any).bestPickData.score.growthProjection.oneYear}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expected Returns */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-5 mb-4 border-l-4 border-yellow-500">
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">💰 Expected Returns & Rationale</h5>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">📅 6 Months Return</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {(sectorRanking as any).bestPickData.score.growthProjection.sixMonths}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">📅 1 Year Return</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {(sectorRanking as any).bestPickData.score.growthProjection.oneYear}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📝 Why These Returns?</p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {(sectorRanking as any).bestPickData.score.growthProjection.rationale}
                  </p>
                </div>
              </div>

              {/* Overall Recommendation */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-5 mb-4 border-l-4 border-emerald-500">
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">📋 Recommendation Summary</h5>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {(sectorRanking as any).bestInvestmentAnalysis.recommendation}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {/* Fundamental Analysis */}
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-5 border border-blue-300 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📊</span>
                    <h5 className="text-lg font-bold text-blue-900 dark:text-blue-100">Fundamental Analysis</h5>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {(sectorRanking as any).bestInvestmentAnalysis.fundamentalReasoning}
                  </p>
                  <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-800/30 rounded">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">✅ Checked Metrics:</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      P/E Ratio, P/B Ratio, ROE, EPS, Debt/Equity, Dividend Yield, Growth Trends, Market Cap, Financial Health
                    </p>
                  </div>
                </div>

                {/* Technical Analysis */}
                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-5 border border-purple-300 dark:border-purple-700">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📈</span>
                    <h5 className="text-lg font-bold text-purple-900 dark:text-purple-100">Technical Analysis</h5>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {(sectorRanking as any).bestInvestmentAnalysis.technicalReasoning}
                  </p>
                  <div className="mt-3 p-3 bg-purple-100 dark:bg-purple-800/30 rounded">
                    <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2">✅ Checked Indicators:</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      RSI, MACD, SMA (20/50/200), Bollinger Bands, Support/Resistance, Price Trends, Volume Analysis
                    </p>
                  </div>
                </div>
              </div>

              {/* Market Context & Timing */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-5 border border-orange-300 dark:border-orange-700">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🌍</span>
                    <h5 className="text-lg font-bold text-orange-900 dark:text-orange-100">Market Context (July 2026)</h5>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {(sectorRanking as any).bestInvestmentAnalysis.currentMarketContext}
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-5 border border-green-300 dark:border-green-700">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">⏰</span>
                    <h5 className="text-lg font-bold text-green-900 dark:text-green-100">Entry Timing Advice</h5>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-semibold">
                    {(sectorRanking as any).bestInvestmentAnalysis.timingAdvice}
                  </p>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-5 border border-red-300 dark:border-red-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">⚠️</span>
                  <h5 className="text-lg font-bold text-red-900 dark:text-red-100">Key Risk Factors</h5>
                </div>
                <ul className="space-y-2">
                  {(sectorRanking as any).bestInvestmentAnalysis.riskFactors.map((risk: string, idx: number) => (
                    <li key={idx} className="text-gray-700 dark:text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-red-600 dark:text-red-400 font-bold">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400 italic">
                ⚖️ <strong>Disclaimer:</strong> This analysis is based on AI evaluation of fundamental and technical indicators. 
                It is for informational purposes only and should not be considered as financial advice. 
                Please consult with a qualified financial advisor before making investment decisions.
              </div>
            </div>
          )}

          {/* Main Stock Score */}
          <div className="mb-6">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📊 Your Search: {sectorRanking.mainStock.name}</h4>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border-2 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {sectorRanking.mainStock.score.score}/100
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(sectorRanking.mainStock.currentPrice)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Price</div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {sectorRanking.mainStock.score.fundamentalScore}/40
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Fundamentals</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {sectorRanking.mainStock.score.technicalScore}/30
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Technicals</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {sectorRanking.mainStock.score.valuationScore}/30
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Valuation</div>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">{sectorRanking.mainStock.score.explanation}</p>

              {/* Factors */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h5 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">✅ Positive Factors</h5>
                  <ul className="space-y-1">
                    {sectorRanking.mainStock.score.factors.positive.map((factor: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1">
                        <span className="text-green-600">•</span> {factor}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">❌ Negative Factors</h5>
                  <ul className="space-y-1">
                    {sectorRanking.mainStock.score.factors.negative.map((factor: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1">
                        <span className="text-red-600">•</span> {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Entry Point & Target */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Entry Point</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{sectorRanking.mainStock.score.entryPoint}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Target Price (6M)</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{sectorRanking.mainStock.score.targetPrice}</p>
                </div>
              </div>

              {/* Growth Projections */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📈 Growth Projections</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">6 Months</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {sectorRanking.mainStock.score.growthProjection.sixMonths}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">1 Year</div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {sectorRanking.mainStock.score.growthProjection.oneYear}
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">3 Years</div>
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {sectorRanking.mainStock.score.growthProjection.threeYears}
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">5 Years</div>
                    <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {sectorRanking.mainStock.score.growthProjection.fiveYears}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {sectorRanking.mainStock.score.growthProjection.rationale}
                </p>
              </div>
            </div>
          </div>

          {/* Competitor Rankings */}
          <div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🎯 Competitor Rankings</h4>
            <div className="space-y-4">
              {sectorRanking.competitors.map((competitor: any, index: number) => {
                const isBestPick = competitor.symbol === sectorRanking.bestPick;
                return (
                  <div
                    key={index}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-2 ${
                      isBestPick ? 'border-yellow-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'
                    } hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => onSelectStock?.(competitor.symbol.replace('.NS', ''))}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-gray-400">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {competitor.name}
                            {isBestPick && <span className="text-xl">⭐</span>}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{competitor.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {competitor.score.score}/100
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(competitor.currentPrice)}
                        </div>
                      </div>
                    </div>

                    {/* Score Bar */}
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            competitor.score.score >= 80 ? 'bg-green-500' :
                            competitor.score.score >= 60 ? 'bg-blue-500' :
                            competitor.score.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${competitor.score.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Key Metrics - More Prominent */}
                    <div className="grid grid-cols-4 gap-2 mb-3 text-sm">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">P/E Ratio</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {competitor.fundamentals.peRatio?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">ROE %</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {competitor.fundamentals.roe?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded border border-purple-200 dark:border-purple-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">EPS</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          ₹{competitor.fundamentals.eps?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">RSI</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {competitor.technicals.rsi?.toFixed(0) || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Entry Point & Growth - More Prominent */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded border-2 border-green-500">
                        <div className="text-xs text-gray-700 dark:text-gray-300 mb-1 font-semibold">📍 Entry Point</div>
                        <div className="text-base font-bold text-green-800 dark:text-green-300">
                          {competitor.score.entryPoint}
                        </div>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded border-2 border-blue-500">
                        <div className="text-xs text-gray-700 dark:text-gray-300 mb-1 font-semibold">📈 6M Growth</div>
                        <div className="text-base font-bold text-blue-800 dark:text-blue-300">
                          {competitor.score.growthProjection.sixMonths}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* News */}
      {news && news.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Latest News</h3>
          <div className="space-y-4">
            {news.slice(0, 5).map((item: any, index: number) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{item.headline}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(item.datetime * 1000).toLocaleDateString()} - {item.source}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
