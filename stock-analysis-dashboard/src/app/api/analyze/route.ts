import { NextResponse } from 'next/server';
import {
  fetchStockQuote,
  fetchComprehensiveDataFromScreener,
  fetchHistoricalData,
  fetchPriceReturns,
} from '@/lib/stockApi';
import { calculateTechnicalIndicators, findSupportResistance } from '@/lib/technicalAnalysis';
import { getInvestmentRecommendation, analyzeMultipleStocks } from '@/lib/investmentAnalysis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const mode = searchParams.get('mode'); // 'batch' for competitor comparison

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // Ensure .NS suffix for Indian stocks
    const nseSymbol = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;

    console.log(`\n🔍 Analyzing stock: ${nseSymbol} (mode: ${mode || 'single'})`);

    // BATCH MODE: Analyze searched stock + all competitors
    if (mode === 'batch') {
      return await analyzeBatchStocks(nseSymbol);
    }

    // SINGLE MODE: Original detailed analysis
    return await analyzeSingleStock(nseSymbol);
  } catch (error: any) {
    console.error('Error analyzing stock:', error);
    return NextResponse.json(
      { error: 'Failed to analyze stock. Please try again.' },
      { status: 500 }
    );
  }
}

// Batch analysis: Search stock + all competitors
async function analyzeBatchStocks(nseSymbol: string) {
  console.log('📊 BATCH MODE: Fetching stock + competitors...');
  
  // 1. Fetch searched stock quote
  const quote = await fetchStockQuote(nseSymbol);
  if (!quote) {
    return NextResponse.json(
      { error: 'Stock not found. Please check the symbol and try again.' },
      { status: 404 }
    );
  }

  console.log(`✅ Quote fetched: ${quote.name} @ ₹${quote.price}`);

  // 2. Fetch comprehensive data for searched stock
  const screenerData = await fetchComprehensiveDataFromScreener(nseSymbol);
  
  // Handle case when Screener.in data is unavailable
  if (!screenerData) {
    console.warn('⚠️ Screener.in data unavailable - analyzing with basic quote data only');
    
    // Return just the searched stock with basic data
    const basicStock = {
      symbol: nseSymbol,
      companyName: quote.name,
      currentPrice: quote.price,
      fundamentals: {},
      compoundedGrowth: {},
      shareholding: {},
      quarterlyResults: [],
      technicals: {},
    };
    
    const recommendations = await analyzeMultipleStocks([basicStock]);
    
    return NextResponse.json({
      mode: 'batch',
      searchedStock: nseSymbol,
      totalStocks: 1,
      recommendations,
      warning: 'Limited data available - Screener.in service unavailable. Analysis based on basic quote data only.',
    });
  }

  // 3. Build searched stock object
  console.log('📈 Fetching price returns and technical indicators...');
  const priceReturns = await fetchPriceReturns(nseSymbol, quote.price);
  
  const searchedStock = {
    symbol: nseSymbol,
    companyName: quote.name,
    currentPrice: quote.price,
    fundamentals: screenerData.fundamentals,
    compoundedGrowth: screenerData.compoundedGrowth,
    shareholding: screenerData.shareholding,
    quarterlyResults: screenerData.quarterlyResults,
    annualResults: screenerData.annualResults,
    cashFlow: screenerData.cashFlow,
    balanceSheet: screenerData.balanceSheet,
    priceReturns: priceReturns, // Add price returns for momentum
    technicals: priceReturns.technicals, // Technical indicators from same historical data
    competitors: screenerData.competitors, // For market share analysis
  };

  // 4. Get competitors list and fetch their data
  const competitors = screenerData.competitors || [];
  
  // Remove searched stock from competitors to avoid duplicates
  const baseSearchSymbol = nseSymbol.replace('.NS', '').toUpperCase();
  const filteredCompetitors = competitors.filter((comp: any) => {
    // Competitors are now objects: { symbol, name }
    const compSymbol = typeof comp === 'string' ? comp : comp.symbol;
    const baseComp = compSymbol.replace('.NS', '').toUpperCase();
    return baseComp !== baseSearchSymbol;
  });
  
  // Extract just the symbols for fetching
  const competitorSymbols = filteredCompetitors.map((comp: any) => 
    typeof comp === 'string' ? comp : comp.symbol
  );
  
  console.log(`📋 Found ${competitorSymbols.length} unique competitors: ${competitorSymbols.join(', ')}`);

  const allStocks = [searchedStock];

  // Fetch data for each competitor (limit to first 5 to avoid timeout)
  const competitorsToFetch = competitorSymbols.slice(0, 5);
  
  for (const competitorSymbol of competitorsToFetch) {
    try {
      // competitorSymbol is now a string
      if (!competitorSymbol) {
        console.log('⚠️ Skipping undefined competitor');
        continue;
      }
      
      const compSymbol = competitorSymbol.endsWith('.NS') ? competitorSymbol : `${competitorSymbol}.NS`;
      
      console.log(`🔄 Fetching data for competitor: ${compSymbol}`);
      
      const compQuote = await fetchStockQuote(compSymbol);
      const compScreenerData = await fetchComprehensiveDataFromScreener(compSymbol);
      const compPriceReturns = await fetchPriceReturns(compSymbol, compQuote?.price || 0);
      
      if (compQuote && compScreenerData) {
        allStocks.push({
          symbol: compSymbol,
          companyName: compQuote.name,
          currentPrice: compQuote.price,
          fundamentals: compScreenerData.fundamentals,
          compoundedGrowth: compScreenerData.compoundedGrowth,
          shareholding: compScreenerData.shareholding,
          quarterlyResults: compScreenerData.quarterlyResults,
          annualResults: compScreenerData.annualResults,
          cashFlow: compScreenerData.cashFlow,
          balanceSheet: compScreenerData.balanceSheet,
          priceReturns: compPriceReturns, // Add price returns for momentum
          technicals: compPriceReturns.technicals, // Technical indicators from same historical data
          competitors: compScreenerData.competitors, // For market share analysis
        });
        console.log(`✅ Added ${compQuote.name}`);
      } else {
        console.log(`⚠️ Skipping ${compSymbol} - data unavailable`);
      }
    } catch (error) {
      console.error(`❌ Error fetching competitor ${competitorSymbol}:`, error);
      // Continue with other competitors
    }
  }

  console.log(`\n📊 Total stocks to analyze: ${allStocks.length}`);

  // 5. Analyze all stocks together
  console.log('🤖 Analyzing all stocks with AI...');
  const recommendations = await analyzeMultipleStocks(allStocks);

  console.log(`✅ Batch analysis complete! ${recommendations.length} recommendations generated`);

  // 6. Return results
  return NextResponse.json({
    mode: 'batch',
    searchedStock: searchedStock.symbol,
    totalStocks: allStocks.length,
    recommendations,
  });
}

