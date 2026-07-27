import axios from 'axios';
import * as cheerio from 'cheerio';
import { searchStocks } from './stockSymbols';

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

export interface StockFundamentals {
  // Valuation Ratios
  peRatio: number | null;
  pbRatio: number | null;
  pegRatio: number | null;
  industryPE: number | null;
  
  // Profitability
  eps: number | null;
  roe: number | null;
  
  // Dividends
  dividend: number | null;
  dividendYield: number | null;
  
  // Financial Health
  debtToEquity: number | null;
  bookValue: number | null;
  faceValue: number | null;
  
  // Market Data
  beta: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  sharesOutstanding: number | null;
  marketCap: number | null;
  
  // Performance
  quarterlyGrowth: number | null;
  yearlyGrowth: number | null;
  
  // Company Info
  sector: string | null;
  industry: string | null;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Smart symbol resolver for Indian NSE stocks only
export async function resolveStockSymbol(userInput: string): Promise<{ symbol: string | null; suggestions?: Array<{ symbol: string; name: string }> }> {
  const input = userInput.toUpperCase().trim();
  
  // If already has .NS suffix, use as-is
  if (input.endsWith('.NS')) {
    const quote = await fetchStockQuote(input);
    return { symbol: quote ? input : null };
  }
  
  // Try different NSE variants for Indian stocks (direct ticker symbol)
  const variants = [
    `${input}.NS`,           // Direct NSE ticker - e.g., RELIANCE.NS, TCS.NS
    `${input}BANK.NS`,       // Indian banks - e.g., HDFCBANK.NS, ICICIBANK.NS
    `${input}LTD.NS`,        // Companies with LTD - e.g., TATAMOTORS.NS
  ];
  
  // Try each variant until one works
  for (const variant of variants) {
    try {
      const quote = await fetchStockQuote(variant);
      if (quote) {
        console.log(`✓ Resolved "${userInput}" to "${variant}" (NSE)`);
        return { symbol: variant };
      }
    } catch (error) {
      // Continue to next variant
    }
  }
  
  // If exact symbol not found, try searching by company name
  console.log(`Searching for "${userInput}" by company name...`);
  const searchResults = await searchStocks(userInput, 5);
  
  if (searchResults.length > 0) {
    // Try the first match
    const firstMatch = searchResults[0];
    const symbolWithNS = `${firstMatch.symbol}.NS`;
    
    try {
      const quote = await fetchStockQuote(symbolWithNS);
      if (quote) {
        console.log(`✓ Found "${userInput}" via search: "${symbolWithNS}"`);
        return { 
          symbol: symbolWithNS,
          suggestions: searchResults.map(r => ({ symbol: r.symbol, name: r.name }))
        };
      }
    } catch (error) {
      // Continue to suggestions
    }
    
    // Return suggestions if first match didn't work
    return { 
      symbol: null, 
      suggestions: searchResults.map(r => ({ symbol: r.symbol, name: r.name }))
    };
  }
  
  console.log(`✗ Could not find "${userInput}" on NSE`);
  return { symbol: null };
}

// Using Yahoo Finance API (via yfinance-like endpoint)
export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    // Using a free stock API - you can replace with yfinance proxy or Alpha Vantage
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    const data = response.data.chart.result[0];
    const meta = data.meta;
    const quote = data.indicators.quote[0];
    
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    return {
      symbol: meta.symbol,
      name: meta.symbol, // Yahoo doesn't always provide full name in this endpoint
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      volume: meta.regularMarketVolume || 0,
      marketCap: meta.marketCap || 0,
      high: quote.high[quote.high.length - 1] || 0,
      low: quote.low[quote.low.length - 1] || 0,
      open: quote.open[quote.open.length - 1] || 0,
      previousClose: previousClose,
    };
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return null;
  }
}

