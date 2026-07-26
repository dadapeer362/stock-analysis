import Groq from 'groq-sdk';
import { calculateStockScore, calculateEntryPoint, StockScore } from './stockScoring';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// For batch comparison of multiple stocks
export interface StockRecommendation {
  symbol: string;
  company: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  explanation: string; // Clear 2-3 sentence explanation why
  investmentThesis: string; // One-line investment thesis (concise summary)
  comparativeReasoning?: string; // Why this ranks #1 compared to others (only for top stock)
  keyMetrics: {
    pe: number | null;
    pb: number | null;
    roe: number | null;
    roce: number | null;
    debtToEquity: number | null;
    currentPrice: number;
  };
  strengths: string[]; // 2-3 key strengths
  weaknesses: string[]; // 2-3 key weaknesses
  risks: string[]; // 2-3 key risk factors to monitor
  score: StockScore; // Professional 5-pillar score
  rank: number; // Ranking among all stocks (1 = best)
  entryPoint: {
    currentPrice: number;
    idealEntry: number;
    valueBasedEntry: number | null;
    technicalEntry: number;
    stopLoss: number;
    target: number;
    recommendation: string;
  };
}

export interface InvestmentRecommendation {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  targetPrice: number;
  stopLoss: number;
  timeHorizon: '3-6 months' | '6-12 months' | '1-2 years';
  