// Single stock detailed analysis (original)
async function analyzeSingleStock(nseSymbol: string) {
  // 1. Fetch current quote
  const quote = await fetchStockQuote(nseSymbol);
  if (!quote) {
    return NextResponse.json(
      { error: 'Stock not found. Please check the symbol and try again.' },
      { status: 404 }
    );
  }

  console.log(`✅ Quote fetched: ${quote.name} @ ₹${quote.price}`);

  // 2. Fetch comprehensive data from Screener.in
  console.log('📊 Fetching comprehensive data from Screener.in...');
  const screenerData = await fetchComprehensiveDataFromScreener(nseSymbol);

  // 3. Fetch historical data for technical analysis
  console.log('📈 Fetching historical data...');
  const historicalData = await fetchHistoricalData(nseSymbol, '3mo');

  // 4. Calculate technical indicators
  const technicalIndicators = calculateTechnicalIndicators(historicalData);
  const { support, resistance } = findSupportResistance(historicalData);

  // 5. Prepare data for AI analysis
  const analysisData = {
    symbol: nseSymbol,
    companyName: quote.name,
    currentPrice: quote.price,
    fundamentals: screenerData?.fundamentals || {},
    quarterlyResults: screenerData?.quarterlyResults || [],
    compoundedGrowth: screenerData?.compoundedGrowth || {},
    cashFlow: screenerData?.cashFlow || {},
    shareholding: screenerData?.shareholding || {},
    technicals: technicalIndicators,
    competitors: screenerData?.competitors || [],
  };

  // 6. Get AI-powered investment recommendation
  console.log('🤖 Generating investment recommendation...');
  const recommendation = await getInvestmentRecommendation(analysisData);

  console.log(`\n✅ Analysis complete! Recommendation: ${recommendation.action}`);

  // 7. Return comprehensive analysis
  return NextResponse.json({
    quote,
    fundamentals: screenerData?.fundamentals || {},
    quarterlyResults: screenerData?.quarterlyResults || [],
    annualResults: screenerData?.annualResults || [],
    cashFlow: screenerData?.cashFlow || {},
    shareholding: screenerData?.shareholding || {},
    compoundedGrowth: screenerData?.compoundedGrowth || {},
    competitors: screenerData?.competitors || [],
    technicalIndicators,
    historicalData,
    support,
    resistance,
    recommendation,
  });
}
