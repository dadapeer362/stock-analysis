'use client';

import { signOut } from 'next-auth/react';
import { useState } from 'react';
import StockSearch from '@/components/StockSearch';
import StockComparisonGrid from '@/components/StockComparisonGrid';
import { StockRecommendation } from '@/lib/investmentAnalysis';

export default function DashboardPage() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [searchedStock, setSearchedStock] = useState<string>('');
  const [warning, setWarning] = useState<string | null>(null);

  const handleStockSelect = async (symbol: string) => {
    setSelectedStock(symbol);
    setLoading(true);
    setError(null);
    setWarning(null);
    setRecommendations([]);

    try {
      console.log(`🔍 Fetching batch analysis for ${symbol}...`);
      
      const response = await fetch(`/api/analyze?symbol=${symbol}&mode=batch`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stock analysis');
      }

      console.log(`✅ Received ${data.recommendations.length} recommendations`);
      
      setRecommendations(data.recommendations);
      setSearchedStock(data.searchedStock);
      
      // Set warning if data is limited
      if (data.warning) {
        setWarning(data.warning);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching analysis:', err);
      setError(err.message || 'Failed to load stock analysis');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900">
      {/* Header */}
      <header className="bg-blue-900/60 backdrop-blur-sm border-b border-blue-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              📈 Stock Comparison Dashboard
            </h1>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-4 py-2 text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-800/50 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <StockSearch onSelectStock={handleStockSelect} />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-700 border-t-blue-400 mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Analyzing {selectedStock}...
            </h2>
            <p className="text-blue-200">
              Fetching data for all competitors. This may take a moment...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">
              Error Loading Analysis
            </h3>
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Warning State */}
        {warning && !loading && !error && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <span className="text-yellow-600 dark:text-yellow-400 text-xl mr-3">⚠️</span>
              <div>
                <h3 className="text-yellow-800 dark:text-yellow-400 font-semibold mb-1">
                  Limited Data Available
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">{warning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && !error && recommendations.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Investment Recommendations
              </h2>
              <p className="text-blue-200">
                AI-powered BUY/SELL/HOLD analysis for {selectedStock} and its competitors
              </p>
            </div>
            <StockComparisonGrid 
              recommendations={recommendations} 
              searchedStock={searchedStock}
            />
          </div>
        )}

        {/* Welcome Message */}
        {!selectedStock && !loading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-900/30 rounded-full mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Search for a stock to compare
            </h2>
            <p className="text-gray-300 max-w-md mx-auto">
              Enter an Indian stock symbol (e.g., HDFCBANK, RELIANCE, TCS) to get BUY/SELL/HOLD 
              recommendations for the stock and all its competitors
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