  // Detailed reasoning
  whyBuy: string[]; // Reasons supporting buy
  whySell: string[]; // Reasons supporting sell  
  whyHold: string[]; // Reasons supporting hold
  
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

export async function getInvestmentRecommendation(stockData: any): Promise<InvestmentRecommendation> {
  const {
    symbol,
    companyName,
    currentPrice,
    fundamentals,
    quarterlyResults,
    compoundedGrowth,
    cashFlow,
    shareholding,
    technicals,
    competitors,
  } = stockData;

  const prompt = `You are a professional investment analyst. Analyze this Indian stock and provide a clear BUY/SELL/HOLD recommendation.

**STOCK: ${companyName} (${symbol})**
**CURRENT PRICE: ₹${currentPrice}**

**FUNDAMENTAL DATA:**
- P/E Ratio: ${fundamentals.peRatio || 'N/A'}
- P/B Ratio: ${fundamentals.pbRatio || 'N/A'}
- ROE: ${fundamentals.roe || 'N/A'}%
- ROCE: ${fundamentals.roce || 'N/A'}%
- Debt/Equity: ${fundamentals.debtToEquity || 'N/A'}
- Dividend Yield: ${fundamentals.dividendYield || 'N/A'}%
- Market Cap: ₹${fundamentals.marketCap ? (fundamentals.marketCap / 10000000).toFixed(0) : 'N/A'} Cr
- 52W High/Low: ₹${fundamentals.fiftyTwoWeekHigh}/${fundamentals.fiftyTwoWeekLow}

**GROWTH METRICS:**
- Sales CAGR (10Y/5Y/3Y): ${compoundedGrowth.sales10Y}% / ${compoundedGrowth.sales5Y}% / ${compoundedGrowth.sales3Y}%
- Profit CAGR (10Y/5Y/3Y): ${compoundedGrowth.profit10Y}% / ${compoundedGrowth.profit5Y}% / ${compoundedGrowth.profit3Y}%

**RECENT PERFORMANCE (Last 4 Quarters):**
${quarterlyResults.map((q: any) => `${q.quarter}: Sales ₹${q.sales}Cr, Profit ₹${q.netProfit}Cr`).join('\n')}

**CASH FLOW:**
- Free Cash Flow: ₹${cashFlow.freeCashFlow || 'N/A'} Cr
- CFO/Operating Profit: ${cashFlow.cfoToOp || 'N/A'}%

**SHAREHOLDING:**
- Promoter: ${shareholding.promoter || 'N/A'}% ${shareholding.promoterTrend ? `(${shareholding.promoterTrend})` : ''}
- FII: ${shareholding.fii || 'N/A'}% ${shareholding.fiiTrend ? `(${shareholding.fiiTrend})` : ''}
- DII: ${shareholding.dii || 'N/A'}% ${shareholding.diiTrend ? `(${shareholding.diiTrend})` : ''}
- Public: ${shareholding.public || 'N/A'}%
- Overall Trend: ${shareholding.overallTrend || 'N/A'}

**TECHNICAL INDICATORS:**
- RSI: ${technicals.rsi || 'N/A'} ${technicals.rsi ? (technicals.rsi > 70 ? '(Overbought)' : technicals.rsi < 30 ? '(Oversold)' : '(Neutral)') : ''}
- Trend: ${technicals.trend}
- Price vs SMA: Above SMA 50: ${currentPrice > technicals.sma50 ? 'Yes' : 'No'}, Above SMA 200: ${currentPrice > technicals.sma200 ? 'Yes' : 'No'}

**COMPETITOR CONTEXT:**
${competitors.slice(0, 3).map((c: any) => `- ${c.name}: P/E ${c.peRatio || 'N/A'}, ROCE ${c.roce}%, Sales Growth ${c.salesGrowth}%`).join('\n')}

**YOUR TASK:**
Provide a comprehensive investment recommendation in JSON format:

{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": <0-100, how confident are you?>,
  "targetPrice": <price target for next 6-12 months>,
  "stopLoss": <price at which to exit if wrong>,
  "timeHorizon": "3-6 months" | "6-12 months" | "1-2 years",
  
  "whyBuy": [
    "<specific reason 1, e.g., Strong ROE of 29% indicates excellent capital efficiency>",
    "<specific reason 2>",
    "<specific reason 3>"
  ],
  "whySell": [
    "<specific reason 1, e.g., High P/E of 53 suggests overvaluation>",
    "<specific reason 2>"
  ],
  "whyHold": [
    "<specific reason 1, e.g., Good fundamentals but RSI 75 indicates short-term overbought>",
    "<specific reason 2>"
  ],
  
  "fundamentalAnalysis": "<Detailed 3-4 sentence analysis of P/E, ROE, ROCE, growth rates, profitability. Is the business quality good? Are financials strong?>",
  
  "technicalAnalysis": "<Detailed 2-3 sentence analysis of RSI, trend, moving averages. Is this a good entry point technically? What's the momentum?>",
  
  "valuationAnalysis": "<Detailed 2-3 sentence analysis. Is stock cheap, fairly priced, or expensive based on P/E, P/B, industry comparison?>",
  
  "growthProspects": "<Detailed 2-3 sentence analysis of future growth. Based on CAGRs, quarterly trends, and sector outlook, what's the growth potential?>",
  
  "riskFactors": [
    "<specific risk 1, e.g., High debt levels could pressure margins if interest rates rise>",
    "<specific risk 2>",
    "<specific risk 3>"
  ],
  
  "catalysts": [
    "<potential trigger 1, e.g., Upcoming quarterly results expected to show strong growth>",
    "<potential trigger 2>"
  ],
  
  "summary": "<2-3 sentence TL;DR. State action (BUY/SELL/HOLD), key reason, and conviction level>"
}

**IMPORTANT GUIDELINES:**
1. **Action Decision:**
   - BUY if: Strong fundamentals + reasonable valuation + positive technicals + good growth prospects
   - SELL if: Weak fundamentals OR expensive valuation + deteriorating metrics + poor growth
   - HOLD if: Mixed signals, good fundamentals but expensive, or good value but weak momentum
   
2. **Be Specific:** 
   - Instead of "good fundamentals", say "ROE of 29% and ROCE of 28% indicate excellent capital efficiency"
   - Instead of "overvalued", say "P/E of 53 is 2x higher than industry average of 26"
   
3. **Balance Multiple Factors:**
   - A stock can have great fundamentals but be too expensive (HOLD or SELL)
   - A stock can have okay fundamentals but be very cheap (BUY)
   - Consider timing: good stock at bad price = HOLD
   
4. **Shareholding Pattern Analysis:**
   - INCREASING promoter holding = Strong confidence signal (potential BUY)
   - DECREASING promoter holding = Warning sign (potential SELL/HOLD)
   - INCREASING FII/DII = Institutional buying interest (positive)
   - DECREASING FII/DII = Institutions exiting (cautious)
   - Stable high promoter holding (>50%) = Generally positive for governance
   
5. **Risk Awareness:**
   - Always list 2-3 specific risks even for BUY recommendations
   - Mention if stock is near 52W high (downside risk) or 52W low (recovery potential)

6. **Current Market Context (July 2026):**
   - Consider monsoon season impact
   - Factor in quarterly earnings expectations
   - Assess RBI policy and interest rate environment`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a senior investment analyst with 15+ years of experience in Indian stock markets. Always respond with valid JSON only. Be specific, data-driven, and balanced in your analysis. Your goal is to help investors make informed decisions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 3000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;
    
    const recommendation: InvestmentRecommendation = JSON.parse(jsonText);
    return recommendation;
  } catch (error) {
    console.error('Error getting recommendation:', error);
    
    // Fallback simple recommendation
    return {
      action: 'HOLD',
      confidence: 50,
      targetPrice: currentPrice * 1.1,
      stopLoss: currentPrice * 0.9,
      timeHorizon: '6-12 months',
      whyBuy: ['Analysis unavailable'],
      whySell: ['Analysis unavailable'],
      whyHold: ['AI service temporarily unavailable', 'Manual analysis recommended'],
      fundamentalAnalysis: 'Detailed fundamental analysis unavailable due to AI service error.',
      technicalAnalysis: 'Technical analysis unavailable due to AI service error.',
      valuationAnalysis: 'Valuation analysis unavailable due to AI service error.',
      growthProspects: 'Growth analysis unavailable due to AI service error.',
      riskFactors: ['AI analysis unavailable', 'Perform manual due diligence'],
      catalysts: ['Unable to identify catalysts'],
      summary: 'AI recommendation service temporarily unavailable. Please perform manual analysis before investing.',
    };
  }
}

