import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  resolveStockSymbol,
  fetchStockQuote,
  fetchStockFundamentals,
  fetchHistoricalData,
  fetchStockNews,
  fetchCompetitorsFromScreener,
  fetchCompetitorsFromYahoo,
  fetchCompetitorsFromFinnhub,
} from '@/lib/stockApi';
import {
  calculateTechnicalIndicators,
  findSupportResistance,
} from '@/lib/technicalAnalysis';
import { 
  getIndustryInsights, 
  compareWithCompetitors,
  scoreStock,
  analyzeSector,
  identifyBestInvestmentOpportunity,
  CompetitorAnalysis,
  SectorRanking,
  BestInvestmentAnalysis
} from '@/lib/aiAnalysis';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const analyzeCompetitorsParam = searchParams.get('analyzeCompetitors');
  const shouldAnalyzeCompetitors = analyzeCompetitorsParam === 'true';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // Smart symbol resolution for Indian NSE stocks
    const result = await resolveStockSymbol(symbol);
    
    if (!result.symbol) {
      let errorMessage = `Stock "${symbol}" not found on NSE.`;
      
      if (result.suggestions && result.suggestions.length > 0) {
        const suggestionText = result.suggestions
          .map(s => `${s.symbol} (${s.name})`)
          .join(', ');
        errorMessage += `\n\nDid you mean: ${suggestionText}?`;
      } else {
        errorMessage += '\n\nTry searching by company name (e.g., "HDFC Bank", "Reliance Industries", "Tata Motors")';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          suggestions: result.suggestions || []
        },
        { status: 404 }
      );
    }

    const resolvedSymbol = result.symbol;

    // Fetch all data in parallel using the resolved symbol
    const [quote, fundamentals, historicalData, news] = await Promise.all([
      fetchStockQuote(resolvedSymbol),
      fetchStockFundamentals(resolvedSymbol),
      fetchHistoricalData(resolvedSymbol, '1y'),
      fetchStockNews(resolvedSymbol),
    ]);

    if (!quote) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // Calculate technical indicators
    const technicalIndicators = calculateTechnicalIndicators(historicalData);
    const { support, resistance } = findSupportResistance(historicalData);

    // Try to get competitors from APIs first (more reliable than AI)
    let competitorSymbols: string[] = [];
    
    // Priority 1: Try Screener.in (most reliable for NSE stocks)
    const screenerCompetitors = await fetchCompetitorsFromScreener(resolvedSymbol);
    if (screenerCompetitors.length > 0) {
      console.log('✅ Using competitors from Screener.in:', screenerCompetitors.length);
      competitorSymbols = screenerCompetitors;
    }
    
    // Priority 2: If Screener failed, try Yahoo Finance
    if (competitorSymbols.length === 0) {
      const yahooCompetitors = await fetchCompetitorsFromYahoo(resolvedSymbol);
      if (yahooCompetitors.length > 0) {
        console.log('Using competitors from Yahoo Finance:', yahooCompetitors);
        competitorSymbols = yahooCompetitors;
      }
    }
    
    // Priority 3: If both failed, try Finnhub
    if (competitorSymbols.length === 0) {
      const finnhubCompetitors = await fetchCompetitorsFromFinnhub(resolvedSymbol);
      if (finnhubCompetitors.length > 0) {
        console.log('Using competitors from Finnhub:', finnhubCompetitors);
        competitorSymbols = finnhubCompetitors;
      }
    }
    
    // Priority 4: If all APIs failed, AI will handle it as fallback

    // Get industry insights and competitors (uses API competitors if available, otherwise AI)
    const industryInsights = await getIndustryInsights(
      quote.symbol,
      quote.name,
      fundamentals?.sector || null,
      fundamentals?.industry || null,
      competitorSymbols
    );

    // Get competitor comparison if we have competitors
    let competitorComparison = null;
    if (industryInsights && industryInsights.competitors.length > 0) {
      competitorComparison = await compareWithCompetitors(
        quote.symbol,
        fundamentals,
        industryInsights.competitors
      );
    }

    // Comprehensive sector ranking with scores (if requested)
    let sectorRanking: SectorRanking | null = null;
    if (shouldAnalyzeCompetitors && industryInsights && industryInsights.competitors.length > 0) {
      try {
        // Score the main stock
        const mainScore = await scoreStock(
          quote.symbol,
          quote.name,
          quote,
          fundamentals,
          technicalIndicators,
          support,
          resistance
        );

        const mainAnalysis: CompetitorAnalysis = {
          symbol: quote.symbol,
          name: quote.name,
          currentPrice: quote.price,
          score: mainScore,
          fundamentals: {
            peRatio: fundamentals?.peRatio || undefined,
            pbRatio: fundamentals?.pbRatio || undefined,
            roe: fundamentals?.roe || undefined,
            eps: fundamentals?.eps || undefined,
            debtToEquity: fundamentals?.debtToEquity || undefined,
            dividendYield: fundamentals?.dividendYield || undefined,
            fiftyTwoWeekHigh: fundamentals?.fiftyTwoWeekHigh || undefined,
            fiftyTwoWeekLow: fundamentals?.fiftyTwoWeekLow || undefined,
          },
          technicals: {
            rsi: technicalIndicators.rsi || undefined,
            trend: technicalIndicators.sma20 && technicalIndicators.sma50
              ? technicalIndicators.sma20 > technicalIndicators.sma50 ? 'Uptrend' : 'Downtrend'
              : 'Neutral',
          },
          support,
          resistance,
        };

        // Score all competitors
        const competitorAnalyses: CompetitorAnalysis[] = [];
        
        // Process ALL competitors, no limit
        for (const competitor of industryInsights.competitors) {
          try {
            const compSymbol = competitor.symbol.includes('.NS') 
              ? competitor.symbol 
              : `${competitor.symbol}.NS`;
            
            const [compQuote, compFundamentals, compHistorical] = await Promise.all([
              fetchStockQuote(compSymbol),
              fetchStockFundamentals(compSymbol),
              fetchHistoricalData(compSymbol, '1y'),
            ]);

            if (compQuote) {
              const compTechnicals = calculateTechnicalIndicators(compHistorical);
              const { support: compSupport, resistance: compResistance } = findSupportResistance(compHistorical);
              
              const compScore = await scoreStock(
                compQuote.symbol,
                compQuote.name,
                compQuote,
                compFundamentals,
                compTechnicals,
                compSupport,
                compResistance
              );

              competitorAnalyses.push({
                symbol: compQuote.symbol,
                name: compQuote.name,
                currentPrice: compQuote.price,
                score: compScore,
                fundamentals: {
                  peRatio: compFundamentals?.peRatio || undefined,
                  pbRatio: compFundamentals?.pbRatio || undefined,
                  roe: compFundamentals?.roe || undefined,
                  eps: compFundamentals?.eps || undefined,
                  debtToEquity: compFundamentals?.debtToEquity || undefined,
                  dividendYield: compFundamentals?.dividendYield || undefined,
                  fiftyTwoWeekHigh: compFundamentals?.fiftyTwoWeekHigh || undefined,
                  fiftyTwoWeekLow: compFundamentals?.fiftyTwoWeekLow || undefined,
                },
                technicals: {
                  rsi: compTechnicals.rsi || undefined,
                  trend: compTechnicals.sma20 && compTechnicals.sma50
                    ? compTechnicals.sma20 > compTechnicals.sma50 ? 'Uptrend' : 'Downtrend'
                    : 'Neutral',
                },
                support: compSupport,
                resistance: compResistance,
              });
            }
          } catch (error) {
            console.error(`Error analyzing competitor ${competitor.symbol}:`, error);
          }
        }

        // Get AI recommendation on best pick
        const allAnalyses = [mainAnalysis, ...competitorAnalyses];
        const bestPickAnalysis = allAnalyses.reduce((best, current) => 
          current.score.score > best.score.score ? current : best
        );

        const recommendation = await analyzeSector(
          quote.symbol,
          industryInsights.competitors,
          bestPickAnalysis.symbol
        );

        // Get comprehensive investment analysis with explicit fundamental & technical criteria
        let bestInvestmentAnalysis: BestInvestmentAnalysis | null = null;
        let finalBestPickData: CompetitorAnalysis | null = null;
        
        try {
          bestInvestmentAnalysis = await identifyBestInvestmentOpportunity(
            allAnalyses,
            industryInsights.sector
          );
          console.log('✅ AI Best investment pick:', bestInvestmentAnalysis.bestPick);
          
          // Find the actual data for the AI's recommended best pick
          finalBestPickData = allAnalyses.find(
            a => a.symbol === bestInvestmentAnalysis!.bestPick || 
                 a.symbol === bestInvestmentAnalysis!.bestPick + '.NS' ||
                 a.symbol.replace('.NS', '') === bestInvestmentAnalysis!.bestPick
          ) || null;
          
          if (finalBestPickData) {
            console.log('✅ Found best pick data:', finalBestPickData.name, 'Price:', finalBestPickData.currentPrice);
          } else {
            console.warn('⚠️ Could not find data for best pick:', bestInvestmentAnalysis.bestPick);
            // Fallback to highest scored
            finalBestPickData = bestPickAnalysis;
          }
        } catch (error) {
          console.error('Error in best investment analysis:', error);
          // Fallback to highest scored
          finalBestPickData = bestPickAnalysis;
        }

        sectorRanking = {
          mainStock: mainAnalysis,
          competitors: competitorAnalyses.sort((a, b) => b.score.score - a.score.score),
          bestPick: finalBestPickData?.symbol || bestPickAnalysis.symbol,
          recommendation,
        };

        // Attach detailed investment analysis and best pick's full data to sectorRanking
        if (bestInvestmentAnalysis && finalBestPickData) {
          (sectorRanking as any).bestInvestmentAnalysis = bestInvestmentAnalysis;
          (sectorRanking as any).bestPickData = finalBestPickData; // Use AI's recommended pick data
          console.log('📊 Best pick final data:', {
            symbol: finalBestPickData.symbol,
            name: finalBestPickData.name,
            price: finalBestPickData.currentPrice,
            score: finalBestPickData.score.score,
            peRatio: finalBestPickData.fundamentals.peRatio,
            fiftyTwoWeekHigh: finalBestPickData.fundamentals.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: finalBestPickData.fundamentals.fiftyTwoWeekLow,
          });
        }
      } catch (error) {
        console.error('Error in sector ranking:', error);
      }
    }

    return NextResponse.json({
      quote,
      fundamentals,
      technicalIndicators,
      support,
      resistance,
      industryInsights,
      competitorComparison,
      sectorRanking,
      historicalData: historicalData.slice(-90), // Last 90 days for chart
      news,
    });
  } catch (error) {
    console.error('Error analyzing stock:', error);
    return NextResponse.json(
      { error: 'Failed to analyze stock' },
      { status: 500 }
    );
  }
}
