// Comprehensive stock data types

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

export interface QuarterlyResult {
  quarter: string; // e.g., "Jun 2026"
  sales: number;
  operatingProfit: number;
  opm: number; // Operating Profit Margin %
  netProfit: number;
  eps: number;
  profitGrowth: number; // YoY %
  salesGrowth: number; // YoY %
}

export interface AnnualResult {
  year: string; // e.g., "Mar 2026"
  sales: number;
  operatingProfit: number;
  opm: number;
  netProfit: number;
  eps: number;
}

export interface CashFlowData {
  cfo: number; // Cash from Operating Activities
  cfi: number; // Cash from Investing
  cff: number; // Cash from Financing
  netCashFlow: number;
  freeCashFlow: number;
  cfoToOp: number; // CFO / Operating Profit %
}

export interface ShareholdingPattern {
  promoter: number; // %
  fii: number; // Foreign Institutional Investors %
  dii: number; // Domestic Institutional Investors %
  public: number; // %
  trend: 'increasing' | 'stable' | 'decreasing'; // Promoter trend
}

export interface CompoundedGrowth {
  sales10Y: number | null;
  sales5Y: number | null;
  sales3Y: number | null;
  profit10Y: number | null;
  profit5Y: number | null;
  profit3Y: number | null;
}

export interface FundamentalRatios {
  peRatio: number | null;
  pbRatio: number | null;
  roe: number | null;
  roce: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  bookValue: number | null;
  faceValue: number | null;
  marketCap: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

export interface CompetitorInfo {
  symbol: string;
  name: string;
  price: number;
  peRatio: number | null;
  marketCap: number;
  profitGrowth: number;
  salesGrowth: number;
  roce: number;
}

export interface TechnicalIndicators {
  rsi: number | null;
  macd: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
  };
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  bollingerBands: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
  };
  trend: 'bullish' | 'bearish' | 'neutral';
}

// Complete stock analysis
export interface StockAnalysis {
  quote: StockQuote;
  fundamentals: FundamentalRatios;
  technicals: TechnicalIndicators;
  quarterlyResults: QuarterlyResult[]; // Last 4 quarters
  annualResults: AnnualResult[]; // Last 5 years
  latestCashFlow: CashFlowData;
  shareholding: ShareholdingPattern;
  compoundedGrowth: CompoundedGrowth;
  competitors: CompetitorInfo[];
  support: number[];
  resistance: number[];
  recommendation: InvestmentRecommendation;
}

export interface InvestmentRecommendation {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  targetPrice: number;
  stopLoss: number;
  timeHorizon: '3-6 months' | '6-12 months' | '1-2 years';
  
  // Detailed reasoning
  whyBuy?: string[]; // Reasons supporting buy
  whySell?: string[]; // Reasons supporting sell
  whyHold?: string[]; // Reasons supporting hold
  
  // Analysis sections
  fundamentalAnalysis: string; // Detailed fundamental reasoning
  technicalAnalysis: string; // Detailed technical reasoning
  valuationAnalysis: string; // Is it cheap/expensive?
  growthProspects: string; // Future growth potential
  riskFactors: string[]; // Key risks
  catalysts: string[]; // Potential triggers for price movement
  
  // Summary
  summary: string; // 2-3 sentence TL;DR
}