// Batch analysis for comparing multiple stocks (searched stock + competitors)
// Uses professional 5-pillar scoring system to rank stocks
export async function analyzeMultipleStocks(stocksData: any[]): Promise<StockRecommendation[]> {
  console.log(`\n🔬 Professional Stock Scoring: Analyzing ${stocksData.length} stocks...`);
  
  // STEP 1: Calculate comprehensive scores for all stocks WITH PEER COMPARISON
  const scoredStocks = stocksData.map((stock, index) => {
    // Get all other stocks as peers for percentile-based scoring
    const peers = stocksData.filter((_, i) => i !== index);
    
    // Pass peers to scoring function for sector-relative comparison
    const score = calculateStockScore(stock, peers);
    const entryPoint = calculateEntryPoint(stock, score);
    
    console.log(`  📊 ${stock.companyName}: Score ${score.totalScore}/100 (${score.rating})`);
    
    return {
      ...stock,
      score,
      entryPoint,
    };
  });
  
  // STEP 2: Rank stocks by investment score (highest first = best to buy today)
  scoredStocks.sort((a, b) => b.score.investmentScore - a.score.investmentScore);
  
  const rankedStocks = scoredStocks.map((stock, index) => ({
    ...stock,
    rank: index + 1,
  }));
  
  const bestStock = rankedStocks[0];
  console.log(`\n🏆 BEST STOCK: ${bestStock.companyName} (Investment Score: ${bestStock.score.investmentScore}/100)`);
  
  // STEP 3: Prepare enhanced data for LLM with scores and rankings
  const stocksSummary = rankedStocks.map((stock) => {
    const f = stock.fundamentals || {};
    const g = stock.compoundedGrowth || {};
    const s = stock.shareholding || {};
    const sc = stock.score;
    
    return `
**RANK #${stock.rank}: ${stock.companyName} (${stock.symbol})** ⭐ SCORE: ${sc.totalScore}/100 (${sc.rating})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Score Breakdown:
   • Business Quality: ${sc.pillarScores.businessQuality}/100 (Weight: 30%)
   • Growth: ${sc.pillarScores.growth}/100 (Weight: 25%)
   • Valuation: ${sc.pillarScores.valuation}/100 (Weight: 20%)
   • Technical Strength: ${sc.pillarScores.technicalStrength}/100 (Weight: 15%)
   • Market Confidence: ${sc.pillarScores.marketConfidence}/100 (Weight: 10%)

💰 Current Price: ₹${stock.currentPrice} | Ideal Entry: ₹${stock.entryPoint.idealEntry} | Target: ₹${stock.entryPoint.target}

📊 Fundamentals:
   • P/E: ${f.peRatio || 'N/A'} | P/B: ${f.pbRatio || 'N/A'}
   • ROE: ${f.roe || 'N/A'}% | ROCE: ${f.roce || 'N/A'}%
   • Debt/Equity: ${f.debtToEquity || 'N/A'}
   • Market Cap: ₹${f.marketCap ? (f.marketCap / 10000000).toFixed(0) : 'N/A'} Cr

📈 Growth (CAGR):
   • Sales 5Y/3Y: ${g.sales5Y || 'N/A'}% / ${g.sales3Y || 'N/A'}%
   • Profit 5Y/3Y: ${g.profit5Y || 'N/A'}% / ${g.profit3Y || 'N/A'}%

👥 Shareholding:
   • Promoter: ${s.promoter || 'N/A'}% ${s.promoterTrend ? `(${s.promoterTrend})` : ''}
   • FII: ${s.fii || 'N/A'}% ${s.fiiTrend ? `(${s.fiiTrend})` : ''}
   • DII: ${s.dii || 'N/A'}% ${s.diiTrend ? `(${s.diiTrend})` : ''}

✅ Key Strengths: ${sc.strengths.join(', ') || 'N/A'}
❌ Key Weaknesses: ${sc.weaknesses.join(', ') || 'N/A'}
`;
  }).join('\n');

  const prompt = `You are analyzing ${rankedStocks.length} stocks that have been PRE-SCORED using a professional 5-pillar system.

**THE BEST STOCK IS ALREADY IDENTIFIED: ${bestStock.companyName} with score ${bestStock.score.totalScore}/100**

${stocksSummary}

**YOUR TASK:**
Your job is to EXPLAIN why each stock got its score and provide actionable BUY/SELL/HOLD recommendations based on the scores.

Respond with this JSON array format (order by rank):

[
  {
    "symbol": "${rankedStocks[0].symbol}",
    "company": "${rankedStocks[0].companyName}",
    "action": "<Based on score: 90-100=BUY, 80-89=BUY, 70-79=HOLD, 55-69=HOLD, 40-54=SELL, <40=SELL>",
    "confidence": ${rankedStocks[0].score.investmentScore},
    "explanation": "<Explain WHY this stock scored ${rankedStocks[0].score.investmentScore}/100. Reference specific pillars with numbers. Be specific and data-driven.>",
    "investmentThesis": "<One concise sentence capturing the core investment case. Example: 'Excellent quality business with strong growth and favorable technicals, though valuation is above average.' Max 20 words.>",
    "strengths": [
      "<Specific strength with number>",
      "<Specific strength with number>",
      "<Specific strength with number>"
    ],
    "weaknesses": [
      "<Specific weakness with number>",
      "<Specific weakness with number>"
    ]
  },
  // ... repeat for all ${rankedStocks.length} stocks IN RANK ORDER
]

**GUIDELINES:**
1. **INVESTMENT THESIS (REQUIRED FOR ALL STOCKS):**
   - Start with a category label from this standard list:
     * "Excellent compounder" - High quality (80+) + strong growth (70+) + reasonable valuation (60+)
     * "High-quality but expensive" - High quality (80+) + low valuation score (<50)
     * "Value pick" - Good fundamentals (60+) + attractive valuation (80+) + near 52W low
     * "Growth at reasonable price (GARP)" - Strong growth (70+) + PEG < 1.5
     * "Turnaround story" - Loss-making or weak quality but improving trends
     * "Momentum play" - High momentum score (80+) regardless of fundamentals
     * "Cyclical recovery" - Weak recent growth but accelerating trends
     * "Deep value" - Trading below book value or near 52W low despite decent fundamentals
     * "Avoid - weak fundamentals" - Quality < 40 and growth < 40
   - Follow category with one sentence (max 20 words) explaining key trade-offs
   - Examples:
     * "Excellent compounder: Strong fundamentals (ROE 30%, ROCE 35%) with consistent growth, though trading at premium valuation."
     * "High-quality but expensive: Market leader with excellent returns but PEG 2.5 limits upside from current levels."
     * "Value pick: Solid business (ROE 22%) trading 30% below 52W high with improving growth trends."
     * "Turnaround story: Loss-making but sales growing 40% and losses narrowing; high-risk, high-reward bet."
   - Be honest about both strengths AND risks

2. **ACTION MAPPING (Risk-Reward Based):**
   - Score 90-100 → BUY (🟢 Strong Buy)
   - Score 80-89 → BUY (🟢 Buy)  
   - Score 70-79 → HOLD (🟡 Accumulate / Buy on Dips)
   - Score 55-69 → HOLD (🟡 Watch)
   - Score 40-54 → SELL (⚠️ High Risk / Speculative)
   - Score <40 → SELL (🔴 Avoid)

3. **Comparative Reasoning (ONLY for #1 ranked stock):**
   Add a "comparativeReasoning" field explaining WHY this stock ranks #1 compared to others.
   
   **CRITICAL FORMAT:**
   "{Stock Name} ranks above {#2 Stock} because {specific advantage 1} and {specific advantage 2}. While {#2 Stock} has {their strength}, {#1 stock}'s {differentiator} makes it the better buy today. Main risk: {honest risk assessment}."
   
   **Example:**
   "TVS ranks above Hero because it has much faster earnings growth (+43% vs +13%) and stronger price momentum. While Hero is cheaper (PE 19 vs 45) and generates stronger free cash flow (₹2,500 Cr vs ₹800 Cr), TVS's exceptional growth justifies the premium valuation (PEG 1.06 is reasonable). Main risk: Trading near 52W high limits upside."
   
   **Requirements:**
   - MUST explicitly compare against #2 ranked stock by name
   - Include 2-3 specific metrics with numbers
   - Acknowledge what #2 does better
   - Explain why #1 still wins overall
   - Include an honest risk assessment

4. **Explain the Score:** Don't just say "good fundamentals" - say "Business Quality scored 85/100 due to ROE of 25% and ROCE of 30%"

5. **Strengths/Weaknesses - BE SPECIFIC:**
   DO mention:
   - High operating margin / net margin (with %)
   - High ROCE / ROE (with %)
   - Strong cash generation
   - Market leadership
   - Low debt / healthy balance sheet
   - Consistent earnings growth
   - Strong promoter holding
   
   DO NOT mention:
   - High market cap (not a fundamental strength)
   - Low market cap (not a strength, indicates higher risk)
   - Generic statements without numbers

6. **Risk Factors (REQUIRED - 2-3 specific risks):**
   Choose from these categories based on data:
   - "Premium valuation risk: PEG X.X limits upside; vulnerable to growth slowdown"
   - "Momentum risk: Trading near 52W high with low margin of safety"
   - "Growth deceleration: 3Y growth (X%) slower than 5Y (Y%), trend weakening"
   - "Leverage risk: Debt/Equity X.X increases financial vulnerability"
   - "Margin pressure: Operating margins compressed, cost inflation impact"
   - "Loss-making: Continued cash burn (FCF ₹-X Cr) unsustainable without funding"
   - "Low institutional confidence: FII/DII holdings below X%, limited support"
   - "Cyclical exposure: Dependent on economic cycles/commodity prices"
   - "Competitive pressure: Market share loss to competitors"
   - "Execution risk: Turnaround dependent on management delivery"
   - "Valuation risk: Near 52W high despite weak fundamentals"
   Be specific with numbers where possible.
   
7. **Loss-Making Companies:**
   For companies with negative profits, DO NOT say "102% profit growth" or similar.
   Instead say: "Profit CAGR not meaningful (company remains loss-making). Losses have narrowed by X%."

7. **Use Pillar Context:**
   - High Business Quality score → Strong fundamentals (ROE, ROCE, margins, low debt, free cash flow generation, cash conversion)
   - High Growth score → Strong revenue/profit growth trajectory (specify %) + Forward momentum (sales acceleration)
   - High Valuation score → Attractively priced (reference PE, PEG, or P/B)
   - High Technical score → Favorable entry timing (mention RSI, MA position)
   - High Market Confidence score → Institutional buying (FII/DII trends)
   - High Momentum score → Strong recent price performance (mention % returns)
   
   **Growth Pillar Factors:**
   - Sales/Profit CAGR: Historical growth rates (5Y, 3Y)
   - Sales Acceleration: Recent quarterly growth trending above historical CAGR = growth momentum building
   - Quarterly trends: Recent Q-o-Q performance
   - Consistency: 3Y vs 5Y CAGR alignment
   
   **Business Quality Factors (NOT Growth):**
   - Free Cash Flow: Positive FCF = company can self-fund future expansion without raising capital
   - CFO/OP Ratio: High ratio (>80%) = quality earnings that convert to cash, not just accounting profits

8. **Highlight Rank:** Mention if stock is #1 best, top 3, or bottom performer with context

9. **Entry Timing:** Use the ideal entry price: "Buy at ₹X (current ₹Y), expected range ₹Z"

Respond with ONLY the JSON array, no additional text.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional equity analyst explaining stock scores. Always respond with valid JSON only. Be specific with numbers and reference the scoring pillars.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.15, // Lower temperature for more consistent scoring interpretation
      max_tokens: 5000,
    });

    const responseText = completion.choices[0]?.message?.content || '[]';
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;
    
    const aiRecommendations = JSON.parse(jsonText);
    
    // STEP 4: Enrich recommendations with calculated scores and entry points
    const enrichedRecommendations: StockRecommendation[] = rankedStocks.map((stock, idx) => {
      const aiRec = aiRecommendations[idx] || {};
      const f = stock.fundamentals || {};
      
      return {
        symbol: stock.symbol,
        company: stock.companyName,
        action: aiRec.action || (stock.score.totalScore >= 75 ? 'BUY' : stock.score.totalScore >= 60 ? 'HOLD' : 'SELL'),
        confidence: stock.score.totalScore,
        explanation: aiRec.explanation || `Scored ${stock.score.totalScore}/100 based on professional 5-pillar analysis.`,
        investmentThesis: aiRec.investmentThesis || `Scored ${stock.score.investmentScore}/100 on buy opportunity scale.`,
        comparativeReasoning: aiRec.comparativeReasoning,
        keyMetrics: {
          pe: f.peRatio || null,
          pb: f.pbRatio || null,
          roe: f.roe || null,
          roce: f.roce || null,
          debtToEquity: f.debtToEquity || null,
          currentPrice: stock.currentPrice || 0,
        },
        strengths: aiRec.strengths || stock.score.strengths,
        weaknesses: aiRec.weaknesses || stock.score.weaknesses,
        risks: aiRec.risks || [], // AI-generated risk factors
        score: stock.score,
        rank: stock.rank,
        entryPoint: stock.entryPoint,
      };
    });
    
    console.log(`\n✅ Analysis complete with professional scoring and ranking`);
    
    return enrichedRecommendations;
  } catch (error) {
    console.error('Error in batch analysis:', error);
    
    // Fallback: Use scores without AI explanation
    return rankedStocks.map((stock) => {
      const f = stock.fundamentals || {};
      
      return {
        symbol: stock.symbol,
        company: stock.companyName,
        action: stock.score.totalScore >= 75 ? 'BUY' : stock.score.totalScore >= 60 ? 'HOLD' : 'SELL',
        confidence: stock.score.totalScore,
        explanation: `Scored ${stock.score.totalScore}/100 (${stock.score.rating}). ${stock.score.strengths.join('. ')}.`,
        investmentThesis: `Buy opportunity score: ${stock.score.investmentScore}/100.`,
        strengths: stock.score.strengths,
        weaknesses: stock.score.weaknesses,
        risks: [], // No AI risks in fallback mode
        keyMetrics: {
          pe: f.peRatio || null,
          pb: f.pbRatio || null,
          roe: f.roe || null,
          roce: f.roce || null,
          debtToEquity: f.debtToEquity || null,
          currentPrice: stock.currentPrice || 0,
        },
        score: stock.score,
        rank: stock.rank,
        entryPoint: stock.entryPoint,
      };
    });
  }
}

