'use client';

import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StockSearch from '@/components/StockSearch';
import StockComparisonGrid from '@/components/StockComparisonGrid';
import { StockRecommendation } from '@/lib/investmentAnalysis';
import { X } from 'lucide-react';

// Disable static generation for this page since it requires authentication
export const dynamic = 'force-dynamic';

const MAX_STOCKS = 6;

export default function DashboardPage() {
  const session = useSession();
  const { data: sessionData, status } = session || { data: null, status: 'loading' };
  const router = useRouter();
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  const handleStockSelect = async (symbol: string) => {
    // Prevent duplicates
    if (selectedStocks.includes(symbol)) {
      setError(`${symbol} is already added for comparison`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Check max limit
    if (selectedStocks.length >= MAX_STOCKS) {
      setError(`Maximum ${MAX_STOCKS} stocks can be compared at once`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Add stock to list
    const updatedStocks = [...selectedStocks, symbol];
    setSelectedStocks(updatedStocks);
    setError(null);
  };

  const handleRemoveStock = (symbol: string) => {
    setSelectedStocks(selectedStocks.filter(s => s !== symbol));
    setRecommendations([]);
  };

  const handleCompare = async () => {
    if (selectedStocks.length === 0) {
      setError('Please add at least one stock to compare');
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);
    setRecommendations([]);

    try {
      console.log(`🔍 Comparing ${selectedStocks.length} stocks...`);
      
      const symbols = selectedStocks.join(',');
      const response = await fetch(`/api/analyze?symbols=${symbols}&mode=batch`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stock analysis');
      }

      console.log(`✅ Received ${data.recommendations.length} recommendations`);
      
      setRecommendations(data.recommendations);
      
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-2xl font-bold text-white">
              📈 Stock Comparison
            </h1>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="group relative px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-lg border border-blue-500/50 hover:border-blue-400 shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:rotate-12 transition-transform duration-300" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              />
            </svg>
            <span className="hidden xs:inline sm:inline">Sign Out</span>
            <span className="inline xs:hidden sm:hidden">Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-6 relative min-h-[120px]">
          <StockSearch onSelectStock={handleStockSelect} />
        </div>

        {/* Selected Stocks */}
        {selectedStocks.length > 0 && (
          <div className="bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-purple-900/40 backdrop-blur-md border border-blue-600/30 rounded-2xl p-5 sm:p-7 mb-6 mt-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Selected Stocks
                </h3>
                <p className="text-xs sm:text-sm text-blue-200">
                  {selectedStocks.length} of {MAX_STOCKS} stocks • Ready to compare
                </p>
              </div>
              <button
                onClick={handleCompare}
                disabled={loading}
                className="relative group w-full sm:w-auto px-8 py-3 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/50 disabled:shadow-none transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span>Compare & Analyze</span>
                      <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                    </>
                  )}
                </span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedStocks.map((stock, index) => (
                <div
                  key={stock}
                  className="group relative bg-gradient-to-r from-blue-800/60 to-blue-700/60 hover:from-blue-700/70 hover:to-blue-600/70 border border-blue-500/40 rounded-xl px-4 py-3 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/50 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="text-white font-bold text-base sm:text-lg tracking-wide">
                        {stock}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveStock(stock)}
                      className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500 border border-red-400/30 hover:border-red-400 text-red-400 hover:text-white transition-all duration-200 flex items-center justify-center group-hover:scale-110"
                      title="Remove stock"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
            <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">
              {error.includes('already added') || error.includes('Maximum') ? 'Notice' : 'Error Loading Analysis'}
            </h3>
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12 sm:py-20 px-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-700 border-t-blue-400 mb-4"></div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">
              Analyzing {selectedStocks.length} stock{selectedStocks.length > 1 ? 's' : ''}...
            </h2>
            <p className="text-sm sm:text-base text-blue-200">
              Fetching data and calculating scores. This may take a moment...
            </p>
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
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Investment Recommendations
              </h2>
              <p className="text-sm sm:text-base text-blue-200">
                AI-powered BUY/SELL/HOLD analysis for selected stocks
              </p>
            </div>
            <StockComparisonGrid 
              recommendations={recommendations} 
              searchedStock={selectedStocks[0]}
            />
          </div>
        )}

        {/* Welcome Message */}
        {selectedStocks.length === 0 && !loading && (
          <div className="text-center py-12 sm:py-20 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-blue-900/30 rounded-full mb-4">
              <span className="text-3xl sm:text-4xl">🔍</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
              Add stocks to compare
            </h2>
            <p className="text-sm sm:text-base text-gray-300 max-w-md mx-auto mb-4">
              Search and add up to {MAX_STOCKS} Indian stocks (e.g., HDFCBANK, RELIANCE, TCS) to get 
              BUY/SELL/HOLD recommendations and compare their performance
            </p>
            <div className="text-blue-300 text-xs sm:text-sm">
              💡 Tip: Add competing stocks from the same sector for best comparison results
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

