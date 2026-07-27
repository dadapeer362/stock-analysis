'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface StockSearchProps {
  onSelectStock: (symbol: string) => void;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export default function StockSearch({ onSelectStock }: StockSearchProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchStocks = async () => {
      if (input.trim().length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(input)}`);
        const data = await response.json();
        setSuggestions(data.results || []);
        setShowDropdown(data.results?.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchStocks, 300);
    return () => clearTimeout(debounceTimer);
  }, [input]);

  const handleSelectSuggestion = (symbol: string) => {
    onSelectStock(symbol);
    setInput('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter is pressed and there's a first suggestion, select it
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[0].symbol);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-900/70 via-blue-800/60 to-purple-900/50 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-600/30 p-5 sm:p-7">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          Search Stocks
        </h2>
        <p className="text-xs sm:text-sm text-blue-200">
          Find and add stocks to compare their performance
        </p>
      </div>
      
      <div className="relative" ref={dropdownRef}>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 group-focus-within:text-blue-300 transition-colors" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type stock symbol or company name..."
            className="w-full pl-12 pr-12 py-4 border-2 border-blue-600/40 bg-blue-950/50 text-white placeholder-blue-400/60 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400/60 focus:bg-blue-950/70 transition-all text-sm sm:text-base font-medium shadow-inner"
            autoComplete="off"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 animate-spin" />
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-3 bg-gradient-to-b from-blue-900 to-blue-950 border-2 border-blue-700/50 rounded-xl shadow-2xl max-h-96 overflow-hidden">
            <div className="overflow-y-auto max-h-96">
              {suggestions.map((stock, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSuggestion(stock.symbol)}
                  className="w-full px-5 py-4 text-left hover:bg-blue-800/60 border-b border-blue-800/30 last:border-b-0 transition-all duration-200 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-500/10 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex-1">
                      <div className="font-bold text-white text-base group-hover:text-blue-100 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-600/40 flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        {stock.symbol}
                      </div>
                      <div className="text-sm text-blue-300 group-hover:text-blue-200 mt-1 ml-8">
                        {stock.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-blue-400 bg-blue-800/40 px-3 py-1 rounded-lg font-semibold border border-blue-700/30">
                        {stock.exchange}
                      </div>
                      <div className="text-sm text-green-400 font-semibold opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 translate-x-2">
                        Add →
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-3 bg-blue-950/30 border border-blue-700/20 rounded-lg p-3">
        <span className="text-xl">💡</span>
        <div className="text-xs sm:text-sm text-blue-200 leading-relaxed">
          <span className="font-semibold text-blue-100">Quick tips:</span> Type to search • Click to add • Press <kbd className="px-2 py-0.5 bg-blue-800/50 border border-blue-600/50 rounded text-xs font-mono">Enter</kbd> for first result
        </div>
      </div>
    </div>
  );
}
