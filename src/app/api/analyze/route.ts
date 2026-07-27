import { NextResponse } from 'next/server';
import {
  fetchStockQuote,
  fetchComprehensiveDataFromScreener,
  fetchPriceReturns,
} from '@/lib/stockApi';
import { analyzeMultipleStocks } from '@/lib/investmentAnalysis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  const mode = searchParams.get('mode');

  if (!symbols) {
    return NextResponse.json({ error: 'Symbols parameter required' }, { status: 400 });
  }

  try {
    // BATCH MODE: Analyze multiple user-selected stocks
    if (mode === 'batch') {
      const stockSymbols = symbols.split(',').map(s => s.trim()).filter(Boolean);
      return await analyzeMultipleUserStocks(stockSymbols);
    }

    return NextResponse.json({ error: 'Invalid request - mode=batch required' }, { status: 400 });
  } catch (error: any) {
    console.error('Error analyzing stock:', error);
    return NextResponse.json(
      { error: 'Failed to analyze stock. Please try again.' },
      { status: 500 }
    );
  }
}

// Analyze multiple user-selected stocks (no auto-competitor detection)
async function analyzeMultipleUserStocks(stockSymbols: string[]) {
  console.log(`\n📊 BATCH MODE: Analyzing ${stockSymbols.length} user-selected stocks...`);
  
  const allStocks = [];
  const failedStocks: string[] = [];

  for (const symbol of stockSymbols) {
    try {
      // Ensure .NS suffix
      const nseSymbol = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;
      console.log(`\n🔄 Fetching data for: ${nseSymbol}`);

      // Fetch quote
      const quote = await fetchStockQuote(nseSymbol);
      if (!quote) {
        console.warn(`⚠️ Quote not found for ${nseSymbol}`);
        failedStocks.push(symbol);
        continue;
      }

      console.log(`✅ Quote: ${quote.name} @ ₹${quote.price}`);

      // Fetch comprehensive data
      const screenerData = await fetchComprehensiveDataFromScreener(nseSymbol);
      const priceReturns = await fetchPriceReturns(nseSymbol, quote.price);

      if (screenerData) {
        allStocks.push({
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
          priceReturns: priceReturns,
          technicals: priceReturns.technicals,
        });
        console.log(`✅ Added ${quote.name} to analysis`);
      } else {
        // Fallback to basic quote data if Screener.in fails
        allStocks.push({
          symbol: nseSymbol,
          companyName: quote.name,
          currentPrice: quote.price,
          fundamentals: {},
          compoundedGrowth: {},
          shareholding: {},
          quarterlyResults: [],
          technicals: {},
        });
        console.log(`⚠️ Using basic data for ${quote.name} (Screener.in unavailable)`);
      }
    } catch (error: any) {
      console.error(`❌ Error fetching ${symbol}:`, error.message);
      failedStocks.push(symbol);
    }
  }

  if (allStocks.length === 0) {
    return NextResponse.json(
      { error: 'Could not fetch data for any of the selected stocks' },
      { status: 404 }
    );
  }

  console.log(`\n📊 Successfully fetched ${allStocks.length}/${stockSymbols.length} stocks`);

  // Analyze all stocks
  console.log('🤖 Generating investment recommendations...');
  const recommendations = await analyzeMultipleStocks(allStocks);

  console.log(`✅ Analysis complete! ${recommendations.length} recommendations generated`);

  // Build response
  const response: any = {
    mode: 'batch',
    totalStocks: allStocks.length,
    recommendations,
  };

  // Add warning if some stocks failed
  if (failedStocks.length > 0) {
    response.warning = `Could not fetch data for: ${failedStocks.join(', ')}`;
  }

  return NextResponse.json(response);
}
