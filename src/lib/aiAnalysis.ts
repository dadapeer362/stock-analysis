import Groq from 'groq-sdk';
import { StockQuote, StockFundamentals } from './stockApi';
import { TechnicalIndicators } from './technicalAnalysis';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface CompetitorInfo {
  name: string;
  symbol: string;
  sector: string;
  description: string;
}

export interface IndustryInsights {
  sector: string;
  industryPE: string;
  industryAvgROE: string;
  industryTrends: string[];
  competitors: CompetitorInfo[];
  faceValue: string;
}

export interface ComparisonAnalysis {
  comparisonSummary: string;
  strengths: string[];
  weaknesses: string[];
  relativePricing: string;
}

export interface GrowthProjection {
  sixMonths: string;
  oneYear: string;
  threeYears: string;
  fiveYears: string;
  rationale: string;
}

export interface StockScore {
  score: number; // 0-100
  explanation: string;
  fundamentalScore: number; // 0-40 points
  technicalScore: number; // 0-30 points
  valuationScore: number; // 0-30 points
  factors: {
    positive: string[];
    negative: string[];
  };
  entryPoint: string;
  targetPrice: string;
  growthProjection: GrowthProjection;
}

export interface CompetitorAnalysis {
  symbol: string;
  name: string;
  currentPrice: number;
  score: StockScore;
  fundamentals: {
    peRatio?: number;
    pbRatio?: number;
    roe?: number;
    eps?: number;
    debtToEquity?: number;
    dividendYield?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
  };
  technicals: {
    rsi?: number;
    trend: string;
  };
  support?: number[];
  resistance?: number[];
}

export interface SectorRanking {
  mainStock: CompetitorAnalysis;
  competitors: CompetitorAnalysis[];
  bestPick: string; // Symbol of best investment
  recommendation: string; // Overall sector recommendation
}

// Best investment analysis with detailed reasoning
export interface BestInvestmentAnalysis {
  bestPick: string; // Symbol of recommended stock
  bestPickName: string;
  recommendation: string; // Detailed explanation
  fundamentalReasoning: string; // Why fundamentals are strong
  technicalReasoning: string; // Why technicals support entry
  riskFactors: string[]; // Key risks to watch
  currentMarketContext: string; // Assessment of July 2026 market conditions
  timingAdvice: string; // When to enter (now, wait for dip, etc.)
}

