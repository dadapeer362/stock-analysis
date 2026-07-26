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
  const dropdownRef = useRef<HTMLFormElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSelectStock(input.trim().toUpperCase());
      setShowDropdown(false);
    }
  };

  const handleSelectSuggestion = (symbol: string) => {
    setInput(symbol);
    onSelectStock(symbol);
    setShowDropdown(false);
  };

  const quickSymbols = [
    'RELIANCE',    // Reliance Industries
    'TCS',         // Tata Consultancy Services
    'HDFCBANK',    // HDFC Bank
    'INFY',        // Infosys
    'ICICIBANK',   // ICICI Bank
    'WIPRO',       // Wipro
    'ITC',         // ITC Limited
    'SBIN',        // State Bank of India
  ];

  return (
    <div className="bg-gradient-to-br from-blue-900/80 to-blue-800/60 backdrop-blur-sm rounded-lg shadow-xl border border-blue-700/50 p-6">
      <form onSubmit={handleSubmit} className="relative" ref={dropdownRef}>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search by company name or symbol (e.g., Reliance, HDFC Bank, TCS)"
              className="w-full pl-10 pr-10 py-3 border border-blue-600/50 bg-blue-950/40 text-white placeholder-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              autoComplete="off"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5 animate-spin" />
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            Analyze
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-blue-900 border border-blue-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
            {suggestions.map((stock, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(stock.symbol)}
                className="w-full px-4 py-3 text-left hover:bg-blue-800 border-b border-blue-800 last:border-b-0 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">
                      {stock.symbol}
                    </div>
                    <div className="text-sm text-blue-200">
                      {stock.name}
                    </div>
                  </div>
                  <div className="text-xs text-blue-300 bg-blue-800/50 px-2 py-1 rounded">
                    {stock.exchange}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-sm text-blue-200 font-medium">Quick access:</span>
        {quickSymbols.map((symbol) => (
          <button
            key={symbol}
            onClick={() => onSelectStock(symbol)}
            className="px-3 py-1 text-sm bg-blue-800/50 hover:bg-blue-700 text-blue-100 hover:text-white border border-blue-700/50 rounded-lg font-medium transition-all"
          >
            {symbol}
          </button>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <span>�🇳</span>
        <span>Just type the symbol - NSE stocks automatically detected (no need for .NS suffix)</span>
      </div>
    </div>
  );
}