export async function fetchStockFundamentals(symbol: string): Promise<StockFundamentals | null> {
  try {
    // For NSE stocks (.NS), try Screener.in FIRST (more reliable for Indian stocks)
    if (symbol.endsWith('.NS')) {
      const screenerData = await fetchComprehensiveDataFromScreener(symbol);
      
      if (screenerData?.fundamentals && Object.keys(screenerData.fundamentals).length > 3) {
        console.log('✅ Using Screener.in as primary data source');
        
        // Fetch additional data from Yahoo for fields Screener.in doesn't have
        let yahooData: any = {};
        try {
          const response = await axios.get(
            `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`,
            {
              params: {
                modules: 'defaultKeyStatistics,financialData,summaryDetail,assetProfile'
              },
              headers: {
                'User-Agent': 'Mozilla/5.0'
              },
              timeout: 5000
            }
          );
          
          const result = response.data.quoteSummary?.result?.[0];
          if (result) {
            const keyStats = result.defaultKeyStatistics || {};
            const financialData = result.financialData || {};
            const summaryDetail = result.summaryDetail || {};
            const assetProfile = result.assetProfile || {};
            
            yahooData = {
              beta: keyStats.beta?.raw || null,
              sharesOutstanding: keyStats.sharesOutstanding?.raw || null,
              quarterlyGrowth: financialData.revenueGrowth?.raw ? financialData.revenueGrowth.raw * 100 : null,
              yearlyGrowth: keyStats.earningsQuarterlyGrowth?.raw ? keyStats.earningsQuarterlyGrowth.raw * 100 : null,
              sector: assetProfile.sector || null,
              industry: assetProfile.industry || null,
            };
          }
        } catch (yahooError) {
          console.log('Yahoo Finance supplementary data not available');
        }
        
        // Merge Screener.in data (primary) with Yahoo data (supplementary)
        const fundamentals = screenerData.fundamentals;
        return {
          peRatio: fundamentals.peRatio || null,
          pbRatio: fundamentals.pbRatio || null,
          pegRatio: fundamentals.pegRatio || yahooData.pegRatio || null,
          industryPE: null,
          
          eps: fundamentals.eps || null,
          roe: fundamentals.roe || null,
          
          dividend: fundamentals.dividend || null,
          dividendYield: fundamentals.dividendYield || null,
          
          debtToEquity: fundamentals.debtToEquity || null,
          bookValue: fundamentals.bookValue || null,
          faceValue: fundamentals.faceValue || null,
          
          beta: yahooData.beta || null,
          fiftyTwoWeekHigh: fundamentals.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: fundamentals.fiftyTwoWeekLow || null,
          sharesOutstanding: yahooData.sharesOutstanding || null,
          marketCap: fundamentals.marketCap || null,
          
          quarterlyGrowth: yahooData.quarterlyGrowth || null,
          yearlyGrowth: yahooData.yearlyGrowth || null,
          
          sector: yahooData.sector || null,
          industry: yahooData.industry || null,
        };
      }
    }
    
    // Fallback to Yahoo Finance (original logic) if Screener.in fails or non-NSE stock
    console.log('📡 Fetching from Yahoo Finance...');
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`,
      {
        params: {
          modules: 'defaultKeyStatistics,financialData,summaryDetail,assetProfile'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    const result = response.data.quoteSummary?.result?.[0];
    if (!result) return null;

    const keyStats = result.defaultKeyStatistics || {};
    const financialData = result.financialData || {};
    const summaryDetail = result.summaryDetail || {};
    const assetProfile = result.assetProfile || {};

    return {
      // Valuation Ratios
      peRatio: keyStats.forwardPE?.raw || keyStats.trailingPE?.raw || null,
      pbRatio: keyStats.priceToBook?.raw || null,
      pegRatio: keyStats.pegRatio?.raw || null,
      industryPE: null, // Not directly available, would need sector comparison
      
      // Profitability
      eps: financialData.revenuePerShare?.raw || keyStats.trailingEps?.raw || null,
      roe: financialData.returnOnEquity?.raw ? financialData.returnOnEquity.raw * 100 : null,
      
      // Dividends
      dividend: summaryDetail.dividendRate?.raw || null,
      dividendYield: summaryDetail.dividendYield?.raw ? summaryDetail.dividendYield.raw * 100 : null,
      
      // Financial Health
      debtToEquity: financialData.debtToEquity?.raw || null,
      bookValue: keyStats.bookValue?.raw || null,
      faceValue: null, // Not available in Yahoo Finance
      
      // Market Data
      beta: keyStats.beta?.raw || null,
      fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh?.raw || null,
      fiftyTwoWeekLow: summaryDetail.fiftyTwoWeekLow?.raw || null,
      sharesOutstanding: keyStats.sharesOutstanding?.raw || null,
      marketCap: summaryDetail.marketCap?.raw || null,
      
      // Performance
      quarterlyGrowth: financialData.revenueGrowth?.raw ? financialData.revenueGrowth.raw * 100 : null,
      yearlyGrowth: keyStats.earningsQuarterlyGrowth?.raw ? keyStats.earningsQuarterlyGrowth.raw * 100 : null,
      
      // Company Info
      sector: assetProfile.sector || null,
      industry: assetProfile.industry || null,
    };
  } catch (error) {
    console.error('Error fetching fundamentals:', error);
    
    // Fallback to Finnhub if available
    try {
      const apiKey = process.env.FINNHUB_API_KEY;
      if (!apiKey) return null;

      const response = await axios.get(
        `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all`,
        {
          params: { token: apiKey }
        }
      );

      const metrics = response.data.metric;

      return {
        peRatio: metrics.peBasicExclExtraTTM || null,
        pbRatio: metrics.pbQuarterly || null,
        pegRatio: null,
        industryPE: null,
        eps: metrics.epsBasicExclExtraItemsTTM || null,
        roe: metrics.roeTTM || null,
        dividend: null,
        dividendYield: metrics.dividendYieldIndicatedAnnual || null,
        debtToEquity: null,
        bookValue: null,
        faceValue: null,
        beta: metrics.beta || null,
        fiftyTwoWeekHigh: metrics['52WeekHigh'] || null,
        fiftyTwoWeekLow: metrics['52WeekLow'] || null,
        sharesOutstanding: metrics.sharesOutstanding || null,
        marketCap: null,
        quarterlyGrowth: null,
        yearlyGrowth: null,
        sector: null,
        industry: null,
      };
    } catch (fallbackError) {
      return null;
    }
  }
}

export async function fetchHistoricalData(
  symbol: string,
  period: string = '1y'
): Promise<HistoricalData[]> {
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      {
        params: {
          interval: '1d',
          range: period,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    const data = response.data.chart.result[0];
    const timestamps = data.timestamp;
    const quotes = data.indicators.quote[0];

    return timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      open: quotes.open[index] || 0,
      high: quotes.high[index] || 0,
      low: quotes.low[index] || 0,
      close: quotes.close[index] || 0,
      volume: quotes.volume[index] || 0,
    }));
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
}

// Calculate price returns and momentum metrics from historical data
// ALSO calculates technical indicators to avoid duplicate API calls
export async function fetchPriceReturns(symbol: string, currentPrice: number): Promise<{
  returns1M: number | null;
  returns3M: number | null;
  returns6M: number | null;
  returns1Y: number | null;
  volumeTrend: 'increasing' | 'decreasing' | 'stable' | null;
  technicals: {
    rsi: number | null;
    macd: { macd: number | null; signal: number | null; histogram: number | null; };
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
  };
}> {
  try {
    // Fetch 1 year of historical data (used for BOTH returns and technical indicators)
    const historicalData = await fetchHistoricalData(symbol, '1y');
    
    if (!historicalData || historicalData.length < 20) {
      return {
        returns1M: null,
        returns3M: null,
        returns6M: null,
        returns1Y: null,
        volumeTrend: null,
        technicals: {
          rsi: null,
          macd: { macd: null, signal: null, histogram: null },
          sma20: null,
          sma50: null,
          sma200: null,
        },
      };
    }
    
    // Sort by date (oldest first)
    historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const latestPrice = historicalData[historicalData.length - 1].close || currentPrice;
    
    // ===== PRICE RETURNS =====
    // Calculate returns for different time periods
    const calculateReturn = (daysAgo: number): number | null => {
      const targetIndex = Math.max(0, historicalData.length - daysAgo);
      if (targetIndex >= historicalData.length) return null;
      const oldPrice = historicalData[targetIndex].close;
      if (!oldPrice || oldPrice === 0) return null;
      return ((latestPrice - oldPrice) / oldPrice) * 100;
    };
    
    const returns1M = calculateReturn(21); // ~1 month = 21 trading days
    const returns3M = calculateReturn(63); // ~3 months = 63 trading days
    const returns6M = calculateReturn(126); // ~6 months = 126 trading days
    const returns1Y = calculateReturn(252); // ~1 year = 252 trading days
    
    // Calculate volume trend (recent 20 days vs previous 20 days)
    let volumeTrend: 'increasing' | 'decreasing' | 'stable' | null = null;
    if (historicalData.length >= 40) {
      const recentVolume = historicalData.slice(-20).reduce((sum, d) => sum + d.volume, 0) / 20;
      const olderVolume = historicalData.slice(-40, -20).reduce((sum, d) => sum + d.volume, 0) / 20;
      
      if (olderVolume > 0) {
        const volumeChange = ((recentVolume - olderVolume) / olderVolume) * 100;
        if (volumeChange >= 20) volumeTrend = 'increasing';
        else if (volumeChange <= -20) volumeTrend = 'decreasing';
        else volumeTrend = 'stable';
      }
    }
    
    // ===== TECHNICAL INDICATORS =====
    // Reuse the same historical data to calculate technical indicators
    const closes = historicalData.map(d => d.close);
    
    // RSI (14 periods)
    let rsi: number | null = null;
    try {
      const SMA = require('technicalindicators').SMA;
      const RSI = require('technicalindicators').RSI;
      const MACD = require('technicalindicators').MACD;
      
      const rsiValues = RSI.calculate({ values: closes, period: 14 });
      rsi = rsiValues[rsiValues.length - 1] || null;
    } catch (error) {
      console.error('Error calculating RSI:', error);
    }
    
    // MACD
    let macd = { macd: null as number | null, signal: null as number | null, histogram: null as number | null };
    try {
      const MACD = require('technicalindicators').MACD;
      const macdValues = MACD.calculate({
        values: closes,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false
      });
      const lastMACD = macdValues[macdValues.length - 1];
      if (lastMACD) {
        macd = {
          macd: lastMACD.MACD || null,
          signal: lastMACD.signal || null,
          histogram: lastMACD.histogram || null,
        };
      }
    } catch (error) {
      console.error('Error calculating MACD:', error);
    }
    
    // Moving Averages
    let sma20: number | null = null;
    let sma50: number | null = null;
    let sma200: number | null = null;
    
    try {
      const SMA = require('technicalindicators').SMA;
      
      if (closes.length >= 20) {
        const sma20Values = SMA.calculate({ period: 20, values: closes });
        sma20 = sma20Values[sma20Values.length - 1] || null;
      }
      
      if (closes.length >= 50) {
        const sma50Values = SMA.calculate({ period: 50, values: closes });
        sma50 = sma50Values[sma50Values.length - 1] || null;
      }
      
      if (closes.length >= 200) {
        const sma200Values = SMA.calculate({ period: 200, values: closes });
        sma200 = sma200Values[sma200Values.length - 1] || null;
      }
    } catch (error) {
      console.error('Error calculating SMAs:', error);
    }
    
    return {
      returns1M,
      returns3M,
      returns6M,
      returns1Y,
      volumeTrend,
      technicals: {
        rsi,
        macd,
        sma20,
        sma50,
        sma200,
      },
    };
  } catch (error) {
    console.error('Error fetching price returns:', error);
    return {
      returns1M: null,
      returns3M: null,
      returns6M: null,
      returns1Y: null,
      volumeTrend: null,
      technicals: {
        rsi: null,
        macd: { macd: null, signal: null, histogram: null },
        sma20: null,
        sma50: null,
        sma200: null,
      },
    };
  }
}

// Fetch comprehensive stock data from Screener.in using DIRECT HTML PARSING
export async function fetchComprehensiveDataFromScreener(symbol: string) {
  try {
    const baseSymbol = symbol.replace('.NS', '');
    
    // Fetch HTML directly (NO Jina AI - faster and more reliable!)
    const url = `https://www.screener.in/company/${baseSymbol}/`;
    console.log(`📊 Fetching HTML directly from Screener.in: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = response.data;
    console.log(`✅ HTML fetched successfully (${html.length} chars)`);
    
    // Parse HTML with cheerio
    const $ = cheerio.load(html);
    
    // Extract all data using DOM parsing (NO REGEX!)
    return {
      fundamentals: parseHTMLFundamentals($),
      quarterlyResults: parseHTMLQuarterlyResults($),
      annualResults: parseHTMLAnnualResults($),
      cashFlow: parseHTMLCashFlow($),
      balanceSheet: parseHTMLBalanceSheet($),
      shareholding: parseHTMLShareholding($),
      compoundedGrowth: parseHTMLCompoundedGrowth($),
    };
  } catch (error: any) {
    console.error('❌ Error fetching from Screener.in:', error.message);
    
    return {
      fundamentals: {},
      quarterlyResults: [],
      annualResults: [],
      cashFlow: {},
      shareholding: {},
      compoundedGrowth: {},
    };
  }
}

// ==================== HTML PARSING FUNCTIONS (NO REGEX!) ====================

function parseHTMLFundamentals($: cheerio.CheerioAPI) {
  const fundamentals: any = {};
  
  try {
    // Parse key ratios from the top section
    $('#top-ratios li').each((_, el) => {
      const text = $(el).text().trim();
      
      // Market Cap
      if (text.includes('Market Cap')) {
        const match = text.match(/([\d,]+(?:\.\d+)?)\s*Cr\./);
        if (match) {
          fundamentals.marketCap = parseFloat(match[1].replace(/,/g, '')) * 10000000;
        }
      }
      
      // Stock P/E
      else if (text.includes('Stock P/E')) {
        const match = text.match(/Stock P\/E\s*([\d,\.]+)/);
        if (match) {
          fundamentals.peRatio = parseFloat(match[1].replace(/,/g, ''));
        }
      }
      
      // P/B Ratio (from book value)
      else if (text.includes('Book Value')) {
        const match = text.match(/Book Value\s*₹\s*([\d,\.]+)/);
        if (match) {
          fundamentals.bookValue = parseFloat(match[1].replace(/,/g, ''));
        }
      }
      
      // Dividend Yield
      else if (text.includes('Dividend Yield')) {
        const match = text.match(/Dividend Yield\s*([\d,\.]+)\s*%/);
        if (match) {
          fundamentals.dividendYield = parseFloat(match[1].replace(/,/g, ''));
        }
      }
      
      // ROCE
      else if (text.includes('ROCE')) {
        const match = text.match(/ROCE\s*([-\d,\.]+)\s*%/);
        if (match) {
          fundamentals.roce = parseFloat(match[1].replace(/,/g, ''));
        }
      }
      
      // ROE
      else if (text.includes('ROE')) {
        const match = text.match(/ROE\s*([-\d,\.]+)\s*%/);
        if (match) {
          fundamentals.roe = parseFloat(match[1].replace(/,/g, ''));
        }
      }
      
      // 52-week High/Low
      else if (text.includes('High / Low')) {
        const match = text.match(/₹\s*([\d,\.]+)\s*\/\s*([\d,\.]+)/);
        if (match) {
          fundamentals.fiftyTwoWeekHigh = parseFloat(match[1].replace(/,/g, ''));
          fundamentals.fiftyTwoWeekLow = parseFloat(match[2].replace(/,/g, ''));
        }
      }
    });
    
    console.log('✅ HTML Fundamentals extracted:', Object.keys(fundamentals).length, 'fields');
  } catch (error) {
    console.error('❌ Error parsing HTML fundamentals:', error);
  }
  
  return fundamentals;
}

function parseHTMLQuarterlyResults($: cheerio.CheerioAPI) {
  const quarters: any[] = [];
  
  try {
    // Find quarterly results table (search inside section, not parent!)
    const section = $('section#quarters, #quarters');
    const table = section.find('table').first();
    
    if (table.length === 0) {
      console.warn('⚠️ Quarterly results table not found');
      return quarters;
    }
    
    // Get header row to find quarter columns
    const headerCells = table.find('thead tr').last().find('th, td');
    const quarterNames: string[] = [];
    headerCells.each((i, cell) => {
      const text = $(cell).text().trim();
      if (text.match(/\w+ \d{4}/)) {
        quarterNames.push(text);
      }
    });
    
    // Get last 4 quarters
    const lastQuarters = quarterNames.slice(-4);
    
    // Extract sales, operating profit, net profit for each quarter
    const salesRow = table.find('tr').filter((_, row) => {
      const firstCell = $(row).find('td').first().text().trim();
      return firstCell === 'Sales' || (!firstCell && $(row).find('td').length > 1);
    }).first();
    
    const opProfitRow = table.find('tr').filter((_, row) => {
      return $(row).find('td').first().text().trim() === 'Operating Profit';
    }).first();
    
    const netProfitRow = table.find('tr').filter((_, row) => {
      const cells = $(row).find('td');
      return cells.first().text().trim() === '' && cells.length > 1 && $(row).index() > opProfitRow.index();
    }).first();
    
    const epsRow = table.find('tr').filter((_, row) => {
      return $(row).find('td').first().text().trim() === 'EPS in Rs';
    }).first();
    
    lastQuarters.forEach((quarter, idx) => {
      const colIdx = quarterNames.indexOf(quarter) + 1; // +1 for label column
      
      const sales = parseFloat(salesRow.find('td').eq(colIdx).text().replace(/,/g, '')) || 0;
      const opProfit = parseFloat(opProfitRow.find('td').eq(colIdx).text().replace(/,/g, '')) || 0;
      const netProfit = parseFloat(netProfitRow.find('td').eq(colIdx).text().replace(/,/g, '')) || 0;
      const eps = epsRow.length > 0 ? parseFloat(epsRow.find('td').eq(colIdx).text().replace(/,/g, '')) || null : null;
      
      quarters.push({ quarter, sales, operatingProfit: opProfit, netProfit, eps });
    });
    
    console.log('✅ HTML Quarterly results extracted:', quarters.length, 'quarters');
  } catch (error) {
    console.error('❌ Error parsing HTML quarterly results:', error);
  }
  
  return quarters;
}

function parseHTMLAnnualResults($: cheerio.CheerioAPI) {
  const annualData: any = {};
  
  try {
    // Find Profit & Loss table (search inside section, not parent!)
    const section = $('section#profit-loss, #profit-loss');
    const table = section.find('table').first();
    
    if (table.length === 0) {
      console.warn('⚠️ Annual results table not found');
      return annualData;
    }
    
    // Get column headers (years)
    const headerCells = table.find('thead tr').last().find('th, td');
    const years: string[] = [];
    headerCells.each((i, cell) => {
      const text = $(cell).text().trim();
      if (text.match(/Mar \d{4}/)) {
        years.push(text);
      }
    });
    
    // Helper to get value from row by label
    const getRowValues = (label: string) => {
      const row = table.find('tr').filter((_, r) => {
        return $(r).find('td').first().text().trim() === label;
      }).first();
      
      const values: { [key: string]: number } = {};
      if (row.length) {
        row.find('td').slice(1).each((idx, cell) => {
          if (idx < years.length) {
            const val = $(cell).text().replace(/,/g, '').trim();
            values[years[idx]] = parseFloat(val) || 0;
          }
        });
      }
      return values;
    };
    
    // Extract key metrics (using exact row labels from Screener.in)
    annualData.sales = getRowValues('Sales') || getRowValues('');
    annualData.operatingProfit = getRowValues('Operating Profit');
    annualData.opm = getRowValues('OPM %');
    annualData.netProfit = getRowValues('Net Profit') || getRowValues('');
    annualData.npm = getRowValues('NPM %');
    annualData.eps = getRowValues('EPS in Rs');
    
    console.log('✅ HTML Annual results extracted:', Object.keys(annualData).length, 'metrics');
  } catch (error) {
    console.error('❌ Error parsing HTML annual results:', error);
  }
  
  return annualData;
}

function parseHTMLCashFlow($: cheerio.CheerioAPI) {
  const cashFlow: any = {};
  
  try {
    // Find Cash Flow table (search inside section, not parent!)
    const section = $('section#cash-flow, #cash-flow');
    const table = section.find('table').first();
    
    if (table.length === 0) {
      console.warn('⚠️ Cash flow table not found');
      return cashFlow;
    }
    
    // Find Free Cash Flow row
    const fcfRow = table.find('tr').filter((_, r) => {
      const firstCellText = $(r).find('td').first().text().trim();
      return firstCellText === 'Free Cash Flow';
    }).first();
    
    if (fcfRow.length) {
      // Get ALL data cells (skip first which is label)
      const dataCells = fcfRow.find('td').slice(1);
      // Get the LAST data cell (latest year, regardless of header matching)
      const lastCell = dataCells.last();
      const fcfValue = parseFloat(lastCell.text().replace(/,/g, ''));
      cashFlow.freeCashFlow = fcfValue;
      console.log(`✅ FCF extracted from HTML: ${fcfValue} (latest year)`);
    }
    
    // Find CFO/OP row
    const cfoRow = table.find('tr').filter((_, r) => {
      const firstCellText = $(r).find('td').first().text().trim();
      return firstCellText === 'CFO/OP';
    }).first();
    
    if (cfoRow.length) {
      // Get ALL data cells (skip first which is label)
      const dataCells = cfoRow.find('td').slice(1);
      // Get the LAST data cell (latest year)
      const lastCell = dataCells.last();
      const cfoValue = parseFloat(lastCell.text().replace(/[,%]/g, ''));
      cashFlow.cfoToOp = cfoValue;
      console.log(`✅ CFO/OP extracted from HTML: ${cfoValue}% (latest year)`);
    }
    
    console.log('✅ HTML Cash flow extracted successfully');
  } catch (error) {
    console.error('❌ Error parsing HTML cash flow:', error);
  }
  
  return cashFlow;
}

function parseHTMLShareholding($: cheerio.CheerioAPI) {
  const shareholding: any = {};
  
  try {
    // Find shareholding table (search inside section, not parent!)
    const section = $('section#shareholding, #shareholding');
    const table = section.find('table').first();
    
    if (table.length === 0) {
      console.warn('⚠️ Shareholding table not found');
      return shareholding;
    }
    
    // Get ALL quarters for trend analysis (last 5 quarters)
    const headerCells = table.find('thead tr').last().find('th, td');
    const quarters: string[] = [];
    headerCells.each((i, cell) => {
      const text = $(cell).text().trim();
      if (text.match(/\w+ \d{4}/)) {
        quarters.push(text);
      }
    });
    
    const latestQuarter = quarters[quarters.length - 1];
    const latestQtrIdx = quarters.length;
    
    // Helper to get percentage from row (all quarters)
    const getPercentageTrend = (label: string) => {
      const row = table.find('tr').filter((_, r) => {
        return $(r).find('td').first().text().trim().includes(label);
      }).first();
      
      const values: number[] = [];
      if (row.length) {
        // Get last 5 quarters (or all if less)
        const startIdx = Math.max(1, quarters.length - 4); // Start from 5 quarters ago
        for (let i = startIdx; i <= quarters.length; i++) {
          const cell = row.find('td').eq(i);
          const match = cell.text().match(/([\d,\.]+)%/);
          if (match) {
            values.push(parseFloat(match[1].replace(/,/g, '')));
          }
        }
      }
      return values;
    };
    
    // Helper to get shareholder count trend
    const getShareholderTrend = () => {
      const row = table.find('tr').filter((_, r) => {
        return $(r).find('td').first().text().trim().includes('No. of Shareholders');
      }).first();
      
      const values: number[] = [];
      if (row.length) {
        const startIdx = Math.max(1, quarters.length - 4);
        for (let i = startIdx; i <= quarters.length; i++) {
          const cell = row.find('td').eq(i);
          const text = cell.text().replace(/,/g, '').trim();
          const num = parseInt(text);
          if (!isNaN(num)) {
            values.push(num);
          }
        }
      }
      return values;
    };
    
    // Extract current values (latest quarter)
    const promoterTrend = getPercentageTrend('Promoters') || getPercentageTrend('Promoter');
    const fiiTrend = getPercentageTrend('FII');
    const diiTrend = getPercentageTrend('DII');
    const publicTrend = getPercentageTrend('Public');
    const shareholderTrend = getShareholderTrend();
    
    // Current values
    shareholding.promoter = promoterTrend.length > 0 ? promoterTrend[promoterTrend.length - 1] : null;
    shareholding.fii = fiiTrend.length > 0 ? fiiTrend[fiiTrend.length - 1] : null;
    shareholding.dii = diiTrend.length > 0 ? diiTrend[diiTrend.length - 1] : null;
    shareholding.public = publicTrend.length > 0 ? publicTrend[publicTrend.length - 1] : null;
    
    // Calculate trends (change from oldest to latest in the window)
    const calculateTrend = (values: number[]) => {
      if (values.length < 2) return null;
      const oldest = values[0];
      const latest = values[values.length - 1];
      return latest - oldest; // Change in percentage points
    };
    
    shareholding.promoterTrendChange = calculateTrend(promoterTrend);
    shareholding.fiiTrendChange = calculateTrend(fiiTrend);
    shareholding.diiTrendChange = calculateTrend(diiTrend);
    shareholding.publicTrendChange = calculateTrend(publicTrend);
    
    // Shareholder count trend
    if (shareholderTrend.length >= 2) {
      const oldest = shareholderTrend[0];
      const latest = shareholderTrend[shareholderTrend.length - 1];
      shareholding.shareholderCount = latest;
      shareholding.shareholderCountChange = ((latest - oldest) / oldest) * 100; // % change
    }
    
    console.log('✅ HTML Shareholding extracted with trends:', shareholding);
  } catch (error) {
    console.error('❌ Error parsing HTML shareholding:', error);
  }
  
  return shareholding;
}

function parseHTMLBalanceSheet($: cheerio.CheerioAPI) {
  const balanceSheet: any = {};
  
  try {
    // Find Balance Sheet table
    const section = $('section#balance-sheet, #balance-sheet');
    const table = section.find('table').first();
    
    if (table.length === 0) {
      console.warn('⚠️ Balance sheet table not found');
      return balanceSheet;
    }
    
    // Get column headers (years)
    const headerCells = table.find('thead tr').last().find('th, td');
    const years: string[] = [];
    headerCells.each((i, cell) => {
      const text = $(cell).text().trim();
      if (text.match(/Mar \d{4}/)) {
        years.push(text);
      }
    });
    
    // Helper to get value from row by label
    const getRowValues = (label: string) => {
      const row = table.find('tr').filter((_, r) => {
        return $(r).find('td').first().text().trim() === label;
      }).first();
      
      const values: { [key: string]: number } = {};
      if (row.length) {
        row.find('td').slice(1).each((idx, cell) => {
          if (idx < years.length) {
            const val = $(cell).text().replace(/,/g, '').trim();
            values[years[idx]] = parseFloat(val) || 0;
          }
        });
      }
      return values;
    };
    
    // Extract key metrics from Balance Sheet
    balanceSheet.equityCapital = getRowValues('Equity Capital');
    balanceSheet.reserves = getRowValues('Reserves');
    balanceSheet.borrowings = getRowValues('Borrowings');
    balanceSheet.otherLiabilities = getRowValues('Other Liabilities');
    balanceSheet.totalLiabilities = getRowValues('Total Liabilities');
    balanceSheet.fixedAssets = getRowValues('Fixed Assets');
    balanceSheet.cwip = getRowValues('CWIP'); // Capital Work in Progress
    balanceSheet.investments = getRowValues('Investments');
    balanceSheet.otherAssets = getRowValues('Other Assets');
    balanceSheet.totalAssets = getRowValues('Total Assets');
    
    console.log('✅ HTML Balance sheet extracted:', years.length, 'years');
  } catch (error) {
    console.error('❌ Error parsing HTML balance sheet:', error);
  }
  
  return balanceSheet;
}

function parseHTMLCompoundedGrowth($: cheerio.CheerioAPI) {
  const growth: any = {};
  
  try {
    // Find compounded growth sections in Profit & Loss (search inside section!)
    const section = $('section#profit-loss, #profit-loss');
    const text = section.text();
    
    // Sales CAGR - Match specifically within "Compounded Sales Growth" section
    const salesSection = text.match(/Compounded Sales Growth[\s\S]*?(?=Compounded Profit Growth|Stock Price CAGR|Return on Equity|$)/i);
    if (salesSection) {
      const salesText = salesSection[0];
      
      const sales5YMatch = salesText.match(/5 Years:\s*([-\d,\.]+)%/i);
      if (sales5YMatch) {
        growth.sales5Y = parseFloat(sales5YMatch[1].replace(/,/g, ''));
      }
      
      const sales3YMatch = salesText.match(/3 Years:\s*([-\d,\.]+)%/i);
      if (sales3YMatch) {
        growth.sales3Y = parseFloat(sales3YMatch[1].replace(/,/g, ''));
      }
      
      const sales10YMatch = salesText.match(/10 Years:\s*([-\d,\.]+)%/i);
      if (sales10YMatch) {
        growth.sales10Y = parseFloat(sales10YMatch[1].replace(/,/g, ''));
      }
    }
    
    // Profit CAGR - Match specifically within "Compounded Profit Growth" section
    const profitSection = text.match(/Compounded Profit Growth[\s\S]*?(?=Stock Price CAGR|Return on Equity|$)/i);
    if (profitSection) {
      const profitText = profitSection[0];
      
      const profit5YMatch = profitText.match(/5 Years:\s*([-\d,\.]+)%/i);
      if (profit5YMatch) {
        growth.profit5Y = parseFloat(profit5YMatch[1].replace(/,/g, ''));
      }
      
      const profit3YMatch = profitText.match(/3 Years:\s*([-\d,\.]+)%/i);
      if (profit3YMatch) {
        growth.profit3Y = parseFloat(profit3YMatch[1].replace(/,/g, ''));
      }
      
      const profit10YMatch = profitText.match(/10 Years:\s*([-\d,\.]+)%/i);
      if (profit10YMatch) {
        growth.profit10Y = parseFloat(profit10YMatch[1].replace(/,/g, ''));
      }
    }
    
    // ROE - Match specifically within "Return on Equity" section
    const roeSection = text.match(/Return on Equity[\s\S]*?(?=Stock Price CAGR|Compounded|$)/i);
    if (roeSection) {
      const roeText = roeSection[0];
      
      const roe5YMatch = roeText.match(/5 Years:\s*([-\d,\.]+)%/i);
      if (roe5YMatch) {
        growth.roe5Y = parseFloat(roe5YMatch[1].replace(/,/g, ''));
      }
      
      const roe3YMatch = roeText.match(/3 Years:\s*([-\d,\.]+)%/i);
      if (roe3YMatch) {
        growth.roe3Y = parseFloat(roe3YMatch[1].replace(/,/g, ''));
      }
      
      const roe10YMatch = roeText.match(/10 Years:\s*([-\d,\.]+)%/i);
      if (roe10YMatch) {
        growth.roe10Y = parseFloat(roe10YMatch[1].replace(/,/g, ''));
      }
    }
    
    console.log('✅ HTML Compounded growth extracted:', growth);
  } catch (error) {
    console.error('❌ Error parsing HTML compounded growth:', error);
  }
  
  return growth;
}

function parseHTMLCompetitors($: cheerio.CheerioAPI) {
  const competitors: any[] = [];
  
  try {
    // Find peer comparison table (search inside section, not parent!)
    const section = $('section#peers, #peers');
    const table = section.find('table').first();
    
    if (table.length === 0) {
      console.log('  ℹ️ No #peers table found in static HTML');
      return competitors;
    }
    
    // Parse each row (skip searched company at index 0)
    table.find('tbody tr').slice(1).each((idx, row) => {
      if (idx >= 6) return; // Extract 6 competitors (to match Puppeteer)
      
      const cells = $(row).find('td');
      const nameCell = cells.eq(1);
      const link = nameCell.find('a').attr('href');
      
      if (link) {
        const symbolMatch = link.match(/\/company\/([^\/]+)/);
        if (symbolMatch) {
          const name = nameCell.text().trim();
          competitors.push({
            symbol: symbolMatch[1],
            name: name || symbolMatch[1],
          });
        }
      }
    });
    
    console.log(`  ✅ Cheerio fallback extracted ${competitors.length} competitors from static HTML`);
  } catch (error) {
    console.warn('  ⚠️ Error parsing HTML competitors:', error);
  }
  
  return competitors;
}