// Get industry insights and competitors using AI
export async function getIndustryInsights(
  symbol: string,
  companyName: string,
  actualSector: string | null,
  actualIndustry: string | null,
  apiCompetitors: string[] = []
): Promise<IndustryInsights | null> {
  // If we have competitors from API, use them directly
  if (apiCompetitors.length > 0) {
    console.log(`Using ${apiCompetitors.length} competitors from API for ${symbol}`);
    
    // Create competitor info from API symbols
    const competitors: CompetitorInfo[] = apiCompetitors.map(sym => ({
      name: sym.replace('.NS', ''),
      symbol: sym.replace('.NS', ''),
      sector: actualSector || 'Unknown',
      description: 'Direct competitor'
    }));

    // Still use AI for sector insights, but with API competitors
    const sectorInfo = actualSector || actualIndustry ? 
      `\n\nSECTOR: ${actualSector || actualIndustry}` : '';
    
    const prompt = `You are a financial analyst. Provide market insights for the ${actualSector || actualIndustry || 'sector'} sector in India.

Provide JSON format:
{
  "sector": "${actualSector || 'Unknown'}",
  "industryPE": "<typical PE ratio range for this sector>",
  "industryAvgROE": "<typical ROE% range>",
  "industryTrends": ["<trend 1>", "<trend 2>", "<trend 3>"],
  "faceValue": "₹10"
}`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert on Indian stock markets. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 1000,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      const insights = JSON.parse(jsonText);

      return {
        ...insights,
        competitors, // Use API competitors
      };
    } catch (error) {
      console.log('Error getting sector insights from AI, using defaults');
      return {
        sector: actualSector || 'Unknown',
        industryPE: 'N/A',
        industryAvgROE: 'N/A',
        industryTrends: [],
        competitors,
        faceValue: '₹10',
      };
    }
  }

  // Fallback to AI if no API competitors
  const sectorInfo = actualSector || actualIndustry ? 
    `\n\nACTUAL SECTOR/INDUSTRY INFO FROM STOCK EXCHANGE:\n- Sector: ${actualSector || 'Unknown'}\n- Industry: ${actualIndustry || 'Unknown'}\n\nUse this information to identify ALL major competitors in the SAME sector/industry.` : 
    '\n\nNote: Sector info not available from exchange. Carefully analyze what business this company is actually in.';
    
  const prompt = `You are a financial analyst expert on Indian stock markets. Analyze ${companyName} (${symbol}) and identify ALL major competitors in the same business.${sectorInfo}

CRITICAL INSTRUCTIONS:
1. Understand what ${companyName} ACTUALLY does (its core business)
2. List ALL major NSE-listed competitors in the SAME specific business category - DO NOT LIMIT, list as many as exist
3. For 2-Wheeler/Electric Scooter companies (Ola Electric, Ather Energy):
   ✅ INCLUDE: BAJAJ-AUTO, EICHERMOT, TVSMOTOR, HEROMOTOCO (all make 2-wheelers)
   ❌ EXCLUDE: M&M (Mahindra makes 4-wheelers/SUVs, NOT 2-wheelers)
4. For banks → List ALL major private banks: HDFCBANK, ICICIBANK, KOTAKBANK, AXISBANK, INDUSINDBK, etc.
5. For IT → List ALL major IT companies: TCS, INFY, WIPRO, HCLTECH, TECHM, LTIM, etc.
6. Be VERY SPECIFIC about sub-sector (e.g., "2/3 Wheelers & Electric Scooters" not "Automobiles")
7. List ALL NSE-listed competitors in the exact same category - aim for 8-15 if available

EXAMPLES OF CORRECT COMPETITOR IDENTIFICATION:
- Ola Electric/Ather Energy (2-wheelers) → BAJAJ-AUTO, TVSMOTOR, HEROMOTOCO, EICHERMOT (NOT M&M - that's 4-wheelers)
- HDFC Bank → ICICIBANK, AXISBANK, KOTAKBANK, INDUSINDBK, FEDERALBNK, BANDHANBNK
- TCS → INFY, WIPRO, HCLTECH, TECHM, LTIM, PERSISTENT, COFORGE
- Maruti Suzuki (4-wheelers) → TATAMOTORS, M&M, MSIL (NOT Bajaj/Hero - those are 2-wheelers)

Provide the following information in JSON format:
{
  "sector": "<VERY SPECIFIC sector, e.g., 'Private Banking', 'IT Services', '2/3 Wheelers & Electric Scooters', 'Pharmaceuticals'>",
  "industryPE": "<typical PE ratio range for this specific sector in India>",
  "industryAvgROE": "<typical ROE% range for this specific sector>",
  "industryTrends": ["<trend 1>", "<trend 2>", "<trend 3>"],
  "competitors": [
    {"name": "<Company Name>", "symbol": "<NSE symbol WITHOUT .NS>", "sector": "<sector>", "description": "<brief description>"},
    {"name": "<Company Name>", "symbol": "<NSE symbol WITHOUT .NS>", "sector": "<sector>", "description": "<brief description>"},
    {"name": "<Company Name>", "symbol": "<NSE symbol WITHOUT .NS>", "sector": "<sector>", "description": "<brief description>"},
    {"name": "<Company Name>", "symbol": "<NSE symbol WITHOUT .NS>", "sector": "<sector>", "description": "<brief description>"},
    {"name": "<Company Name>", "symbol": "<NSE symbol WITHOUT .NS>", "sector": "<sector>", "description": "<brief description>"},
    {"name": "<Company Name>", "symbol": "<NSE symbol WITHOUT .NS>", "sector": "<sector>", "description": "<brief description>"},
    {"name": "<Company Name>", "symbol": "<NSE symbol WITHOUT .NS>", "sector": "<sector>", "description": "<brief description>"},
    {"name": "<Company Name>", "symbol": "<NSE symbol WITHOUT .NS>", "sector": "<sector>", "description": "<brief description>"}
  ],
  "faceValue": "<typical face value, usually ₹1, ₹2, ₹5, or ₹10>"
}

List ALL major NSE-listed competitors who compete DIRECTLY with ${companyName} in the same product category.
DO NOT LIMIT - if there are 10-15 competitors, list them all.
Use exact NSE ticker symbols (e.g., HDFCBANK, ICICIBANK, TCS, INFY, BAJAJ-AUTO, TVSMOTOR, HEROMOTOCO).

REMEMBER: For 2-wheeler companies, NEVER include M&M (it makes cars/SUVs, not bikes/scooters).`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert on Indian stock markets and sectors. Always respond with valid JSON only. List ALL major NSE-listed competitors (8-15 if available), NOT just 5. Pay CRITICAL attention to sub-sectors: Ola Electric and Ather Energy make 2-wheelers/scooters - their competitors are BAJAJ-AUTO, TVSMOTOR, HEROMOTOCO, EICHERMOT. NEVER include M&M for 2-wheeler companies (M&M makes 4-wheelers/SUVs like Scorpio, Thar - completely different market). Be comprehensive and accurate.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 3000, // Increased to allow listing all competitors (8-15)
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;
    
    const insights: IndustryInsights = JSON.parse(jsonText);
    return insights;
  } catch (error) {
    console.error('Error getting industry insights:', error);
    return null;
  }
}

