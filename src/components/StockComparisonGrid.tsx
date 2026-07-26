'use client';

import React from 'react';
import { StockScore } from '@/lib/stockScoring';
import { StockRecommendation } from '@/lib/investmentAnalysis';

interface StockComparisonGridProps {
  recommendations: StockRecommendation[];
  searchedStock: string;
}

export default function StockComparisonGrid({ recommendations, searchedStock }: StockComparisonGridProps) {
  const getActionColor = (action: 'BUY' | 'SELL' | 'HOLD') => {
    switch (action) {
      case 'BUY':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'SELL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HOLD':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getRatingBadgeColor = (rating: string) => {
    switch (rating) {
      case 'STRONG_BUY':
        return 'bg-green-600 text-white';
      case 'BUY_ZONE':
        return 'bg-green-500 text-white';
      case 'WATCH_ZONE':
        return 'bg-blue-500 text-white';
      case 'WAIT':
        return 'bg-orange-500 text-white';
      case 'HOLD':
        return 'bg-yellow-500 text-gray-900';
      case 'AVOID':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  const getRatingLabel = (rating: string, score: number) => {
    // Better risk-reward labels based on investment score
    if (score >= 90) return 'Strong Buy';
    if (score >= 80) return 'Buy';
    if (score >= 70) return 'Accumulate';
    if (score >= 55) return 'Watch';
    if (score >= 40) return 'High Risk';
    return 'Avoid';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { emoji: '🏆', label: '#1 BEST', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500' };
    if (rank === 2) return { emoji: '🥈', label: `#${rank}`, color: 'bg-gray-300/20 text-gray-300 border-gray-400' };
    if (rank === 3) return { emoji: '🥉', label: `#${rank}`, color: 'bg-orange-400/20 text-orange-300 border-orange-400' };
    return { emoji: '', label: `#${rank}`, color: 'bg-gray-600/20 text-gray-400 border-gray-600' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-green-300';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatMetric = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(2);
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Pillar progress bar component
  const PillarBar = ({ label, score, color, explanation }: { 
    label: string; 
    score: number; 
    color: string;
    explanation?: string;
  }) => {
    // If score is 0 and explanation indicates unavailable data, show N/A
    const isDataUnavailable = score === 0 && (
      explanation?.toLowerCase().includes('unavailable') ||
      explanation?.toLowerCase().includes('insufficient data') ||
      explanation?.toLowerCase().includes('no data')
    );
    
    return (
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-white">{label}</span>
          {isDataUnavailable ? (
            <span className="text-gray-400 font-semibold">N/A</span>
          ) : (
            <span className={`${color} font-semibold`}>{score}/100</span>
          )}
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          {isDataUnavailable ? (
            <div className="h-2 rounded-full bg-gray-600 w-full opacity-30"></div>
          ) : (
            <div
              className={`h-2 rounded-full ${color.replace('text', 'bg')}`}
              style={{ width: `${score}%` }}
            ></div>
          )}
        </div>
        {isDataUnavailable && (
          <div className="text-xs text-gray-400 mt-1">Data unavailable</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Financial Terms Glossary */}
      <details className="group bg-slate-800/60 border border-slate-700/50 rounded-lg">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
          <span className="group-open:hidden">📖 Show Financial Terms Guide</span>
          <span className="hidden group-open:inline">📖 Hide Financial Terms Guide</span>
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-3 text-sm">
          <div className="grid md:grid-cols-2 gap-3">
            {/* ROE */}
            <div className="p-3 bg-blue-950/30 border border-blue-800/30 rounded-lg">
              <div className="font-semibold text-blue-300 mb-1">📊 ROE (Return on Equity)</div>
              <div className="text-blue-100 text-xs mb-2">
                <strong>Formula:</strong> (Net Profit / Shareholder Equity) × 100
              </div>
              <div className="text-slate-300 text-xs">
                Measures how efficiently a company uses shareholders' money to generate profit. Higher is better.
                <span className="block mt-1 text-slate-400">✓ Good: ≥15% | Excellent: ≥20%</span>
              </div>
            </div>
            
            {/* ROCE */}
            <div className="p-3 bg-purple-950/30 border border-purple-800/30 rounded-lg">
              <div className="font-semibold text-purple-300 mb-1">📊 ROCE (Return on Capital Employed)</div>
              <div className="text-purple-100 text-xs mb-2">
                <strong>Formula:</strong> (EBIT / Capital Employed) × 100
              </div>
              <div className="text-slate-300 text-xs">
                Shows how well a company generates profits from its capital (equity + debt). Higher is better.
                <span className="block mt-1 text-slate-400">✓ Good: ≥18% | Excellent: ≥25%</span>
              </div>
            </div>
            
            {/* EPS */}
            <div className="p-3 bg-green-950/30 border border-green-800/30 rounded-lg">
              <div className="font-semibold text-green-300 mb-1">💰 EPS (Earnings Per Share)</div>
              <div className="text-green-100 text-xs mb-2">
                <strong>Formula:</strong> Net Profit / Total Shares
              </div>
              <div className="text-slate-300 text-xs">
                Profit allocated to each share. Used to calculate P/E ratio. Growing EPS = good.
                <span className="block mt-1 text-slate-400">✓ Look for consistent YoY growth (10%+ annually)</span>
              </div>
            </div>
            
            {/* P/E Ratio */}
            <div className="p-3 bg-orange-950/30 border border-orange-800/30 rounded-lg">
              <div className="font-semibold text-orange-300 mb-1">📈 P/E Ratio (Price to Earnings)</div>
              <div className="text-orange-100 text-xs mb-2">
                <strong>Formula:</strong> Current Stock Price / EPS
              </div>
              <div className="text-slate-300 text-xs">
                Shows how much you pay for ₹1 of earnings. Lower can mean undervalued.
                <span className="block mt-1 text-slate-400">✓ Compare with industry average | Caution: &gt;40 (expensive)</span>
              </div>
            </div>
            
            {/* P/B Ratio */}
            <div className="p-3 bg-indigo-950/30 border border-indigo-800/30 rounded-lg">
              <div className="font-semibold text-indigo-300 mb-1">📊 P/B Ratio (Price to Book Value)</div>
              <div className="text-indigo-100 text-xs mb-2">
                <strong>Formula:</strong> Current Stock Price / Book Value Per Share
              </div>
              <div className="text-slate-300 text-xs">
                Compares market price with net asset value. Lower can indicate undervaluation.
                <span className="block mt-1 text-slate-400">✓ Good value: &lt;3 | Bargain: &lt;1 (below book value)</span>
              </div>
            </div>
            
            {/* Dividend Yield */}
            <div className="p-3 bg-pink-950/30 border border-pink-800/30 rounded-lg">
              <div className="font-semibold text-pink-300 mb-1">💰 Dividend Yield</div>
              <div className="text-pink-100 text-xs mb-2">
                <strong>Formula:</strong> (Annual Dividend Per Share / Current Price) × 100
              </div>
              <div className="text-slate-300 text-xs">
                Annual dividend income as % of stock price. Higher = better income.
                <span className="block mt-1 text-slate-400">✓ Good: ≥3% | Excellent: ≥5% (for dividend stocks)</span>
              </div>
            </div>
            
            {/* Debt-to-Equity */}
            <div className="p-3 bg-red-950/30 border border-red-800/30 rounded-lg">
              <div className="font-semibold text-red-300 mb-1">⚖️ Debt-to-Equity Ratio</div>
              <div className="text-red-100 text-xs mb-2">
                <strong>Formula:</strong> Total Debt / Shareholder Equity
              </div>
              <div className="text-slate-300 text-xs">
                Measures financial leverage. Lower is safer (less debt risk).
                <span className="block mt-1 text-slate-400">✓ Safe: &lt;0.5 | Caution: &gt;1.0 (high debt)</span>
              </div>
            </div>
            
            {/* FCF */}
            <div className="p-3 bg-cyan-950/30 border border-cyan-800/30 rounded-lg">
              <div className="font-semibold text-cyan-300 mb-1">💵 FCF (Free Cash Flow)</div>
              <div className="text-cyan-100 text-xs mb-2">
                <strong>Formula:</strong> Operating Cash Flow - Capital Expenditure
              </div>
              <div className="text-slate-300 text-xs">
                Cash left after paying for operations & investments. Used for dividends, buybacks, debt reduction.
                <span className="block mt-1 text-slate-400">✓ Positive FCF = healthy | Growing FCF = excellent</span>
              </div>
            </div>
            
            {/* OPM */}
            <div className="p-3 bg-yellow-950/30 border border-yellow-800/30 rounded-lg">
              <div className="font-semibold text-yellow-300 mb-1">📊 OPM (Operating Profit Margin)</div>
              <div className="text-yellow-100 text-xs mb-2">
                <strong>Formula:</strong> (Operating Profit / Sales) × 100
              </div>
              <div className="text-slate-300 text-xs">
                Shows operational efficiency (profit before interest/tax). Higher is better.
                <span className="block mt-1 text-slate-400">✓ Good: ≥15% | Excellent: ≥25%</span>
              </div>
            </div>
            
            {/* Book Value */}
            <div className="p-3 bg-teal-950/30 border border-teal-800/30 rounded-lg">
              <div className="font-semibold text-teal-300 mb-1">📚 Book Value Per Share</div>
              <div className="text-teal-100 text-xs mb-2">
                <strong>Formula:</strong> (Total Assets - Total Liabilities) / Total Shares
              </div>
              <div className="text-slate-300 text-xs">
                Net asset value per share. Used to calculate P/B ratio.
                <span className="block mt-1 text-slate-400">✓ Higher book value = stronger balance sheet</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-slate-700/30 border border-slate-600/30 rounded-lg">
            <div className="font-semibold text-slate-200 mb-2">📌 Quick Reference:</div>
            <div className="grid md:grid-cols-2 gap-2 text-xs text-slate-300">
              <div>• <strong>Profitability:</strong> ROE, ROCE, OPM, Net Profit Margin</div>
              <div>• <strong>Valuation:</strong> P/E Ratio, P/B Ratio, Dividend Yield</div>
              <div>• <strong>Financial Health:</strong> Debt/Equity, FCF, Book Value</div>
              <div>• <strong>Growth:</strong> Sales CAGR, Profit CAGR, EPS Growth</div>
            </div>
          </div>
        </div>
      </details>
      
      {/* Scoring Methodology */}
      <details className="group bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-2 border-blue-700/50 rounded-lg">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-blue-200 hover:text-white hover:bg-blue-900/30 transition-colors">
          <span className="group-open:hidden">🎯 How We Score Stocks (Our Methodology)</span>
          <span className="hidden group-open:inline">🎯 Hide Scoring Methodology</span>
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-4 text-sm">
          
          {/* Overview */}
          <div className="p-3 bg-blue-950/50 border border-blue-800/50 rounded-lg">
            <div className="font-semibold text-blue-200 mb-2">📊 Scoring System Overview</div>
            <div className="text-slate-300 text-xs space-y-2">
              <p>We analyze stocks using <strong>6 independent pillars</strong>, each scored 0-100 points. These are combined to create an <strong>Investment Score</strong> that tells you if it's a good buy <strong>TODAY</strong> at the current price.</p>
              <div className="mt-2 p-2 bg-slate-800/50 rounded">
                <div className="font-semibold text-blue-300 mb-1">The 6 Pillars:</div>
                <div className="grid md:grid-cols-2 gap-1 text-xs">
                  <div>1. 🏢 Business Quality (30% weight)</div>
                  <div>2. 📈 Growth Potential (25% weight)</div>
                  <div>3. 💰 Valuation (20% weight)</div>
                  <div>4. 📊 Technical Strength (15% weight)</div>
                  <div>5. 👥 Market Confidence (10% weight)</div>
                  <div>6. 🚀 Momentum (bonus/penalty)</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pillar 1: Business Quality */}
          <div className="p-3 bg-blue-950/30 border border-blue-800/30 rounded-lg">
            <div className="font-semibold text-blue-300 mb-2">🏢 Pillar 1: Business Quality (30% weight)</div>
            <div className="text-slate-300 text-xs space-y-2">
              <p className="text-blue-200 font-medium">What we measure: How profitable and efficient is the company?</p>
              <div className="space-y-1 ml-3">
                <div>• <strong>ROE (Return on Equity):</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  ≥30% → 100 pts | 25-30% → 90 pts | 20-25% → 80 pts | 15-20% → 70 pts | &lt;15% → scaled down
                </div>
                <div>• <strong>ROCE (Return on Capital):</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  ≥35% → 100 pts | 25-35% → 90 pts | 18-25% → 75 pts | &lt;18% → scaled down
                </div>
                <div>• <strong>Debt-to-Equity Ratio:</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  &lt;0.3 → 100 pts | 0.3-0.5 → 85 pts | 0.5-1.0 → 60 pts | &gt;1.0 → penalty
                </div>
                <div>• <strong>Free Cash Flow (FCF):</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  Positive FCF → 100 pts | FCF &gt; Net Profit → bonus 20 pts | Negative → 0 pts
                </div>
                <div>• <strong>Promoter Holding:</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  ≥70% → 100 pts | 60-70% → 90 pts | 50-60% → 75 pts | &lt;50% → scaled down
                </div>
              </div>
              <div className="mt-2 p-2 bg-blue-900/30 rounded text-blue-200">
                <strong>Final Score:</strong> Average of all available factors (0-100)
              </div>
              <div className="mt-1 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-yellow-200 text-xs">
                ⭐ <strong>Special handling for loss-making companies:</strong> We track operational improvements like OPM expansion, EPS improvement, ROE recovery, and debt reduction instead of traditional profitability metrics.
              </div>
            </div>
          </div>
          
          {/* Pillar 2: Growth */}
          <div className="p-3 bg-green-950/30 border border-green-800/30 rounded-lg">
            <div className="font-semibold text-green-300 mb-2">📈 Pillar 2: Growth Potential (25% weight)</div>
            <div className="text-slate-300 text-xs space-y-2">
              <p className="text-green-200 font-medium">What we measure: How fast is the company growing?</p>
              <div className="space-y-1 ml-3">
                <div>• <strong>Sales CAGR (Compounded Growth):</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  ≥30% → 100 pts | 20-30% → 90 pts | 15-20% → 80 pts | 10-15% → 60 pts | &lt;5% → penalty
                </div>
                <div className="ml-5 text-slate-400">
                  We use weighted average: 60% of 3-year + 40% of 5-year (recent matters more!)
                </div>
                <div>• <strong>Profit CAGR:</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  ≥40% → 100 pts | 30-40% → 95 pts | 20-30% → 85 pts | 10-20% → 65 pts
                </div>
                <div>• <strong>Quarterly Sales Growth (QoQ):</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  Recent 2 quarters vs. older 2 quarters comparison
                </div>
                <div>• <strong>ROE Growth (3Y vs 5Y):</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  Improving ROE → 100 pts | Stable → 70 pts | Declining &gt;5pp → penalty
                </div>
              </div>
              <div className="mt-2 p-2 bg-green-900/30 rounded text-green-200">
                <strong>Final Score:</strong> Average of all available factors (0-100)
              </div>
              <div className="mt-1 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-yellow-200 text-xs">
                ⭐ <strong>For turnaround companies:</strong> We focus on OPM improvement (margins), loss reduction, and sales growth instead of profit CAGR. +40pp OPM improvement = 100 points!
              </div>
            </div>
          </div>
          
          {/* Pillar 3: Valuation */}
          <div className="p-3 bg-purple-950/30 border border-purple-800/30 rounded-lg">
            <div className="font-semibold text-purple-300 mb-2">💰 Pillar 3: Valuation (20% weight)</div>
            <div className="text-slate-300 text-xs space-y-2">
              <p className="text-purple-200 font-medium">What we measure: Is the stock cheap or expensive?</p>
              <div className="space-y-1 ml-3">
                <div>• <strong>P/E Ratio (Price to Earnings):</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  &lt;10 → 100 pts | 10-15 → 85 pts | 15-25 → 70 pts | 25-35 → 50 pts | &gt;40 → 20 pts
                </div>
                <div>• <strong>P/B Ratio (Price to Book):</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  &lt;1 → 100 pts | 1-2 → 85 pts | 2-4 → 70 pts | 4-6 → 50 pts | &gt;6 → 30 pts
                </div>
                <div>• <strong>Dividend Yield:</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  ≥3% → 100 pts | 2-3% → 80 pts | 1-2% → 60 pts | &lt;1% → 40 pts
                </div>
                <div>• <strong>52-Week High/Low Position:</strong> Bonus/Penalty</div>
                <div className="ml-5 text-slate-400">
                  At 52W high → -10 pts | Near 52W low → +5 pts
                </div>
              </div>
              <div className="mt-2 p-2 bg-purple-900/30 rounded text-purple-200">
                <strong>Final Score:</strong> Average of P/E, P/B, Dividend Yield (0-100)
              </div>
            </div>
          </div>
          
          {/* Pillar 4: Technical */}
          <div className="p-3 bg-orange-950/30 border border-orange-800/30 rounded-lg">
            <div className="font-semibold text-orange-300 mb-2">📊 Pillar 4: Technical Strength (15% weight)</div>
            <div className="text-slate-300 text-xs space-y-2">
              <p className="text-orange-200 font-medium">What we measure: Technical indicators for entry timing</p>
              <div className="space-y-1 ml-3">
                <div>• <strong>RSI (Relative Strength Index):</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  40-60 (neutral) → 100 pts | 30-40 (oversold) → 90 pts | &lt;30 (deeply oversold) → 100 pts | &gt;70 (overbought) → 30 pts
                </div>
                <div>• <strong>MACD Signal:</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  Bullish crossover → 100 pts | Bearish → 40 pts
                </div>
                <div>• <strong>Moving Averages (20/50/200 SMA):</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  Above all 3 MAs → 100 pts | Mixed → 50-80 pts | Below all → 20 pts
                </div>
              </div>
              <div className="mt-2 p-2 bg-orange-900/30 rounded text-orange-200">
                <strong>Final Score:</strong> Average of RSI, MACD, MA strength (0-100)
              </div>
            </div>
          </div>
          
          {/* Pillar 5: Market Confidence */}
          <div className="p-3 bg-pink-950/30 border border-pink-800/30 rounded-lg">
            <div className="font-semibold text-pink-300 mb-2">👥 Pillar 5: Market Confidence (10% weight)</div>
            <div className="text-slate-300 text-xs space-y-2">
              <p className="text-pink-200 font-medium">What we measure: Are smart investors buying or selling?</p>
              <div className="space-y-1 ml-3">
                <div>• <strong>FII Holding %:</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  ≥30% → 100 pts | 20-30% → 80 pts | 10-20% → 60 pts | &lt;5% → 30 pts
                </div>
                <div>• <strong>FII Trend (5-quarter change):</strong> Max 100 points ⭐NEW</div>
                <div className="ml-5 text-slate-400">
                  +5pp accumulation → 100 pts | +2pp → 90 pts | Stable → 60 pts | -5pp exit → 20 pts | -7pp+ → 0 pts (RED FLAG!)
                </div>
                <div>• <strong>DII Holding % + Trend:</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  Similar scoring to FII. Bonus: If FII exiting but DII buying → 1.2x multiplier (smart money rotation)
                </div>
                <div>• <strong>Promoter Holding + Trend:</strong> Max 100 points</div>
                <div className="ml-5 text-slate-400">
                  Increasing stake → 100 pts | Stable → 70 pts | Decreasing → 30-50 pts
                </div>
                <div>• <strong>Shareholder Count Trend:</strong> Max 100 points ⭐NEW</div>
                <div className="ml-5 text-slate-400">
                  +50% growth → 100 pts | +20% → 80 pts | Declining → 30 pts
                </div>
              </div>
              <div className="mt-2 p-2 bg-pink-900/30 rounded text-pink-200">
                <strong>Final Score:</strong> Average of all institutional metrics (0-100)
              </div>
            </div>
          </div>
          
          {/* Pillar 6: Momentum */}
          <div className="p-3 bg-yellow-950/30 border border-yellow-800/30 rounded-lg">
            <div className="font-semibold text-yellow-300 mb-2">🚀 Pillar 6: Momentum (Bonus/Penalty)</div>
            <div className="text-slate-300 text-xs space-y-2">
              <p className="text-yellow-200 font-medium">What we measure: Price momentum (what's already running)</p>
              <div className="space-y-1 ml-3">
                <div>• <strong>Price Returns:</strong> 1Y (15pts), 6M (15pts), 3M (12pts), 1M (8pts)</div>
                <div className="ml-5 text-slate-400">
                  100%+ return → max points | 0% → partial points | Negative → 0 pts
                </div>
                <div>• <strong>Volume Trend:</strong> Max 25 points</div>
                <div>• <strong>Volatility:</strong> Max 25 points</div>
              </div>
              <div className="mt-2 p-2 bg-yellow-900/30 rounded text-yellow-200">
                <strong>Usage:</strong> High momentum = stock already running (adds confidence but doesn't affect Investment Score directly)
              </div>
            </div>
          </div>
          
          {/* Final Calculation */}
          <div className="p-4 bg-gradient-to-r from-green-900/40 to-blue-900/40 border-2 border-green-700/50 rounded-lg">
            <div className="font-semibold text-green-200 mb-3 text-base">🎯 Final Investment Score Calculation</div>
            <div className="text-slate-300 text-xs space-y-3">
              <div className="p-3 bg-slate-800/50 rounded">
                <div className="font-mono text-green-300 mb-2">Investment Score = (Pillars 1-5 weighted average)</div>
                <div className="ml-3 space-y-1">
                  <div>= (Business Quality × 30%)</div>
                  <div>+ (Growth × 25%)</div>
                  <div>+ (Valuation × 20%)</div>
                  <div>+ (Technical × 15%)</div>
                  <div>+ (Market Confidence × 10%)</div>
                </div>
              </div>
              
              <div className="p-3 bg-slate-800/50 rounded">
                <div className="font-semibold text-blue-300 mb-2">📊 Rating Categories:</div>
                <div className="space-y-1 ml-3">
                  <div>• <span className="text-green-400 font-semibold">85-100:</span> STRONG BUY (Excellent quality + attractive price)</div>
                  <div>• <span className="text-green-300 font-semibold">75-84:</span> BUY ZONE (Good opportunity - buy gradually)</div>
                  <div>• <span className="text-blue-300 font-semibold">65-74:</span> WATCH ZONE (Quality business - wait for dip)</div>
                  <div>• <span className="text-orange-300 font-semibold">50-64:</span> WAIT (Mixed signals - avoid for now)</div>
                  <div>• <span className="text-red-300 font-semibold">&lt;50:</span> AVOID (Poor fundamentals or overvalued)</div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-900/30 border border-blue-700/30 rounded">
                <div className="font-semibold text-blue-200 mb-1">💡 Why This System Works:</div>
                <div className="space-y-1 text-xs">
                  <div>✓ <strong>Transparent:</strong> Every score is based on clear, objective metrics</div>
                  <div>✓ <strong>Comprehensive:</strong> Covers quality, growth, value, technicals, and sentiment</div>
                  <div>✓ <strong>Context-aware:</strong> Special handling for loss-making turnaround companies</div>
                  <div>✓ <strong>Trend-focused:</strong> Tracks 5-quarter institutional trends, not just snapshots</div>
                  <div>✓ <strong>Price-aware:</strong> Adjusts rating based on 52W high/low position</div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </details>
      
      {/* Best Stock Highlight */}
      {recommendations.length > 0 && recommendations[0].rank === 1 && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🏆</span>
            <div>
              <h3 className="text-xl font-bold text-yellow-300">
                Best Value Opportunity Today
              </h3>
              <p className="text-sm text-gray-300">
                {recommendations[0].company} scored {recommendations[0].score.investmentScore}/100 buy opportunity score (best value today)
              </p>
            </div>
          </div>
          {/* Comparative Reasoning - Why this ranks #1 */}
          {recommendations[0].comparativeReasoning && (
            <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
              <div className="text-sm font-semibold text-yellow-200 mb-1">💡 Why {recommendations[0].company} ranks #1:</div>
              <p className="text-sm text-gray-200 leading-relaxed">{recommendations[0].comparativeReasoning}</p>
            </div>
          )}
        </div>
      )}

      <div className="text-base text-white font-medium mb-2">
        Showing {recommendations.length} stocks ranked by buy opportunity score
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((stock) => {
          const isSearchedStock = stock.symbol === searchedStock;
          const rankBadge = getRankBadge(stock.rank);
          const isBestStock = stock.rank === 1;
          
          return (
            <div
              key={stock.symbol}
              className={`bg-slate-900 rounded-lg p-5 border-2 shadow-xl ${
                isBestStock
                  ? 'border-yellow-500 ring-2 ring-yellow-500/20'
                  : isSearchedStock 
                  ? 'border-blue-500 ring-2 ring-blue-500/20' 
                  : 'border-slate-700'
              } hover:border-slate-500 transition-all`}
            >
              {/* Rank Badge */}
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border-2 ${rankBadge.color} font-bold`}>
                  <span>{rankBadge.emoji}</span>
                  <span>{rankBadge.label}</span>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold ${getRatingBadgeColor(stock.score.rating)}`}>
                  {getRatingLabel(stock.score.rating, stock.score.investmentScore)}
                </div>
              </div>

              {/* Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {stock.company}
                </h3>
                <p className="text-sm text-gray-100 mb-2">{stock.symbol}</p>
                {isSearchedStock && (
                  <span className="inline-block text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                    Your Search
                  </span>
                )}

                {/* WHY NOW? - Single Decision Summary */}
                {stock.score.whyNow && (
                  <div className={`mt-3 p-4 rounded-lg border-2 ${
                    stock.score.whyNow.overallVerdict === 'BUY' 
                      ? 'bg-gradient-to-r from-green-900/50 to-cyan-900/50 border-green-500/70' 
                      : stock.score.whyNow.overallVerdict === 'WATCH'
                      ? 'bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-500/70'
                      : 'bg-gradient-to-r from-red-900/50 to-pink-900/50 border-red-500/70'
                  }`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-3xl">
                        {stock.score.whyNow.overallVerdict === 'BUY' ? '🎯' : 
                         stock.score.whyNow.overallVerdict === 'WATCH' ? '⏱️' : '🚫'}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-300 mb-1">WHY NOW?</div>
                        <div className={`text-2xl font-bold mb-2 ${
                          stock.score.whyNow.overallVerdict === 'BUY' ? 'text-green-300' :
                          stock.score.whyNow.overallVerdict === 'WATCH' ? 'text-yellow-300' :
                          'text-red-300'
                        }`}>
                          {stock.score.whyNow.overallVerdict}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                      <div className="text-center">
                        <div className="text-gray-400 mb-1">Business</div>
                        <div className={`font-semibold ${
                          stock.score.whyNow.businessQuality === 'Excellent' ? 'text-green-300' :
                          stock.score.whyNow.businessQuality === 'Good' ? 'text-blue-300' :
                          stock.score.whyNow.businessQuality === 'Average' ? 'text-yellow-300' :
                          'text-red-300'
                        }`}>{stock.score.whyNow.businessQuality}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 mb-1">Valuation</div>
                        <div className={`font-semibold ${
                          stock.score.whyNow.priceValuation === 'Cheap' ? 'text-green-300' :
                          stock.score.whyNow.priceValuation === 'Fair' ? 'text-blue-300' :
                          stock.score.whyNow.priceValuation === 'Expensive' ? 'text-orange-300' :
                          'text-red-300'
                        }`}>{stock.score.whyNow.priceValuation}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 mb-1">Technical</div>
                        <div className={`font-semibold ${
                          stock.score.whyNow.technicalSetup === 'Bullish' ? 'text-green-300' :
                          stock.score.whyNow.technicalSetup === 'Neutral' ? 'text-gray-300' :
                          'text-red-300'
                        }`}>{stock.score.whyNow.technicalSetup}</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-slate-100 italic border-t border-white/20 pt-2">
                      "{stock.score.whyNow.reasoning}"
                    </div>
                  </div>
                )}

                {/* CAN I BUY TODAY? - Decision Card */}
                {stock.score.buyDecision && (
                  <div className={`mt-3 p-4 rounded-lg border-2 ${
                    stock.score.buyDecision.canBuyToday 
                      ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-600/60' 
                      : 'bg-gradient-to-r from-orange-900/40 to-red-900/40 border-orange-600/60'
                  }`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`text-3xl ${stock.score.buyDecision.canBuyToday ? 'text-green-400' : 'text-orange-400'}`}>
                        {stock.score.buyDecision.canBuyToday ? '✅' : '⏸️'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white mb-1">Can I Buy Today?</div>
                        <div className={`text-base font-semibold mb-2 ${
                          stock.score.buyDecision.canBuyToday ? 'text-green-300' : 'text-orange-300'
                        }`}>
                          {stock.score.buyDecision.canBuyToday ? 'Yes' : 'No'}
                        </div>
                        <div className="text-xs text-slate-200 italic">"{stock.score.buyDecision.recommendation}"</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {stock.score.buyDecision.reasons.positive.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-green-300 mb-1">✓ Positives:</div>
                          <div className="space-y-0.5">
                            {stock.score.buyDecision.reasons.positive.map((reason, idx) => (
                              <div key={idx} className="text-xs text-green-100 flex items-start gap-1">
                                <span className="text-green-400 mt-0.5">•</span>
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {stock.score.buyDecision.reasons.negative.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-red-300 mb-1">✗ Negatives:</div>
                          <div className="space-y-0.5">
                            {stock.score.buyDecision.reasons.negative.map((reason, idx) => (
                              <div key={idx} className="text-xs text-red-100 flex items-start gap-1">
                                <span className="text-red-400 mt-0.5">•</span>
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ONE-LINE VERDICT - Actionable Summary */}
                {stock.score.verdict && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-700/40 rounded-lg">
                    <div className="text-xs font-semibold text-cyan-300 mb-1">💡 Investment Verdict</div>
                    <p className="text-sm text-slate-100 leading-relaxed italic">"{stock.score.verdict}"</p>
                  </div>
                )}

                {/* SUMMARY CARDS - Star Ratings */}
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {/* Business Quality Stars */}
                  <div className="bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-blue-300 mb-1">Quality</div>
                    <div className="text-yellow-400 text-sm">
                      {(() => {
                        const stars = Math.round((stock.score.businessQualityScore / 100) * 5);
                        return '★'.repeat(stars) + '☆'.repeat(5 - stars);
                      })()}
                    </div>
                  </div>
                  
                  {/* Valuation Stars */}
                  <div className="bg-purple-950/40 border border-purple-800/40 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-purple-300 mb-1">Value</div>
                    <div className="text-yellow-400 text-sm">
                      {(() => {
                        const stars = Math.round((stock.score.pillarScores.valuation / 100) * 5);
                        return '★'.repeat(stars) + '☆'.repeat(5 - stars);
                      })()}
                    </div>
                  </div>
                  
                  {/* Growth Stars */}
                  <div className="bg-green-950/40 border border-green-800/40 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-green-300 mb-1">Growth</div>
                    <div className="text-yellow-400 text-sm">
                      {(() => {
                        const stars = Math.round((stock.score.growthPotentialScore / 100) * 5);
                        return '★'.repeat(stars) + '☆'.repeat(5 - stars);
                      })()}
                    </div>
                  </div>
                  
                  {/* Risk Badge */}
                  <div className={`border rounded-lg p-2 text-center ${
                    stock.score.riskLevel === 'LOW' ? 'bg-green-950/40 border-green-800/40' :
                    stock.score.riskLevel === 'MEDIUM' ? 'bg-yellow-950/40 border-yellow-800/40' :
                    stock.score.riskLevel === 'HIGH' ? 'bg-orange-950/40 border-orange-800/40' :
                    'bg-red-950/40 border-red-800/40'
                  }`}>
                    <div className="text-[10px] text-slate-300 mb-1">Risk</div>
                    <div className={`text-[10px] font-bold ${
                      stock.score.riskLevel === 'LOW' ? 'text-green-400' :
                      stock.score.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                      stock.score.riskLevel === 'HIGH' ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {stock.score.riskLevel}
                    </div>
                  </div>
                </div>

                {/* Total Score */}
                <div className="mt-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-600 p-4">
                  <div className="text-sm text-gray-300 mb-3 text-center font-medium">4 Key Metrics</div>
                  
                  {/* Grid of 4 Headline Scores */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Business Quality */}
                    <div className="bg-blue-950/40 border border-blue-700/40 rounded-lg p-3 text-center">
                      <div className="text-xs text-blue-300 mb-1">Business Quality</div>
                      <div className={`text-2xl font-bold ${getScoreColor(stock.score.businessQualityScore)}`}>
                        {stock.score.businessQualityScore}
                      </div>
                      <div className="text-xs text-blue-200 mt-1">How good?</div>
                    </div>

                    {/* Growth Potential */}
                    <div className="bg-green-950/40 border border-green-700/40 rounded-lg p-3 text-center">
                      <div className="text-xs text-green-300 mb-1">Growth Potential</div>
                      <div className={`text-2xl font-bold ${getScoreColor(stock.score.growthPotentialScore)}`}>
                        {stock.score.growthPotentialScore}
                      </div>
                      <div className="text-xs text-green-200 mt-1">Can it grow?</div>
                    </div>

                    {/* Buy Opportunity Score (Primary) */}
                    <div className="bg-yellow-950/40 border-2 border-yellow-600/60 rounded-lg p-3 text-center col-span-2">
                      <div className="text-xs text-yellow-300 mb-1 font-semibold">💡 Buy Opportunity Score (Primary)</div>
                      <div className={`text-3xl font-bold ${getScoreColor(stock.score.investmentScore)}`}>
                        {stock.score.investmentScore}
                        <span className="text-lg text-gray-400">/100</span>
                      </div>
                      <div className="text-xs text-yellow-200 mt-1">Buy today at current price?</div>
                    </div>

                    {/* Momentum Score */}
                    <div className="bg-purple-950/40 border border-purple-700/40 rounded-lg p-3 text-center col-span-2">
                      <div className="text-xs text-purple-300 mb-1">📊 Momentum</div>
                      <div className={`text-2xl font-bold ${getScoreColor(stock.score.momentumScore)}`}>
                        {stock.score.momentumScore}
                      </div>
                      <div className="text-xs text-purple-200 mt-1">What's already running?</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAIR VALUE ANALYSIS */}
              {stock.score.fairValue && stock.keyMetrics?.currentPrice && (
                <div className="mb-4 p-4 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-700/50 rounded-lg">
                  <div className="text-sm font-semibold text-indigo-200 mb-3">📊 Valuation Analysis</div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <div className="text-xs text-slate-400 mb-1">Current Price</div>
                      <div className="text-lg font-bold text-white">
                        ₹{stock.keyMetrics.currentPrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400 mb-1">Fair Value</div>
                      <div className="text-lg font-bold text-indigo-300">
                        ₹{stock.score.fairValue.toLocaleString('en-IN')}
                      </div>
                      {stock.score.fairValueMethods && (
                        <div className="text-[9px] text-slate-400 mt-1">
                          Graham: ₹{stock.score.fairValueMethods.graham?.toLocaleString('en-IN') || 'N/A'}<br/>
                          P/E: ₹{stock.score.fairValueMethods.peMethod?.toLocaleString('en-IN') || 'N/A'}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400 mb-1">Margin of Safety</div>
                      <div className={`text-lg font-bold ${
                        stock.score.marginOfSafety && stock.score.marginOfSafety > 0 ? 'text-green-400' :
                        stock.score.marginOfSafety && stock.score.marginOfSafety < -20 ? 'text-red-400' :
                        'text-orange-400'
                      }`}>
                        {stock.score.marginOfSafety != null ? `${stock.score.marginOfSafety > 0 ? '+' : ''}${stock.score.marginOfSafety.toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs text-center p-2 rounded ${
                    stock.score.marginOfSafety && stock.score.marginOfSafety > 10 ? 'bg-green-900/30 text-green-200' :
                    stock.score.marginOfSafety && stock.score.marginOfSafety > 0 ? 'bg-blue-900/30 text-blue-200' :
                    stock.score.marginOfSafety && stock.score.marginOfSafety > -15 ? 'bg-orange-900/30 text-orange-200' :
                    'bg-red-900/30 text-red-200'
                  }`}>
                    {stock.score.marginOfSafety && stock.score.marginOfSafety > 10 ? '✅ Trading below fair value - good entry zone' :
                     stock.score.marginOfSafety && stock.score.marginOfSafety > 0 ? '○ Trading near fair value' :
                     stock.score.marginOfSafety && stock.score.marginOfSafety > -15 ? '⚠ Trading above fair value - wait for correction' :
                     '🚨 Significantly overvalued - avoid at current price'}
                  </div>
                </div>
              )}

              {/* SCORE BREAKDOWN - Why not higher? */}
              {stock.score.scoreBreakdown && (stock.score.scoreBreakdown.positiveContributors.length > 0 || stock.score.scoreBreakdown.negativeContributors.length > 0) && (
                <div className="mb-4 p-4 bg-gradient-to-r from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-lg">
                  <div className="text-sm font-semibold text-slate-200 mb-3">
                    🎯 Why Investment Score is {stock.score.investmentScore}/100?
                  </div>
                  
                  <div className="space-y-3">
                    {stock.score.scoreBreakdown.positiveContributors.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-green-300 mb-2">✅ Positive Contributors</div>
                        <div className="space-y-1">
                          {stock.score.scoreBreakdown.positiveContributors.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-green-100">{item.factor}</span>
                              <span className="text-green-400 font-semibold">+{item.impact.toFixed(0)} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {stock.score.scoreBreakdown.negativeContributors.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-red-300 mb-2">⚠️ What's Holding It Back</div>
                        <div className="space-y-1">
                          {stock.score.scoreBreakdown.negativeContributors.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-red-100">{item.factor}</span>
                              <span className="text-red-400 font-semibold">-{item.impact.toFixed(0)} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-400">
                    <div className="text-center mb-1">
                      Confidence: <span className={`font-bold ${
                        stock.score.confidenceScore >= 85 ? 'text-green-400' :
                        stock.score.confidenceScore >= 70 ? 'text-blue-400' :
                        stock.score.confidenceScore >= 50 ? 'text-yellow-400' :
                        'text-orange-400'
                      }`}>{stock.score.confidenceLevel}</span>
                    </div>
                    {stock.score.confidenceExplanation && (
                      <div className="text-center text-[10px] text-slate-500 italic">
                        {stock.score.confidenceExplanation}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CATALYSTS & RISKS */}
              {(stock.score.catalysts && stock.score.catalysts.length > 0) || (stock.score.risks && stock.score.risks.length > 0) ? (
                <div className="mb-4 p-4 bg-gradient-to-r from-cyan-900/30 to-teal-900/30 border border-cyan-700/40 rounded-lg">
                  <div className="text-sm font-semibold text-cyan-200 mb-3">🎢 Growth Catalysts & Risk Factors</div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Catalysts */}
                    {stock.score.catalysts && stock.score.catalysts.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-green-300 mb-2">🚀 Catalysts (Positive Drivers)</div>
                        <div className="space-y-1">
                          {stock.score.catalysts.slice(0, 5).map((catalyst, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-green-100">
                              <span className="text-green-400 mt-0.5">✓</span>
                              <span>{catalyst}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Risks */}
                    {stock.score.risks && stock.score.risks.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-orange-300 mb-2">⚠️ Risks to Monitor</div>
                        <div className="space-y-1">
                          {stock.score.risks.slice(0, 5).map((risk, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-orange-100">
                              <span className="text-orange-400 mt-0.5">⚠</span>
                              <span>{risk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* 5 Pillars Breakdown - Collapsible */}
              <details className="mb-4 group">
                <summary className="cursor-pointer px-3 py-2 bg-purple-800/40 border border-purple-700/50 rounded-lg text-sm font-semibold text-purple-200 hover:text-white hover:bg-purple-800/60 transition-colors">
                  <span className="group-open:hidden">▶ Show Detailed Pillar Breakdown</span>
                  <span className="hidden group-open:inline">▼ Hide Detailed Pillar Breakdown</span>
                </summary>
                <div className="mt-2 p-3 bg-purple-950/40 border border-purple-800/40 rounded-lg">
                  <PillarBar 
                    label="Business Quality" 
                    score={stock.score.pillarScores.businessQuality} 
                    color="text-blue-400"
                    explanation={stock.score.scoringDetails.businessQuality}
                  />
                  <PillarBar 
                    label="Growth" 
                    score={stock.score.pillarScores.growth} 
                    color="text-green-400"
                    explanation={stock.score.scoringDetails.growth}
                  />
                  <PillarBar 
                    label="Valuation" 
                    score={stock.score.pillarScores.valuation} 
                    color="text-purple-400"
                    explanation={stock.score.scoringDetails.valuation}
                  />
                  <PillarBar 
                    label="Technical" 
                    score={stock.score.pillarScores.technicalStrength} 
                    color="text-orange-400"
                    explanation={stock.score.scoringDetails.technical}
                  />
                  <PillarBar 
                    label="Confidence" 
                    score={stock.score.pillarScores.marketConfidence} 
                    color="text-pink-400"
                    explanation={stock.score.scoringDetails.confidence}
                  />
                  <PillarBar 
                    label="Momentum" 
                    score={stock.score.pillarScores.momentum} 
                    color="text-yellow-400"
                    explanation={stock.score.scoringDetails.momentum}
                />
                
                {/* Data Completeness & Warning Indicators */}
                <div className="mt-3 pt-3 border-t border-purple-700/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-300">Data Completeness:</span>
                    <span className={`font-semibold ${
                      stock.score.dataCompleteness >= 70 ? 'text-green-400' :
                      stock.score.dataCompleteness >= 50 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {stock.score.dataCompleteness}%
                    </span>
                  </div>
                  {stock.score.isLossMaking && (
                    <div className="flex items-center gap-1 text-xs bg-red-900/30 border border-red-700/50 px-2 py-1 rounded">
                      <span className="text-red-400">⚠️</span>
                      <span className="text-red-300 font-medium">Loss-Making Company</span>
                    </div>
                  )}
                </div>
                </div>
              </details>

              {/* Detailed Scoring Explanations (Collapsible) */}
              {stock.score.scoringDetails && (
                <details className="mb-4 group">
                  <summary className="cursor-pointer px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                    <span className="group-open:hidden">▶ Show Detailed Scoring</span>
                    <span className="hidden group-open:inline">▼ Hide Detailed Scoring</span>
                  </summary>
                  <div className="mt-2 space-y-2 text-xs">
                    {stock.score.scoringDetails.businessQuality && (
                      <div className="p-2 bg-blue-950/30 border border-blue-800/30 rounded">
                        <div className="font-semibold text-blue-300 mb-1">🏢 Business Quality</div>
                        <div className="text-blue-100 leading-relaxed space-y-1">
                          {stock.score.scoringDetails.businessQuality.split(' | ').map((point, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-blue-400 mt-0.5">•</span>
                              <span>{point.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {stock.score.scoringDetails.growth && (
                      <div className="p-2 bg-green-950/30 border border-green-800/30 rounded">
                        <div className="font-semibold text-green-300 mb-1">📈 Growth</div>
                        <div className="text-green-100 leading-relaxed space-y-1">
                          {stock.score.scoringDetails.growth.split(' | ').map((point, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-green-400 mt-0.5">•</span>
                              <span>{point.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {stock.score.scoringDetails.valuation && (
                      <div className="p-2 bg-purple-950/30 border border-purple-800/30 rounded">
                        <div className="font-semibold text-purple-300 mb-1">💰 Valuation</div>
                        <div className="text-purple-100 leading-relaxed space-y-1">
                          {stock.score.scoringDetails.valuation.split(' | ').map((point, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-purple-400 mt-0.5">•</span>
                              <span>{point.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {stock.score.scoringDetails.technical && (
                      <div className="p-2 bg-orange-950/30 border border-orange-800/30 rounded">
                        <div className="font-semibold text-orange-300 mb-1">📊 Technical</div>
                        <div className="text-orange-100 leading-relaxed space-y-1">
                          {stock.score.scoringDetails.technical.split(' | ').map((point, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-orange-400 mt-0.5">•</span>
                              <span>{point.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {stock.score.scoringDetails.confidence && (
                      <div className="p-2 bg-pink-950/30 border border-pink-800/30 rounded">
                        <div className="font-semibold text-pink-300 mb-1">👥 Market Confidence</div>
                        <div className="text-pink-100 leading-relaxed space-y-1">
                          {stock.score.scoringDetails.confidence.split(' | ').map((point, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-pink-400 mt-0.5">•</span>
                              <span>{point.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {stock.score.scoringDetails.momentum && (
                      <div className="p-2 bg-yellow-950/30 border border-yellow-800/30 rounded">
                        <div className="font-semibold text-yellow-300 mb-1">🚀 Momentum</div>
                        <div className="text-yellow-100 leading-relaxed space-y-1">
                          {stock.score.scoringDetails.momentum.split(' | ').map((point, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-yellow-400 mt-0.5">•</span>
                              <span>{point.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold mb-4 ${getActionColor(stock.action)}`}>
                <span className="text-lg">{stock.action}</span>
              </div>

              {/* Entry Point Info */}
              <div className="mb-4 p-3 bg-cyan-950/40 border border-cyan-700/40 rounded-lg">
                <div className="text-sm font-semibold text-cyan-200 mb-3">💰 Entry Strategies</div>
                
                {/* Value-Based Entry (Long-term) */}
                {stock.entryPoint.valueBasedEntry && (
                  <div className="mb-3 p-2 bg-blue-900/30 border border-blue-600/40 rounded">
                    <div className="text-xs font-semibold text-blue-300 mb-1">💎 Value Investing (Long-term)</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-300">Current Price:</span>
                        <span className="text-white ml-1 font-semibold">{formatCurrency(stock.entryPoint.currentPrice)}</span>
                      </div>
                      <div>
                        <span className="text-gray-300">Target Entry:</span>
                        <span className="text-green-300 ml-1 font-semibold">{formatCurrency(stock.entryPoint.valueBasedEntry)}</span>
                      </div>
                    </div>
                    <div className="mt-1 text-xs">
                      {stock.entryPoint.currentPrice > stock.entryPoint.valueBasedEntry ? (
                        <span className="text-orange-300">
                          {(() => {
                            const gap = ((stock.entryPoint.currentPrice - stock.entryPoint.valueBasedEntry) / stock.entryPoint.currentPrice) * 100;
                            if (gap > 35) {
                              return '⏸️ Significant discount needed - monitor for major correction';
                            } else if (gap > 20) {
                              return '⏸️ Wait for meaningful correction';
                            } else if (gap > 10) {
                              return '⏸️ Wait for 10-15% dip to entry zone';
                            } else {
                              return '⏸️ Close to entry zone - watch for dip';
                            }
                          })()}
                        </span>
                      ) : (
                        <span className="text-green-300">
                          ✅ Below value-based entry - good for accumulation
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Technical Entry (Short-term) */}
                <div className="p-2 bg-purple-900/30 border border-purple-600/40 rounded">
                  <div className="text-xs font-semibold text-purple-300 mb-1">📈 Momentum Trading (Short-term)</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-300">Technical Entry:</span>
                      <span className="text-purple-200 ml-1 font-semibold">{formatCurrency(stock.entryPoint.technicalEntry)}</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Stop Loss:</span>
                      <span className="text-red-300 ml-1 font-semibold">{formatCurrency(stock.entryPoint.stopLoss)}</span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs">
                    <span className="text-gray-300">Target Range:</span>
                    <span className="text-yellow-300 ml-1 font-semibold">{formatCurrency(stock.entryPoint.target)}</span>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-cyan-100 font-medium italic">
                  {stock.entryPoint.recommendation}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-lg">
                <div>
                  <div className="text-sm text-indigo-200">P/E</div>
                  <div className="text-base font-semibold text-white">{formatMetric(stock.keyMetrics.pe)}</div>
                </div>
                <div>
                  <div className="text-sm text-indigo-200">ROE</div>
                  <div className="text-base font-semibold text-white">{formatMetric(stock.keyMetrics.roe)}%</div>
                </div>
                <div>
                  <div className="text-sm text-indigo-200">ROCE</div>
                  <div className="text-base font-semibold text-white">{formatMetric(stock.keyMetrics.roce)}%</div>
                </div>
                <div>
                  <div className="text-sm text-indigo-200">D/E</div>
                  <div className="text-base font-semibold text-white">{formatMetric(stock.keyMetrics.debtToEquity)}</div>
                </div>
              </div>

              {/* Investment Thesis */}
              {stock.investmentThesis && (
                <div className="mb-3 p-3 bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-700/40 rounded-lg">
                  <h4 className="text-xs font-semibold text-indigo-200 mb-1 uppercase tracking-wide">📜 Investment Thesis</h4>
                  <p className="text-sm text-white font-medium italic leading-relaxed">
                    "{stock.investmentThesis}"
                  </p>
                </div>
              )}

              {/* Explanation */}
              <div className="mb-4 p-3 bg-blue-950/40 border border-blue-800/40 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-200 mb-2">📊 Analysis</h4>
                <p className="text-sm text-white leading-relaxed">
                  {stock.explanation}
                </p>
              </div>

              {/* Strengths */}
              {stock.strengths && stock.strengths.length > 0 && (
                <div className="mb-3 p-3 bg-green-950/40 border border-green-800/40 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-300 mb-2">✓ Strengths</h4>
                  <ul className="space-y-1">
                    {stock.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-white flex items-start">
                        <span className="text-green-400 mr-1.5 mt-0.5">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {stock.weaknesses && stock.weaknesses.length > 0 && (
                <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-lg">
                  <h4 className="text-sm font-semibold text-red-300 mb-2">✗ Weaknesses</h4>
                  <ul className="space-y-1">
                    {stock.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-sm text-white flex items-start">
                        <span className="text-red-400 mr-1.5 mt-0.5">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