// Compare stock with competitors using AI
export async function compareWithCompetitors(
  symbol: string,
  fundamentals: StockFundamentals | null,
  competitors: CompetitorInfo[]
): Promise<ComparisonAnalysis | null> {
  if (!fundamentals || competitors.length === 0) return null;

  const competitorList = competitors.map(c => c.name).join(', ');
  
  const prompt = `You are a stock analyst. Compare ${symbol} with its competitors: ${competitorList}.

Current Stock Metrics for ${symbol}:
- P/E Ratio: ${fundamentals.peRatio?.toFixed(2) || 'N/A'}
- P/B Ratio: ${fundamentals.pbRatio?.toFixed(2) || 'N/A'}
- ROE: ${fundamentals.roe?.toFixed(2) || 'N/A'}%
- Debt/Equity: ${fundamentals.debtToEquity?.toFixed(2) || 'N/A'}
- Dividend Yield: ${fundamentals.dividendYield?.toFixed(2) || 'N/A'}%
- EPS: ₹${fundamentals.eps?.toFixed(2) || 'N/A'}
- Market Cap: ₹${fundamentals.marketCap ? (fundamentals.marketCap / 10000000).toFixed(2) : 'N/A'}Cr

Based on typical industry metrics and your knowledge of these companies, provide a comparison in JSON format:
{
  "comparisonSummary": "<2-3 sentence summary comparing with competitors>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "relativePricing": "<Is the stock overvalued, undervalued, or fairly priced compared to peers?>"
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert stock analyst. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;
    
    const comparison: ComparisonAnalysis = JSON.parse(jsonText);
    return comparison;
  } catch (error) {
    console.error('Error comparing with competitors:', error);
    return null;
  }
}

// Score a stock comprehensively (0-100) based on fundamentals, technicals, and valuation
export async function scoreStock(
  symbol: string,
  companyName: string,
  quote: StockQuote,
  fundamentals: StockFundamentals | null,
  technicalIndicators: TechnicalIndicators,
  support: number[],
  resistance: number[]
): Promise<StockScore> {
  const prompt = `You are an objective stock analyst. Score ${companyName} (${symbol}) on a scale of 0-100.

IMPORTANT SCORING RULES:
1. If data is missing (N/A), assign neutral/average score for that category (don't penalize heavily)
2. Use realistic ranges: Most established companies should score 50-80
3. Reserve 80+ for exceptional companies, 40-50 for average, below 40 for concerning
4. Be consistent - same metrics = same score

SCORING BREAKDOWN:

**FUNDAMENTAL SCORE (40 points max):**
- P/E Ratio: 10-20 = good (30-35 pts), 20-30 = fair (20-25 pts), >40 = expensive (10-15 pts)
- ROE: >15% = excellent (30-35 pts), 10-15% = good (20-25 pts), <10% = average (10-15 pts)
- Debt/Equity: <1 = healthy (30-35 pts), 1-2 = acceptable (20-25 pts), >2 = risky (10-15 pts)
- EPS & Dividend: Positive = bonus points
- If fundamentals are N/A, assign 20-25 points (neutral)

**TECHNICAL SCORE (30 points max):**
- RSI: 40-60 = ideal (25-28 pts), 30-70 = acceptable (18-22 pts), <30 or >70 = extreme (10-15 pts)
- Trend: Price > SMA 50 & 200 = uptrend (25-28 pts), mixed = neutral (15-20 pts), downtrend (8-12 pts)
- If technicals are N/A, assign 15 points (neutral)

**VALUATION SCORE (30 points max):**
- Compare P/E and P/B to industry norms
- Undervalued = 25-28 pts, Fairly valued = 18-22 pts, Overvalued = 10-15 pts
- If valuation unclear, assign 15 points (neutral)

CURRENT DATA:
Price: ₹${quote.price.toFixed(2)}
Change: ${quote.changePercent.toFixed(2)}%

FUNDAMENTALS:
- P/E Ratio: ${fundamentals?.peRatio?.toFixed(2) || 'N/A'}
- P/B Ratio: ${fundamentals?.pbRatio?.toFixed(2) || 'N/A'}
- ROE: ${fundamentals?.roe?.toFixed(2) || 'N/A'}%
- EPS: ₹${fundamentals?.eps?.toFixed(2) || 'N/A'}
- Debt/Equity: ${fundamentals?.debtToEquity?.toFixed(2) || 'N/A'}
- Dividend Yield: ${fundamentals?.dividendYield?.toFixed(2) || 'N/A'}%
- Market Cap: ₹${fundamentals?.marketCap ? (fundamentals.marketCap / 10000000).toFixed(2) : 'N/A'}Cr
- 52W High: ₹${fundamentals?.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}
- 52W Low: ₹${fundamentals?.fiftyTwoWeekLow?.toFixed(2) || 'N/A'}

TECHNICALS:
- RSI: ${technicalIndicators.rsi?.toFixed(2) || 'N/A'}
- MACD: ${technicalIndicators.macd.macd?.toFixed(2) || 'N/A'}
- SMA 20: ₹${technicalIndicators.sma20?.toFixed(2) || 'N/A'}
- SMA 50: ₹${technicalIndicators.sma50?.toFixed(2) || 'N/A'}
- SMA 200: ₹${technicalIndicators.sma200?.toFixed(2) || 'N/A'}

Provide a comprehensive score in JSON format:
{
  "score": <total score 0-100>,
  "explanation": "<2-3 sentence overall assessment>",
  "fundamentalScore": <0-40 points based on PE, ROE, debt, growth>,
  "technicalScore": <0-30 points based on trend, momentum, indicators>,
  "valuationScore": <0-30 points based on whether fairly priced>,
  "factors": {
    "positive": ["<factor 1>", "<factor 2>", "<factor 3>"],
    "negative": ["<factor 1>", "<factor 2>"]
  },
  "entryPoint": "<ideal entry price or condition, e.g., 'Below ₹1,500' or 'On RSI dip below 40'>",
  "targetPrice": "<6-month target price estimate>",
  "growthProjection": {
    "sixMonths": "<expected % return, e.g., '+12-15%' or '-5-8%'>",
    "oneYear": "<expected % return>",
    "threeYears": "<expected % return CAGR>",
    "fiveYears": "<expected % return CAGR>",
    "rationale": "<1-2 sentence explanation for projections>"
  }
}

Consider current macroeconomic conditions, sector trends, and company-specific factors.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert stock analyst specializing in Indian markets. Always respond with valid JSON only. Be realistic with scoring - most established companies score 50-80, exceptional ones 80+, poor ones below 40. Be CONSISTENT - same metrics = same score. Handle missing data (N/A) gracefully by assigning neutral scores, not penalizing heavily.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;
    
    const scoreData: StockScore = JSON.parse(jsonText);
    return scoreData;
  } catch (error) {
    console.error('Error scoring stock:', error);
    
    // Fallback scoring
    return {
      score: 50,
      explanation: 'AI scoring unavailable. Manual analysis recommended.',
      fundamentalScore: 20,
      technicalScore: 15,
      valuationScore: 15,
      factors: {
        positive: ['Data available for analysis'],
        negative: ['AI scoring temporarily unavailable']
      },
      entryPoint: 'Current levels',
      targetPrice: 'N/A',
      growthProjection: {
        sixMonths: 'N/A',
        oneYear: 'N/A',
        threeYears: 'N/A',
        fiveYears: 'N/A',
        rationale: 'AI service unavailable'
      }
    };
  }
}

// Analyze entire sector - provide context-aware recommendation
export async function analyzeSector(
  mainSymbol: string,
  competitors: CompetitorInfo[],
  bestPickSymbol: string
): Promise<string> {
  const allSymbols = [mainSymbol, ...competitors.map(c => c.symbol)].join(', ');
  
  const prompt = `You are a stock market analyst. In this sector, we have: ${allSymbols}.

Based on comprehensive scoring, the highest-rated stock is: ${bestPickSymbol}

Provide a 2-3 sentence explanation in JSON format:
{
  "recommendation": "<Explain why ${bestPickSymbol} is the top choice, and briefly compare with 1-2 other notable stocks in the sector>"
}

Keep it objective and focused on the scores and metrics.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert on Indian stock markets. Always respond with valid JSON only. Be objective and consistent.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;
    
    const result = JSON.parse(jsonText);
    return result.recommendation || 'Analysis unavailable';
  } catch (error) {
    console.error('Error analyzing sector:', error);
    return `Based on comprehensive analysis, ${bestPickSymbol} offers the best investment opportunity in this sector.`;
  }
}

// Comprehensive analysis to explain why the best-scored stock is the best investment
export async function identifyBestInvestmentOpportunity(
  competitors: CompetitorAnalysis[],
  sector: string
): Promise<BestInvestmentAnalysis> {
  
  // Sort by score - HIGHEST SCORE = BEST PICK (deterministic, always consistent)
  const sortedCompetitors = [...competitors].sort((a, b) => b.score.score - a.score.score);
  const bestPick = sortedCompetitors[0]; // Highest scored stock
  
  // Prepare detailed data for context
  const competitorData = sortedCompetitors.map((comp, idx) => ({
    rank: idx + 1,
    symbol: comp.symbol,
    name: comp.name,
    price: comp.currentPrice,
    score: comp.score.score,
    fundamentals: {
      peRatio: comp.fundamentals.peRatio || 'N/A',
      pbRatio: comp.fundamentals.pbRatio || 'N/A',
      roe: comp.fundamentals.roe || 'N/A',
      eps: comp.fundamentals.eps || 'N/A',
      debtToEquity: comp.fundamentals.debtToEquity || 'N/A',
      dividendYield: comp.fundamentals.dividendYield || 'N/A',
    },
    technicals: {
      rsi: comp.technicals.rsi || 'N/A',
      trend: comp.technicals.trend || 'N/A',
    },
    entryPoint: comp.score.entryPoint,
    targetPrice: comp.score.targetPrice,
    sixMonthProjection: comp.score.growthProjection.sixMonths,
  }));

  const competitorList = competitorData.map((c) => 
    `${c.rank}. ${c.name} (${c.symbol}) - Score: ${c.score}/100
   Price: ₹${c.price.toFixed(2)}
   Fundamentals: P/E=${c.fundamentals.peRatio}, P/B=${c.fundamentals.pbRatio}, ROE=${c.fundamentals.roe}%, EPS=₹${c.fundamentals.eps}, Debt/Eq=${c.fundamentals.debtToEquity}, Div Yield=${c.fundamentals.dividendYield}%
   Technicals: RSI=${c.technicals.rsi}, Trend=${c.technicals.trend}
   Entry Point: ${c.entryPoint}
   Target: ${c.targetPrice}
   6M Projection: ${c.sixMonthProjection}`
  ).join('\n\n');

  const prompt = `You are a professional investment analyst specializing in Indian stock markets. It is currently July 2026.

SECTOR: ${sector}

STOCKS RANKED BY OBJECTIVE SCORE (Highest = Best):
${competitorList}

**BEST PICK (Highest Scored): ${bestPick.name} (${bestPick.symbol}) - Score: ${bestPick.score.score}/100**

YOUR TASK: Provide a comprehensive analysis EXPLAINING why ${bestPick.name} is the best investment choice based on its fundamentals and technicals.

ANALYZE THE FOLLOWING FOR ${bestPick.name}:

**FUNDAMENTAL ANALYSIS:**
- Valuation: Is P/E ratio ${competitorData[0].fundamentals.peRatio} reasonable? Is P/B ${competitorData[0].fundamentals.pbRatio} attractive?
- Profitability: How strong is ROE ${competitorData[0].fundamentals.roe}%? Is EPS ₹${competitorData[0].fundamentals.eps} healthy?
- Financial Health: Is Debt/Equity ${competitorData[0].fundamentals.debtToEquity} acceptable? 
- Dividend: Is yield ${competitorData[0].fundamentals.dividendYield}% attractive?
- Compare these metrics with competitors ranked #2 and #3

**TECHNICAL ANALYSIS:**
- Momentum: What does RSI ${competitorData[0].technicals.rsi} indicate? (30-40=oversold/buy, 60-70=overbought/caution)
- Trend: Is "${competitorData[0].technicals.trend}" favorable for entry?
- Entry Timing: Is NOW a good time based on technical setup?
- Compare technical position with other top-ranked stocks

**MARKET CONTEXT (July 2026):**
- Monsoon impact, quarterly earnings expectations, RBI policy
- Sector-specific trends affecting this stock
- Global economic factors

OUTPUT FORMAT (JSON):
{
  "bestPick": "${bestPick.symbol}",
  "bestPickName": "${bestPick.name}",
  "recommendation": "<3-4 sentence summary explaining why ${bestPick.name} scored highest and is the best choice NOW>",
  "fundamentalReasoning": "<Detailed explanation of WHY the fundamentals earned it top score. Which metrics are superior to competitors?>",
  "technicalReasoning": "<Detailed explanation of technical setup. Is entry timing good? What do RSI, trend indicators show?>",
  "riskFactors": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "currentMarketContext": "<How July 2026 market conditions support this pick>",
  "timingAdvice": "<Should investor buy NOW at ₹${competitorData[0].price.toFixed(2)}, wait for dip, or buy in tranches?>"
}

IMPORTANT: 
- You are EXPLAINING why ${bestPick.name} (the highest-scored stock) is the best
- Do NOT recommend a different stock - ${bestPick.name} is already determined as best by objective scoring
- Focus on providing detailed reasoning for WHY it scored highest`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are explaining why ${bestPick.name} earned the highest score. Always respond with valid JSON only. Focus on detailed reasoning for this pre-selected stock.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1, // Very low for consistency
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;
    
    const analysis: BestInvestmentAnalysis = JSON.parse(jsonText);
    
    // Ensure the response uses our predetermined best pick
    return {
      ...analysis,
      bestPick: bestPick.symbol, // Force correct symbol
      bestPickName: bestPick.name, // Force correct name
    };
  } catch (error) {
    console.error('Error identifying best investment:', error);
    
    // Fallback to highest scored stock
    const topStock = competitorData[0];
    return {
      bestPick: topStock.symbol,
      bestPickName: topStock.name,
      recommendation: `${topStock.name} has the highest overall score (${topStock.score}/100) in the sector.`,
      fundamentalReasoning: 'Detailed analysis unavailable due to AI service error.',
      technicalReasoning: 'Technical analysis unavailable due to AI service error.',
      riskFactors: ['AI analysis unavailable', 'Manual review recommended'],
      currentMarketContext: 'Market context analysis unavailable.',
      timingAdvice: 'Consult with your financial advisor before investing.',
    };
  }
}
