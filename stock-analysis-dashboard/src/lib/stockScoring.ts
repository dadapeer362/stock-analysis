// Professional stock scoring system with 4 headline scores
// Separates business quality, growth, investment opportunity, and momentum

// ==================== PERCENTILE UTILITIES ====================

/**
 * Calculate percentile rank of a value within an array of peer values
 * Returns 0-100 where 100 = best in sector, 0 = worst in sector
 */
function calculatePercentile(value: number | null | undefined, peerValues: (number | null | undefined)[], higherIsBetter: boolean = true): number | null {
  if (value == null) return null;
  
  // Filter out null/undefined values
  const validPeerValues = peerValues.filter(v => v != null) as number[];
  
  if (validPeerValues.length === 0) return null;
  
  // Count how many peers are worse than this value
  const worseThanThis = validPeerValues.filter(v => 
    higherIsBetter ? v < value : v > value
  ).length;
  
  // Percentile = (number worse than this / total peers) × 100
  const percentile = (worseThanThis / validPeerValues.length) * 100;
  
  return Math.round(percentile);
}

/**
 * Convert percentile to score (0-100) with custom thresholds
 */
function percentileToScore(percentile: number | null): number {
  if (percentile == null) return 0;
  
  // Top 10% (90th percentile+) → 100 pts
  if (percentile >= 90) return 100;
  // Top 25% (75th-90th) → 90 pts
  if (percentile >= 75) return 90;
  // Top 50% (50th-75th) → 75 pts
  if (percentile >= 50) return 75;
  // Top 75% (25th-50th) → 50 pts
  if (percentile >= 25) return 50;
  // Bottom 25% → scaled down
  return Math.max(20, percentile * 0.8);
}

export interface StockScore {
  // HEADLINE SCORES (what users care about)
  businessQualityScore: number; // 0-100: How good is the company?
  growthPotentialScore: number; // 0-100: Can it grow?
  investmentScore: number; // 0-100: Buy Opportunity Score - Should I buy TODAY at current price?
  momentumScore: number; // 0-100: What's already running?
  riskScore: number; // 0-100: Lower = safer, Higher = riskier
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'; // Risk category
  
  // Legacy total score (for backward compatibility)
  totalScore: number; // 0-100
  
  pillars: {
    businessQuality: number; // 30% weight
    growth: number; // 25% weight
    valuation: number; // 20% weight
    technicalStrength: number; // 15% weight
    marketConfidence: number; // 10% weight
  };
  pillarScores: {
    businessQuality: number; // 0-100
    growth: number; // 0-100
    valuation: number; // 0-100
    technicalStrength: number; // 0-100
    marketConfidence: number; // 0-100
    momentum: number; // 0-100 (new)
  };
  rating: 'STRONG_BUY' | 'BUY_ZONE' | 'WATCH_ZONE' | 'WAIT' | 'AVOID';
  strengths: string[];
  weaknesses: string[];
  dataCompleteness: number; // 0-100 percentage of available data
  isLossMaking: boolean; // Flag for special handling
  verdict: string; // One-line actionable investment summary
  
  // NEW: Decision Framework
  buyDecision: {
    canBuyToday: boolean;
    reasons: {
      positive: string[];
      negative: string[];
    };
    recommendation: string;
  };
  
  // NEW: Score Breakdown - Why not higher?
  scoreBreakdown: {
    positiveContributors: Array<{factor: string; impact: number}>;
    negativeContributors: Array<{factor: string; impact: number}>;
  };
  
  // NEW: Fair Value Analysis
  fairValue: number | null; // Estimated intrinsic value
  marginOfSafety: number | null; // % difference from current price (positive = undervalued)
  fairValueMethods: {
    graham: number | null;
    peMethod: number | null;
    weighted: number | null;
  } | null;
  
  // NEW: Recommendation Confidence
  confidenceLevel: 'High' | 'Medium' | 'Low'; // Confidence in this recommendation
  confidenceScore: number; // 0-100: Underlying score for confidence level
  confidenceExplanation: string; // Why this confidence level?
  
  // NEW: WHY NOW? Decision Summary
  whyNow: {
    businessQuality: 'Excellent' | 'Good' | 'Average' | 'Poor';
    priceValuation: 'Cheap' | 'Fair' | 'Expensive' | 'Very Expensive';
    technicalSetup: 'Bullish' | 'Neutral' | 'Bearish';
    overallVerdict: 'BUY' | 'WATCH' | 'AVOID';
    reasoning: string;
  };
  
  // NEW: Catalysts & Risks
  catalysts: string[]; // Positive drivers (3-5 items)
  risks: string[]; // Key risks to monitor (3-5 items)
  
  scoringDetails: {
    businessQuality: string;
    growth: string;
    valuation: string;
    technical: string;
    confidence: string;
    momentum: string;
  };
}

export function calculateStockScore(stockData: any, peersData: any[] = []): StockScore {
  const f = stockData.fundamentals || {};
  const g = stockData.compoundedGrowth || {};
  const s = stockData.shareholding || {};
  const t = stockData.technicals || {};
  const q = stockData.quarterlyResults || {};
  const a = stockData.annualResults || [];
  const cf = stockData.cashFlow || {};
  const bs = stockData.balanceSheet || {};
  
  // Extract peer metrics for percentile calculations
  const peerMetrics = peersData.length > 0 ? {
    roe: peersData.map(p => p.fundamentals?.roe),
    roce: peersData.map(p => p.fundamentals?.roce),
    peRatio: peersData.map(p => p.fundamentals?.peRatio),
    pbRatio: peersData.map(p => p.fundamentals?.pbRatio),
    debtToEquity: peersData.map(p => p.fundamentals?.debtToEquity),
    sales3Y: peersData.map(p => p.compoundedGrowth?.sales3Y),
    sales5Y: peersData.map(p => p.compoundedGrowth?.sales5Y),
    profit3Y: peersData.map(p => p.compoundedGrowth?.profit3Y),
    profit5Y: peersData.map(p => p.compoundedGrowth?.profit5Y),
  } : null;
  
  // CHECK 1: Detect loss-making companies
  const isLossMaking = (f.roe != null && f.roe < 0) || (f.roce != null && f.roce < 0);
  
  // CHECK 2: Calculate data completeness
  const dataCompleteness = calculateDataCompleteness(f, g, s, t, q);
  
  // CHECK 3: If data is severely incomplete, return warning score
  if (dataCompleteness < 30) {
    return createInsufficientDataScore(dataCompleteness, stockData.company);
  }
  
  // PILLAR 1: BUSINESS QUALITY (30% weight)
  const businessQuality = calculateBusinessQuality(f, g, s, q, cf, bs, isLossMaking, peerMetrics);
  
  // PILLAR 2: GROWTH (25% weight) - Enhanced with growth momentum
  const growth = calculateGrowth(g, q, a, cf, isLossMaking, peerMetrics);
  
  // PILLAR 3: VALUATION (20% weight)
  const valuation = calculateValuation(f, g, stockData.currentPrice, isLossMaking, peerMetrics);
  
  // PILLAR 4: TECHNICAL STRENGTH (15% weight)
  const technicalStrength = calculateTechnicalStrength(t, stockData.currentPrice);
  
  // PILLAR 5: MARKET CONFIDENCE (10% weight)
  const marketConfidence = calculateMarketConfidence(s);
  
  // PILLAR 6: MOMENTUM (for separate headline score, not weighted in investment score)
  const momentum = calculateMomentum(f, q, t, stockData.currentPrice, stockData.priceReturns);
  
  // Calculate Investment Score (should I buy TODAY at current price?)
  // IMPORTANT: Redistribute weights when pillars are unavailable (score = 0)
  // Missing data should NOT penalize the investment score
  
  const pillars = [
    { name: 'business', score: businessQuality.score, baseWeight: 0.30 },
    { name: 'growth', score: growth.score, baseWeight: 0.25 },
    { name: 'valuation', score: valuation.score, baseWeight: 0.20 },
    { name: 'technical', score: technicalStrength.score, baseWeight: 0.15 },
    { name: 'confidence', score: marketConfidence.score, baseWeight: 0.10 },
  ];
  
  // Filter out unavailable pillars (score = 0 means no data)
  const availablePillars = pillars.filter(p => p.score > 0);
  
  let investmentScore = 0;
  
  if (availablePillars.length > 0) {
    // Calculate total weight of available pillars
    const totalAvailableWeight = availablePillars.reduce((sum, p) => sum + p.baseWeight, 0);
    
    // Redistribute weights proportionally
    investmentScore = availablePillars.reduce((sum, pillar) => {
      const redistributedWeight = pillar.baseWeight / totalAvailableWeight;
      return sum + (pillar.score * redistributedWeight);
    }, 0);
  }
  
  // Apply loss-making penalty to investment score
  // Loss-making companies are high risk for long-term investors
  if (isLossMaking && investmentScore > 0) {
    // Apply 15% reduction to investment score for loss-making companies
    // This ensures Ather-type companies score 45-50 instead of 56
    const penalty = investmentScore * 0.15;
    investmentScore = Math.max(investmentScore - penalty, 25); // Floor at 25
    console.log(`📉 Applied loss-making penalty: -${Math.round(penalty)} points`);
  }
  
  // Calculate 4 HEADLINE SCORES
  const businessQualityScore = Math.round(businessQuality.score); // Pure fundamentals
  const growthPotentialScore = Math.round(growth.score); // Future prospects
  const momentumScore = Math.round(momentum.score); // What's running
  const investmentScoreRounded = Math.round(investmentScore); // Buy today?
  
  // Determine rating based on INVESTMENT score + price position
  // Price-aware adjustment: If trading significantly above support/ideal entry, downgrade
  let rating: StockScore['rating'];
  let priceAdjustment = 0;
  
  // Check if near 52W high (expensive entry point)
  if (f.fiftyTwoWeekHigh && f.fiftyTwoWeekLow && stockData.currentPrice) {
    const range = f.fiftyTwoWeekHigh - f.fiftyTwoWeekLow;
    const position = (stockData.currentPrice - f.fiftyTwoWeekLow) / range;
    
    if (position > 0.9) {
      priceAdjustment = -10; // At 52W high - downgrade
    } else if (position > 0.8) {
      priceAdjustment = -5; // Near high - slight downgrade
    } else if (position < 0.3) {
      priceAdjustment = +5; // Near low - upgrade
    }
  }
  
  const adjustedScore = investmentScore + priceAdjustment;
  
  // Rating categories aligned with feedback
  if (adjustedScore >= 85) rating = 'STRONG_BUY'; // Excellent fundamentals + attractive price
  else if (adjustedScore >= 75) rating = 'BUY_ZONE'; // Good opportunity - buy gradually
  else if (adjustedScore >= 65) rating = 'WATCH_ZONE'; // Quality business - wait for dip
  else if (adjustedScore >= 50) rating = 'WAIT'; // Mixed signals - avoid for now
  else rating = 'AVOID'; // Poor fundamentals or overvalued
  
  // Identify strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (businessQuality.score >= 80) strengths.push('Excellent business quality');
  else if (businessQuality.score < 50 && businessQuality.score > 0) weaknesses.push('Weak fundamentals');
  
  if (growth.score >= 80) strengths.push('Strong growth trajectory');
  else if (growth.score >= 60 && isLossMaking && growth.explanation.includes('OPM improvement')) {
    strengths.push('Operational improvement - margins expanding'); // Turnaround-specific strength
  }
  else if (growth.score < 50 && growth.score > 0) {
    // For loss-making companies, "growth" means operational improvement (OPM, loss reduction)
    // Don't mark as "slow growth" if showing turnaround indicators
    const showingTurnaroundSigns = isLossMaking && (
      growth.explanation.includes('OPM improvement') ||
      growth.explanation.includes('Exceptional sales growth') ||
      growth.explanation.includes('Very strong sales growth') ||
      growth.explanation.includes('Losses narrowing')
    );
    
    if (!showingTurnaroundSigns) {
      weaknesses.push('Declining or slow growth');
    }
  }
  
  if (valuation.score >= 80) strengths.push('Attractively valued');
  else if (valuation.score < 50 && valuation.score > 0) weaknesses.push('Expensive valuation');
  
  // Don't add "weak" message if score is 0 (means insufficient data, not weak)
  if (technicalStrength.score >= 80) strengths.push('Strong technical momentum');
  else if (technicalStrength.score < 50 && technicalStrength.score > 0) weaknesses.push('Weak technical setup');
  else if (technicalStrength.score === 0) weaknesses.push('Technical analysis unavailable (insufficient data)');
  
  if (marketConfidence.score >= 80) strengths.push('High institutional confidence');
  else if (marketConfidence.score < 50 && marketConfidence.score > 0) weaknesses.push('Declining institutional interest');
  else if (marketConfidence.score === 0) weaknesses.push('Market confidence unavailable (insufficient shareholding data)');
  
  // Add momentum insight
  if (momentum.score >= 80) strengths.push('🚀 Strong price momentum - already running');
  else if (momentum.score < 40) weaknesses.push('Low momentum - stock underperforming');
  
  // Add loss-making warning
  if (isLossMaking) {
    weaknesses.push('⚠️ Company is currently loss-making');
  }
  
  // Add low data warning
  if (dataCompleteness < 70) {
    weaknesses.push(`⚠️ Limited data available (${Math.round(dataCompleteness)}% complete)`);
  }
  
  // CALCULATE RISK SCORE (0-100, higher = riskier)
  let riskScore = 0;
  let riskFactors = 0;
  
  // Factor 1: Business quality risk (inverted - low quality = high risk)
  if (businessQuality.score > 0) {
    riskFactors++;
    riskScore += (100 - businessQuality.score); // Invert: low quality = high risk
  }
  
  // Factor 2: Debt risk
  if (f.debtToEquity != null) {
    riskFactors++;
    if (f.debtToEquity > 2) riskScore += 100; // Very high debt
    else if (f.debtToEquity > 1) riskScore += 80;
    else if (f.debtToEquity > 0.5) riskScore += 50;
    else if (f.debtToEquity > 0.3) riskScore += 30;
    else riskScore += 10; // Low debt = low risk
  }
  
  // Factor 3: Loss-making premium risk
  if (isLossMaking) {
    riskFactors++;
    riskScore += 90; // High risk for loss-makers
  }
  
  // Factor 4: Valuation risk (expensive = risky)
  if (valuation.score > 0) {
    riskFactors++;
    riskScore += (100 - valuation.score); // Invert: expensive = high risk
  }
  
  // Factor 5: Institutional confidence risk
  if (marketConfidence.score > 0) {
    riskFactors++;
    const institutionalRisk = 100 - marketConfidence.score;
    // Extra penalty if FII exiting
    if (s.fiiTrendChange != null && s.fiiTrendChange < -5) {
      riskScore += Math.min(100, institutionalRisk + 20); // FII exit = higher risk
    } else {
      riskScore += institutionalRisk;
    }
  }
  
  // Factor 6: Volatility/Technical risk
  if (t.volatility != null) {
    riskFactors++;
    if (t.volatility > 50) riskScore += 80; // High volatility
    else if (t.volatility > 30) riskScore += 60;
    else if (t.volatility > 20) riskScore += 40;
    else riskScore += 20; // Low volatility = low risk
  }
  
  // Calculate final risk score
  const finalRiskScore = riskFactors > 0 ? Math.round(riskScore / riskFactors) : 50;
  
  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  if (finalRiskScore >= 75) riskLevel = 'VERY_HIGH';
  else if (finalRiskScore >= 55) riskLevel = 'HIGH';
  else if (finalRiskScore >= 35) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';
  
  // GENERATE ONE-LINE VERDICT (actionable investment summary)
  let verdict = '';
  
  if (isLossMaking) {
    // Verdict for loss-making companies
    if (investmentScoreRounded >= 70 && growth.explanation.includes('OPM improvement')) {
      verdict = 'Turnaround story with improving unit economics. High risk, but path to profitability visible. Suitable only for aggressive growth investors.';
    } else if (investmentScoreRounded >= 60) {
      verdict = 'Loss-making company with mixed operational signals. Very high risk - avoid unless you deeply understand the business model.';
    } else {
      verdict = 'Weak fundamentals with ongoing losses. Avoid - better opportunities exist with lower risk.';
    }
  } else {
    // Verdict for profitable companies
    if (rating === 'STRONG_BUY') {
      if (valuation.score >= 80 && businessQuality.score >= 85) {
        verdict = 'Exceptional quality business trading at attractive valuation. Strong buy for long-term wealth creation.';
      } else if (valuation.score >= 70) {
        verdict = 'High-quality business at fair valuation. Suitable for gradual accumulation on dips.';
      } else {
        verdict = 'Good fundamentals but valuation stretched. Better bought on 8-12% correction.';
      }
    } else if (rating === 'BUY_ZONE') {
      if (marketConfidence.score >= 75 && growth.score >= 70) {
        verdict = 'Solid business with strong institutional backing. Buy gradually, don\'t chase momentum.';
      } else if (valuation.score >= 70) {
        verdict = 'Fairly valued quality business. Accumulate on weakness, suitable for conservative portfolios.';
      } else {
        verdict = 'Decent fundamentals but most optimism already priced in. Wait for better entry (5-8% lower).';
      }
    } else if (rating === 'WATCH_ZONE') {
      if (businessQuality.score >= 80) {
        verdict = 'Excellent business but expensive. Add to watchlist, buy only on meaningful correction (10-15%).';
      } else {
        verdict = 'Average business at full valuation. Keep watching, better opportunities likely ahead.';
      }
    } else if (rating === 'WAIT') {
      if (businessQuality.score < 50) {
        verdict = 'Weak business fundamentals. Avoid - focus capital on higher-quality opportunities.';
      } else {
        verdict = 'Decent business but timing is wrong. Wait for improved technicals or cheaper valuation.';
      }
    } else { // AVOID
      verdict = 'Poor risk-reward ratio. Multiple red flags present - avoid allocation here.';
    }
  }
  
  // CALCULATE FAIR VALUE & MARGIN OF SAFETY
  let fairValue: number | null = null;
  let marginOfSafety: number | null = null;
  let fairValueMethods: { graham: number | null; peMethod: number | null; weighted: number | null } | null = null;
  
  const currentPrice = f.currentPrice || stockData.currentPrice;
  const eps = f.eps;
  const bookValue = f.bookValue;
  const peRatio = f.peRatio;
  
  if (currentPrice && eps && eps > 0) {
    // Get growth rate and ensure it's within reasonable bounds (0-25%)
    let rawGrowthRate = g.profit5Y || g.profit3Y || 15; // Default 15% if no growth data
    
    // FIX: Handle negative growth - use 5% minimum for Graham's formula
    // Graham's formula assumes growth, so for declining companies use conservative 5%
    const growthRate = Math.max(5, Math.min(25, rawGrowthRate)); // Bound between 5-25%
    
    // Detect business quality tiers for more accurate valuation
    const isPremiumBusiness = (f.roe != null && f.roe > 20) && (f.roce != null && f.roce > 25);
    
    // Detect SUPER PREMIUM businesses (consumer brands, high-quality compounders)
    // These trade at premium multiples due to brand value, moats, consistency
    const isSuperPremium = isPremiumBusiness && 
      (f.roe != null && f.roe > 18) && 
      (f.roce != null && f.roce > 22) && 
      (f.debtToEquity == null || f.debtToEquity < 0.5) && // Low/no debt
      (growthRate >= 10); // Consistent growth
    
    // Use current P/E as reference for premium businesses
    // If company historically trades at 40-50x, don't say fair value is 20x!
    const currentPE = f.peRatio || (currentPrice / eps);
    
    // Use Graham's formula: Intrinsic Value = EPS × (8.5 + 2×Growth Rate)
    const grahamValue = eps * (8.5 + (2 * growthRate));
    
    // Calculate P/E based fair value with quality adjustment
    let conservativePE = 15; // Base conservative P/E
    
    if (isSuperPremium) {
      // SUPER PREMIUM (Consumer brands, high-quality compounders)
      // Use current P/E as anchor, don't go too far below it
      if (currentPE && currentPE > 30) {
        // If trading at premium multiples, assume it deserves it
        // Fair value = 80% of current P/E (allow 20% overvaluation tolerance)
        conservativePE = Math.min(50, currentPE * 0.80); // Cap at 50x for safety
      } else {
        // High quality but not at premium yet - use growth-based
        if (growthRate >= 20) conservativePE = 35;
        else if (growthRate >= 15) conservativePE = 30;
        else if (growthRate >= 10) conservativePE = 25;
        else conservativePE = 22;
      }
    } else if (isPremiumBusiness) {
      // PREMIUM (Good quality but not super premium)
      if (growthRate >= 20) conservativePE = 25; // High growth premium → 25x P/E
      else if (growthRate >= 15) conservativePE = 22; // Good growth premium → 22x P/E
      else if (growthRate >= 10) conservativePE = 20; // Moderate growth premium → 20x P/E
      else conservativePE = 18; // Low growth but quality → 18x P/E
    } else {
      // NORMAL businesses - use lower P/E
      if (growthRate >= 20) conservativePE = 20; // High growth → 20x P/E
      else if (growthRate >= 15) conservativePE = 18; // Good growth → 18x P/E
      else if (growthRate >= 10) conservativePE = 16; // Moderate growth → 16x P/E
      else conservativePE = 14; // Low/negative growth → 14x P/E
    }
    
    const peBasedValue = eps * conservativePE;
    
    // Use average of both methods, with slight bias toward P/E method (more conservative)
    const weightedFairValue = (grahamValue * 0.4) + (peBasedValue * 0.6);
    const unflooredFairValue = Math.round(weightedFairValue);
    
    // Store breakdown for transparency
    fairValueMethods = {
      graham: Math.round(grahamValue),
      peMethod: Math.round(peBasedValue),
      weighted: unflooredFairValue,
    };
    
    fairValue = unflooredFairValue;
    
    // ADJUSTED SANITY CHECKS - more lenient for super premium businesses
    let maxMultiple = 2.5; // Normal: Can be 2.5x undervalued
    let minMultiple = 0.5; // Normal: Can be 50% overvalued (market exuberance)
    
    if (isSuperPremium) {
      maxMultiple = 1.5; // Super premium: Already priced well, can't be 2x cheap
      minMultiple = 0.80; // Super premium: Allow only 20% "overvaluation" by our calc
    } else if (isPremiumBusiness) {
      maxMultiple = 2.0; // Premium: Can be 2x undervalued
      minMultiple = 0.7; // Premium: Allow 30% "overvaluation"
    }
    
    if (fairValue > currentPrice * maxMultiple) {
      fairValue = Math.round(currentPrice * maxMultiple);
    } else if (fairValue < currentPrice * minMultiple) {
      fairValue = Math.round(currentPrice * minMultiple);
    }
    
    // Calculate margin of safety (positive = undervalued, negative = overvalued)
    marginOfSafety = ((fairValue - currentPrice) / currentPrice) * 100;
  } else if (currentPrice && bookValue && bookValue > 0) {
    // Fallback: Use P/B based valuation
    // Check if this is a premium quality business
    const isPremiumBusiness = (f.roe != null && f.roe > 20) && (f.roce != null && f.roce > 25);
    
    // Premium businesses deserve higher P/B multiples
    const conservativePB = isPremiumBusiness ? 4 : 3;
    fairValue = Math.round(bookValue * conservativePB);
    
    // Sanity check for P/B method with quality adjustment
    const maxMultiple = isPremiumBusiness ? 2.0 : 2.5;
    const minMultiple = isPremiumBusiness ? 0.7 : 0.5;
    
    if (fairValue > currentPrice * maxMultiple) {
      fairValue = Math.round(currentPrice * maxMultiple);
    } else if (fairValue < currentPrice * minMultiple) {
      fairValue = Math.round(currentPrice * minMultiple);
    }
    
    marginOfSafety = ((fairValue - currentPrice) / currentPrice) * 100;
  }
  
  // SCORE BREAKDOWN - Why not higher?
  const positiveContributors: Array<{factor: string; impact: number}> = [];
  const negativeContributors: Array<{factor: string; impact: number}> = [];
  
  // Analyze each pillar's contribution
  if (businessQuality.score >= 80) {
    positiveContributors.push({factor: 'Excellent Business Quality', impact: businessQuality.score - 80});
  } else if (businessQuality.score < 50) {
    negativeContributors.push({factor: 'Weak Business Quality', impact: 50 - businessQuality.score});
  }
  
  if (growth.score >= 80) {
    positiveContributors.push({factor: 'Strong Growth', impact: growth.score - 80});
  } else if (growth.score < 50) {
    negativeContributors.push({factor: 'Slow/Declining Growth', impact: 50 - growth.score});
  }
  
  if (valuation.score >= 80) {
    positiveContributors.push({factor: 'Attractive Valuation', impact: valuation.score - 80});
  } else if (valuation.score < 50) {
    negativeContributors.push({factor: 'Expensive Valuation', impact: 50 - valuation.score});
  }
  
  if (technicalStrength.score >= 70) {
    positiveContributors.push({factor: 'Strong Technicals', impact: Math.round((technicalStrength.score - 70) * 0.75)});
  } else if (technicalStrength.score < 40 && technicalStrength.score > 0) {
    negativeContributors.push({factor: 'Weak Technicals', impact: Math.round((40 - technicalStrength.score) * 0.75)});
  }
  
  if (marketConfidence.score >= 75) {
    positiveContributors.push({factor: 'Strong Institutional Support', impact: Math.round((marketConfidence.score - 75) * 0.5)});
  } else if (marketConfidence.score < 40 && marketConfidence.score > 0) {
    negativeContributors.push({factor: 'Weak Institutional Interest', impact: Math.round((40 - marketConfidence.score) * 0.5)});
  }
  
  // Price position
  const distanceFrom52WHigh = stockData.technicals?.distanceFrom52WHigh;
  if (distanceFrom52WHigh != null && distanceFrom52WHigh > -5) {
    negativeContributors.push({factor: 'Near 52-Week High', impact: 5});
  } else if (distanceFrom52WHigh != null && distanceFrom52WHigh < -15) {
    positiveContributors.push({factor: 'Below 52-Week High', impact: 3});
  }
  
  // Sort by impact
  positiveContributors.sort((a, b) => b.impact - a.impact);
  negativeContributors.sort((a, b) => b.impact - a.impact);
  
  // BUY DECISION - "Can I Buy Today?"
  const positiveReasons: string[] = [];
  const negativeReasons: string[] = [];
  
  if (businessQuality.score >= 80) positiveReasons.push('Excellent business quality');
  else if (businessQuality.score >= 60) positiveReasons.push('Good business quality');
  else negativeReasons.push('Weak business fundamentals');
  
  if (growth.score >= 70) positiveReasons.push('Strong growth trajectory');
  else if (growth.score < 40) negativeReasons.push('Slow or declining growth');
  
  if (valuation.score >= 70) positiveReasons.push('Attractive valuation');
  else if (valuation.score < 50) negativeReasons.push('Expensive valuation');
  
  if (marketConfidence.score >= 70) positiveReasons.push('Strong institutional backing');
  else if (marketConfidence.score < 40) negativeReasons.push('Weak institutional interest');
  
  if (distanceFrom52WHigh != null && distanceFrom52WHigh > -5) {
    negativeReasons.push('Near 52-week high');
  }
  
  if (s.fiiTrendChange != null && s.fiiTrendChange < -5) {
    negativeReasons.push('FII exiting (red flag)');
  } else if (s.fiiTrendChange != null && s.fiiTrendChange > 3) {
    positiveReasons.push('FII accumulating');
  }
  
  if (isLossMaking) {
    negativeReasons.push('Company is loss-making');
    if (growth.explanation.includes('OPM improvement')) {
      positiveReasons.push('Margins improving (turnaround potential)');
    }
  }
  
  const canBuyToday = investmentScoreRounded >= 75 && negativeReasons.length <= positiveReasons.length;
  
  // Calculate 3 entry zones for better guidance
  let recommendation = '';
  if (canBuyToday) {
    recommendation = 'Yes, suitable for accumulation at current levels';
  } else if (investmentScoreRounded >= 70) {
    // Good quality, wait for small dip
    const technicalEntry = currentPrice ? Math.round(currentPrice * 0.95) : null;
    recommendation = `Wait for 5% dip to ${technicalEntry ? '₹' + technicalEntry : 'better levels'}`;
  } else if (investmentScoreRounded >= 60) {
    // Decent quality, wait for moderate correction
    const valueEntry = currentPrice ? Math.round(currentPrice * 0.90) : null;
    recommendation = `Wait for 10% correction to ${valueEntry ? '₹' + valueEntry : 'better levels'}`;
  } else if (investmentScoreRounded >= 50) {
    // Average quality, need significant discount
    const deepValueEntry = currentPrice ? Math.round(currentPrice * 0.85) : null;
    recommendation = `Wait for 15% correction to ${deepValueEntry ? '₹' + deepValueEntry : 'better levels'}`;
  } else {
    recommendation = 'Avoid - better opportunities available';
  }
  
  // CONFIDENCE LEVEL
  let confidenceScore = Math.round(dataCompleteness);
  
  // Adjust based on data quality
  if (businessQuality.score === 0 || growth.score === 0) confidenceScore -= 20;
  if (valuation.score === 0) confidenceScore -= 15;
  if (marketConfidence.score === 0) confidenceScore -= 10;
  if (technicalStrength.score === 0) confidenceScore -= 5;
  
  // Boost for comprehensive data
  if (dataCompleteness >= 90 && !isLossMaking) confidenceScore = Math.min(100, confidenceScore + 5);
  
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));
  
  // Convert to High/Medium/Low
  let confidenceLevel: 'High' | 'Medium' | 'Low';
  let confidenceExplanation: string;
  
  if (confidenceScore >= 75) {
    confidenceLevel = 'High';
    const reasons: string[] = [];
    if (dataCompleteness >= 90) reasons.push('Complete financials');
    if (q && q.length >= 4) reasons.push(`${q.length} quarters analyzed`);
    if (technicalStrength.score > 0) reasons.push('Technicals available');
    if (marketConfidence.score > 0) reasons.push('Institutional data available');
    confidenceExplanation = reasons.length > 0 
      ? reasons.join(' • ') 
      : 'Comprehensive data available';
  } else if (confidenceScore >= 50) {
    confidenceLevel = 'Medium';
    const gaps: string[] = [];
    if (dataCompleteness < 75) gaps.push('Some financial data missing');
    if (technicalStrength.score === 0) gaps.push('No technical data');
    if (marketConfidence.score === 0) gaps.push('Limited institutional data');
    confidenceExplanation = gaps.length > 0
      ? gaps.join(' • ')
      : 'Partial data available';
  } else {
    confidenceLevel = 'Low';
    confidenceExplanation = dataCompleteness < 50 
      ? 'Insufficient financial data for reliable analysis'
      : 'Multiple key data points missing';
  }
  
  // WHY NOW? - Single decision card
  let businessQualityLabel: 'Excellent' | 'Good' | 'Average' | 'Poor';
  if (businessQualityScore >= 85) businessQualityLabel = 'Excellent';
  else if (businessQualityScore >= 70) businessQualityLabel = 'Good';
  else if (businessQualityScore >= 50) businessQualityLabel = 'Average';
  else businessQualityLabel = 'Poor';
  
  let priceValuationLabel: 'Cheap' | 'Fair' | 'Expensive' | 'Very Expensive';
  if (marginOfSafety && marginOfSafety > 20) priceValuationLabel = 'Cheap';
  else if (marginOfSafety && marginOfSafety > 0) priceValuationLabel = 'Fair';
  else if (marginOfSafety && marginOfSafety > -20) priceValuationLabel = 'Expensive';
  else priceValuationLabel = 'Very Expensive';
  
  let technicalSetupLabel: 'Bullish' | 'Neutral' | 'Bearish';
  if (technicalStrength.score >= 70) technicalSetupLabel = 'Bullish';
  else if (technicalStrength.score >= 45) technicalSetupLabel = 'Neutral';
  else technicalSetupLabel = 'Bearish';
  
  let overallVerdict: 'BUY' | 'WATCH' | 'AVOID';
  let whyNowReasoning: string;
  
  // Build specific reasoning with data points
  const reasoningParts: string[] = [];
  
  if (rating === 'STRONG_BUY' || rating === 'BUY_ZONE') {
    overallVerdict = 'BUY';
    
    // Add specific valuation context
    if (marginOfSafety && marginOfSafety > 15) {
      reasoningParts.push(`Trading ${Math.abs(marginOfSafety).toFixed(0)}% below fair value`);
    } else if (marginOfSafety && marginOfSafety > 0) {
      reasoningParts.push('Near fair value');
    }
    
    // Add quality metrics
    if (f.roe && f.roe > 20) reasoningParts.push(`Strong ROE (${f.roe.toFixed(0)}%)`);
    if (f.roce && f.roce > 25) reasoningParts.push(`High ROCE (${f.roce.toFixed(0)}%)`);
    
    // Add institutional signal
    if (s.fiiTrendChange && s.fiiTrendChange > 3) reasoningParts.push('FII buying');
    if (s.diiTrendChange && s.diiTrendChange > 3) reasoningParts.push('DII accumulating');
    
    whyNowReasoning = reasoningParts.length > 0 
      ? reasoningParts.join('. ') + '. Good entry opportunity.'
      : 'Solid fundamentals support current valuation.';
      
  } else if (rating === 'WATCH_ZONE') {
    overallVerdict = 'WATCH';
    
    // Add specific concerns
    if (marginOfSafety && marginOfSafety < -15) {
      reasoningParts.push(`Trading ${Math.abs(marginOfSafety).toFixed(0)}% above fair value`);
    }
    
    // Add 52W high context
    if (distanceFrom52WHigh != null && distanceFrom52WHigh > -10) {
      reasoningParts.push(`Near 52W high (${(100 + distanceFrom52WHigh).toFixed(0)}%)`);
    }
    
    // Add institutional signal
    if (s.fiiTrendChange && s.fiiTrendChange < -3) reasoningParts.push('FII selling');
    
    // Add quality note
    if (businessQualityLabel === 'Excellent' || businessQualityLabel === 'Good') {
      reasoningParts.push('Quality business');
    }
    
    whyNowReasoning = reasoningParts.length > 0
      ? reasoningParts.join('. ') + '. Wait for correction.'
      : 'Average quality at full valuation. Monitor for dips.';
      
  } else if (rating === 'WAIT') {
    // WAIT zone (50-64): Decent fundamentals but poor timing
    overallVerdict = 'WATCH';
    
    // Add specific timing concerns
    if (marginOfSafety && marginOfSafety < -20) {
      reasoningParts.push(`Trading ${Math.abs(marginOfSafety).toFixed(0)}% above fair value`);
    }
    if (distanceFrom52WHigh != null && distanceFrom52WHigh > -10) {
      reasoningParts.push(`Near 52W high`);
    }
    if (s.fiiTrendChange && s.fiiTrendChange < -3) reasoningParts.push('FII selling');
    
    // Note quality if decent
    if (businessQualityLabel === 'Excellent' || businessQualityLabel === 'Good') {
      reasoningParts.push('Quality business');
    }
    
    whyNowReasoning = reasoningParts.length > 0
      ? reasoningParts.join('. ') + '. Wait for better entry.'
      : 'Mixed signals. Monitor for improvement.';
      
  } else {
    // AVOID (<50): Poor fundamentals or severe overvaluation
    overallVerdict = 'AVOID';
    
    // Add specific concerns
    if (isLossMaking) reasoningParts.push('Loss-making');
    if (f.debtToEquity && f.debtToEquity > 1.5) reasoningParts.push('High debt');
    if (marginOfSafety && marginOfSafety < -40) reasoningParts.push('Severely overvalued');
    if (businessQualityLabel === 'Poor') reasoningParts.push('Weak fundamentals');
    
    whyNowReasoning = reasoningParts.length > 0
      ? reasoningParts.join('. ') + '. Better opportunities available.'
      : 'Timing is poor. Risks outweigh rewards currently.';
  }
  
  const whyNow = {
    businessQuality: businessQualityLabel,
    priceValuation: priceValuationLabel,
    technicalSetup: technicalSetupLabel,
    overallVerdict,
    reasoning: whyNowReasoning,
  };
  
  // CATALYSTS - Positive drivers (based on strengths)
  const catalysts: string[] = [];
  if (f.roe != null && f.roe > 25) catalysts.push('High ROE indicates efficient capital allocation');
  if (f.roce != null && f.roce > 30) catalysts.push('Strong ROCE shows competitive advantage');
  if (g.sales5Y && g.sales5Y > 20) catalysts.push('Revenue growing rapidly');
  if (g.profit5Y && g.profit5Y > 20) catalysts.push('Profit growth accelerating');
  if (s.fiiTrendChange && s.fiiTrendChange > 2) catalysts.push('FII accumulation trend');
  if (s.diiTrendChange && s.diiTrendChange > 2) catalysts.push('DII buying interest');
  if (f.debtToEquity != null && f.debtToEquity < 0.3) catalysts.push('Low debt provides flexibility');
  if (stockData.cashFlow && stockData.cashFlow.fcf && stockData.cashFlow.fcf > 0) catalysts.push('Positive free cash flow generation');
  
  // RISKS - Key concerns (based on weaknesses)
  const risks: string[] = [];
  if (f.debtToEquity != null && f.debtToEquity > 1.5) risks.push('High debt levels');
  if (g.profit3Y && g.profit3Y < 0) risks.push('Declining profitability');
  if (s.promoterTrendChange && s.promoterTrendChange < -2) risks.push('Promoter stake reduction');
  if (s.fiiTrendChange && s.fiiTrendChange < -3) risks.push('FII selling pressure');
  if (marginOfSafety && marginOfSafety < -30) risks.push('Significantly overvalued');
  if (isLossMaking) risks.push('Currently loss-making');
  if (valuation.score < 40) risks.push('Expensive valuation');
  if (technicalStrength.score < 35) risks.push('Weak technical setup');
  
  
  return {
    // HEADLINE SCORES (what users care about)
    businessQualityScore,
    growthPotentialScore,
    investmentScore: investmentScoreRounded,
    momentumScore,
    riskScore: finalRiskScore,
    riskLevel,
    
    // Legacy field for backward compatibility
    totalScore: investmentScoreRounded,
    pillars: {
      businessQuality: Math.round(businessQuality.score * 0.30),
      growth: Math.round(growth.score * 0.25),
      valuation: Math.round(valuation.score * 0.20),
      technicalStrength: Math.round(technicalStrength.score * 0.15),
      marketConfidence: Math.round(marketConfidence.score * 0.10),
    },
    pillarScores: {
      businessQuality: Math.round(businessQuality.score),
      growth: Math.round(growth.score),
      valuation: Math.round(valuation.score),
      technicalStrength: Math.round(technicalStrength.score),
      marketConfidence: Math.round(marketConfidence.score),
      momentum: Math.round(momentum.score),
    },
    rating,
    strengths,
    weaknesses,
    dataCompleteness: Math.round(dataCompleteness),
    isLossMaking,
    verdict,
    
    // Decision Framework
    buyDecision: {
      canBuyToday,
      reasons: {
        positive: positiveReasons,
        negative: negativeReasons,
      },
      recommendation,
    },
    
    // Score Breakdown
    scoreBreakdown: {
      positiveContributors,
      negativeContributors,
    },
    
    // Fair Value Analysis
    fairValue,
    marginOfSafety,
    fairValueMethods,
    
    // Confidence
    confidenceLevel,
    confidenceScore,
    confidenceExplanation,
    
    // WHY NOW? Decision Summary
    whyNow,
    
    // Catalysts & Risks
    catalysts,
    risks,
    
    scoringDetails: {
      businessQuality: businessQuality.explanation,
      growth: growth.explanation,
      valuation: valuation.explanation,
      technical: technicalStrength.explanation,
      confidence: marketConfidence.explanation,
      momentum: momentum.explanation,
    },
  };
}

// Helper: Calculate what % of key data points are available
function calculateDataCompleteness(f: any, g: any, s: any, t: any, q: any[]): number {
  let available = 0;
  let total = 0;
  
  // Fundamental data (most important)
  total += 8;
  if (f.roe != null) available++;
  if (f.roce != null) available++;
  if (f.debtToEquity != null) available++;
  if (f.peRatio != null) available++;
  if (f.pbRatio != null) available++;
  if (f.marketCap != null) available++;
  if (f.fiftyTwoWeekHigh != null) available++;
  if (f.fiftyTwoWeekLow != null) available++;
  
  // Growth data
  total += 4;
  if (g.sales5Y != null) available++;
  if (g.profit5Y != null) available++;
  if (g.sales3Y != null) available++;
  if (g.profit3Y != null) available++;
  
  // Shareholding data
  total += 3;
  if (s.promoter != null) available++;
  if (s.fii != null) available++;
  if (s.dii != null) available++;
  
  // Technical data
  total += 4;
  if (t.rsi != null) available++;
  if (t.sma200 != null) available++;
  if (t.sma50 != null) available++;
  if (t.sma20 != null) available++;
  
  // Quarterly data
  total += 1;
  if (q && q.length >= 2) available++;
  
  return (available / total) * 100;
}

// Helper: Create a score for stocks with insufficient data
function createInsufficientDataScore(dataCompleteness: number, company: string): StockScore {
  return {
    // HEADLINE SCORES
    businessQualityScore: 0,
    growthPotentialScore: 0,
    investmentScore: 0,
    momentumScore: 0,
    riskScore: 100, // Maximum risk for insufficient data
    riskLevel: 'VERY_HIGH',
    
    totalScore: 0,
    pillars: {
      businessQuality: 0,
      growth: 0,
      valuation: 0,
      technicalStrength: 0,
      marketConfidence: 0,
    },
    pillarScores: {
      businessQuality: 0,
      growth: 0,
      valuation: 0,
      technicalStrength: 0,
      marketConfidence: 0,
      momentum: 0,
    },
    rating: 'AVOID',
    strengths: [],
    weaknesses: [
      `❌ Insufficient data for ${company}`,
      `Only ${Math.round(dataCompleteness)}% of required data available`,
      'Cannot provide reliable investment recommendation',
    ],
    dataCompleteness: Math.round(dataCompleteness),
    isLossMaking: false,
    verdict: `Insufficient data to analyze ${company}. Cannot provide reliable investment recommendation - avoid until more data is available.`,
    
    // Decision Framework
    buyDecision: {
      canBuyToday: false,
      reasons: {
        positive: [],
        negative: ['Insufficient data available'],
      },
      recommendation: 'Avoid - insufficient data for analysis',
    },
    
    // Score Breakdown
    scoreBreakdown: {
      positiveContributors: [],
      negativeContributors: [{factor: 'Insufficient Data', impact: 100}],
    },
    
    // Fair Value Analysis
    fairValue: null,
    marginOfSafety: null,
    fairValueMethods: null,
    
    // Confidence
    confidenceLevel: 'Low',
    confidenceScore: Math.round(dataCompleteness),
    confidenceExplanation: 'Insufficient data available for reliable analysis',
    
    // WHY NOW
    whyNow: {
      businessQuality: 'Poor',
      priceValuation: 'Expensive',
      technicalSetup: 'Bearish',
      overallVerdict: 'AVOID',
      reasoning: 'Insufficient data available for reliable analysis.',
    },
    
    // Catalysts & Risks
    catalysts: [],
    risks: ['Insufficient data available'],
    
    scoringDetails: {
      businessQuality: 'Insufficient data',
      growth: 'Insufficient data',
      valuation: 'Insufficient data',
      technical: 'Insufficient data',
      confidence: 'Insufficient data',
      momentum: 'Insufficient data',
    },
  };
}

// PILLAR 1: BUSINESS QUALITY (0-100)
// Comprehensive evaluation with 10+ parameters including cash generation
function calculateBusinessQuality(fundamentals: any, compoundedGrowth: any, shareholding: any, quarterlyResults: any[], cashFlow: any, balanceSheet: any, isLossMaking: boolean, peerMetrics: any = null): { score: number; explanation: string } {
  let score = 0;
  let factors = 0;
  const details: string[] = [];
  
  // If loss-making, cap business quality at 40
  if (isLossMaking) {
    details.push('⚠️ Loss-making company (negative ROE/ROCE)');
  }
  
  // 1. ROE (Return on Equity) - Use weighted (60% 3Y, 40% 5Y) when available, fallback to current year
  // Recent profitability matters more than old history!
  let roeToUse: number | null = null;
  let roeDisplayText = '';
  
  if (compoundedGrowth.roe3Y != null || compoundedGrowth.roe5Y != null) {
    // Use historical weighted ROE
    if (compoundedGrowth.roe3Y != null && compoundedGrowth.roe5Y != null) {
      roeToUse = (compoundedGrowth.roe3Y * 0.6) + (compoundedGrowth.roe5Y * 0.4);
      roeDisplayText = `3Y: ${compoundedGrowth.roe3Y.toFixed(1)}%, 5Y: ${compoundedGrowth.roe5Y.toFixed(1)}%, Weighted: ${roeToUse.toFixed(1)}%`;
      
      // Warn if deteriorating
      const deterioration = compoundedGrowth.roe5Y - compoundedGrowth.roe3Y;
      if (deterioration > 5) {
        details.push(`🚨 ROE DECLINING: ${roeDisplayText}`);
      }
    } else if (compoundedGrowth.roe3Y != null) {
      roeToUse = compoundedGrowth.roe3Y;
      roeDisplayText = `3Y: ${compoundedGrowth.roe3Y.toFixed(1)}%`;
    } else if (compoundedGrowth.roe5Y != null) {
      roeToUse = compoundedGrowth.roe5Y;
      roeDisplayText = `5Y: ${compoundedGrowth.roe5Y.toFixed(1)}%`;
    }
  } else if (fundamentals.roe != null) {
    // Fallback to current year ROE
    roeToUse = fundamentals.roe;
    roeDisplayText = `${fundamentals.roe.toFixed(1)}%`;
  }
  
  if (roeToUse != null) {
    factors++;
    
    // TRY PERCENTILE-BASED SCORING FIRST (if peer data available)
    let roeScore = 0;
    if (peerMetrics && peerMetrics.roe && roeToUse >= 0) {
      const percentile = calculatePercentile(roeToUse, peerMetrics.roe, true);
      if (percentile != null) {
        roeScore = percentileToScore(percentile);
        details.push(`✅ ROE: ${roeDisplayText} (${percentile}th percentile in sector)`);
        score += roeScore;
      } else {
        // Fall back to fixed thresholds
        roeScore = getRoeFixedScore(roeToUse, roeDisplayText, details, compoundedGrowth, isLossMaking);
        score += roeScore;
      }
    } else {
      // Use fixed thresholds (no peer data or loss-making)
      roeScore = getRoeFixedScore(roeToUse, roeDisplayText, details, compoundedGrowth, isLossMaking);
      score += roeScore;
    }
  } else {
    details.push('⚠ ROE data not available');
  }
  
  // Helper function for ROE fixed threshold scoring
  function getRoeFixedScore(roeVal: number, displayText: string, detailsArr: string[], growth: any, lossMaking: boolean): number {
    // FOR LOSS-MAKING COMPANIES: Check if ROE is IMPROVING even while negative
    // -102% → -84% is a +18pp improvement = turnaround signal!
    if (roeVal < 0 && growth.roe3Y != null && growth.roe5Y != null) {
      const roeImprovement = growth.roe3Y - growth.roe5Y; // -84 - (-102) = +18pp
      
      if (roeImprovement >= 20) {
        detailsArr.push(`✓ ROE improving strongly: ${displayText} (+${roeImprovement.toFixed(1)}pp - turnaround trajectory)`);
        return 50; // Strong improvement despite still negative
      } else if (roeImprovement >= 10) {
        detailsArr.push(`✓ ROE improving: ${displayText} (+${roeImprovement.toFixed(1)}pp improvement)`);
        return 40; // Good improvement
      } else if (roeImprovement >= 5) {
        detailsArr.push(`○ ROE improving moderately: ${displayText} (+${roeImprovement.toFixed(1)}pp)`);
        return 30; // Moderate improvement
      } else if (roeImprovement > 0) {
        detailsArr.push(`○ ROE improving slightly: ${displayText} (+${roeImprovement.toFixed(1)}pp)`);
        return 20; // Slight improvement
      } else {
        detailsArr.push(`❌ Negative ROE worsening: ${displayText}`);
        return 0; // Deteriorating or flat
      }
    } else if (roeVal >= 18) {
      detailsArr.push(`✅ Excellent ROE: ${displayText}`);
      return 100;
    } else if (roeVal >= 15) {
      detailsArr.push(`✓ Good ROE: ${displayText}`);
      return 80;
    } else if (roeVal >= 12) {
      detailsArr.push(`○ Moderate ROE: ${displayText}`);
      return 60;
    } else if (roeVal >= 8) {
      detailsArr.push(`⚠ Below-average ROE: ${displayText}`);
      return 40;
    } else if (roeVal >= 0) {
      detailsArr.push(`⚠ Weak ROE: ${displayText}`);
      return 20;
    } else {
      // Negative ROE without trend data
      detailsArr.push(`❌ Negative ROE: ${displayText}`);
      return 0;
    }
  }
  
  // 2. ROCE (Return on Capital Employed) - Target: >20% = 100 points
  // FOR LOSS-MAKING COMPANIES: If ROCE is better than ROE, it's a positive signal!
  if (fundamentals.roce != null) {
    factors++;
    
    // Check if ROCE is improving relative to ROE (for loss-makers)
    if (fundamentals.roce < 0 && roeToUse != null && roeToUse < 0) {
      const roceVsRoe = fundamentals.roce - roeToUse; // e.g., -19.8 - (-91.2) = +71.4pp
      
      // If ROCE is MUCH better than ROE, capital is being used more efficiently
      if (roceVsRoe >= 50) {
        score += 60; // Strong signal - operational business much better than equity structure
        details.push(`✓ ROCE much better than ROE: ${fundamentals.roce.toFixed(1)}% vs ${roeToUse.toFixed(1)}% (+${roceVsRoe.toFixed(1)}pp - capital efficiency improving)`);
      } else if (roceVsRoe >= 30) {
        score += 50; // Good signal
        details.push(`✓ ROCE better than ROE: ${fundamentals.roce.toFixed(1)}% vs ${roeToUse.toFixed(1)}% (+${roceVsRoe.toFixed(1)}pp)`);
      } else if (roceVsRoe >= 10) {
        score += 40; // Moderate improvement
        details.push(`○ ROCE improving vs ROE: ${fundamentals.roce.toFixed(1)}% vs ${roeToUse.toFixed(1)}% (+${roceVsRoe.toFixed(1)}pp)`);
      } else if (roceVsRoe > 0) {
        score += 30; // Slight improvement
        details.push(`○ ROCE slightly better: ${fundamentals.roce.toFixed(1)}% vs ROE ${roeToUse.toFixed(1)}%`);
      } else {
        score += 0; // ROCE worse than ROE - very bad sign
        details.push(`❌ Negative ROCE worse than ROE: ${fundamentals.roce.toFixed(1)}%`);
      }
    } else {
      // TRY PERCENTILE-BASED SCORING (if peer data available and profitable)
      let roceScore = 0;
      if (peerMetrics && peerMetrics.roce && fundamentals.roce >= 0) {
        const percentile = calculatePercentile(fundamentals.roce, peerMetrics.roce, true);
        if (percentile != null) {
          roceScore = percentileToScore(percentile);
          details.push(`✅ ROCE: ${fundamentals.roce.toFixed(1)}% (${percentile}th percentile in sector)`);
          score += roceScore;
        } else {
          // Fall back to fixed thresholds
          roceScore = getRoceFixedScore(fundamentals.roce, details);
          score += roceScore;
        }
      } else {
        // Use fixed thresholds (no peer data)
        roceScore = getRoceFixedScore(fundamentals.roce, details);
        score += roceScore;
      }
    }
  } else {
    details.push('⚠ ROCE data not available');
  }
  
  // Helper function for ROCE fixed threshold scoring
  function getRoceFixedScore(roceVal: number, detailsArr: string[]): number {
    if (roceVal >= 20) {
      detailsArr.push(`✅ Excellent ROCE: ${roceVal.toFixed(1)}%`);
      return 100;
    } else if (roceVal >= 15) {
      detailsArr.push(`✓ Good ROCE: ${roceVal.toFixed(1)}%`);
      return 80;
    } else if (roceVal >= 12) {
      detailsArr.push(`○ Moderate ROCE: ${roceVal.toFixed(1)}%`);
      return 60;
    } else if (roceVal >= 8) {
      detailsArr.push(`⚠ Below-average ROCE: ${roceVal.toFixed(1)}%`);
      return 40;
    } else if (roceVal >= 0) {
      detailsArr.push(`⚠ Weak ROCE: ${roceVal.toFixed(1)}%`);
      return 20;
    } else {
      // Negative ROCE without ROE comparison
      detailsArr.push(`❌ Negative ROCE: ${roceVal.toFixed(1)}%`);
      return 0;
    }
  }
  
  // 3. Debt to Equity - Target: <0.5 = 100 points (lower is better)
  if (fundamentals.debtToEquity != null) {
    factors++;
    if (fundamentals.debtToEquity <= 0.5) {
      score += 100;
      details.push(`✅ Low debt: D/E = ${fundamentals.debtToEquity.toFixed(2)}`);
    } else if (fundamentals.debtToEquity <= 1.0) {
      score += 80;
      details.push(`✓ Manageable debt: D/E = ${fundamentals.debtToEquity.toFixed(2)}`);
    } else if (fundamentals.debtToEquity <= 1.5) {
      score += 50;
      details.push(`○ Moderate debt: D/E = ${fundamentals.debtToEquity.toFixed(2)}`);
    } else if (fundamentals.debtToEquity <= 2.0) {
      score += 30;
      details.push(`⚠ High debt: D/E = ${fundamentals.debtToEquity.toFixed(2)}`);
    } else {
      score += 10;
      details.push(`❌ Very high debt: D/E = ${fundamentals.debtToEquity.toFixed(2)}`);
    }
  } else {
    details.push('⚠ Debt/Equity data not available');
  }
  
  // 3a. Debt Trend (Balance Sheet) - Track if borrowings are increasing/decreasing
  // CRITICAL for loss-making companies: Reducing debt while loss-making = excellent financial discipline!
  if (balanceSheet.borrowings && Object.keys(balanceSheet.borrowings).length >= 2) {
    const years = Object.keys(balanceSheet.borrowings).sort();
    const borrowingsValues = years.map(y => balanceSheet.borrowings[y]);
    
    if (borrowingsValues.length >= 2) {
      factors++;
      
      const oldestDebt = borrowingsValues[0];
      const latestDebt = borrowingsValues[borrowingsValues.length - 1];
      const debtChange = ((latestDebt - oldestDebt) / Math.abs(oldestDebt || 1)) * 100;
      
      // For loss-making companies, give EXTRA credit for debt reduction
      const bonusForLossMakers = isLossMaking ? 1.5 : 1.0;
      
      if (debtChange <= -30) {
        score += 100 * bonusForLossMakers; // Massive debt reduction
        details.push(`✅ Debt reduced significantly: ₹${oldestDebt} Cr → ₹${latestDebt} Cr (${Math.abs(debtChange).toFixed(1)}% reduction${isLossMaking ? ' - exceptional discipline despite losses!' : ''})`);
      } else if (debtChange <= -15) {
        score += 85 * bonusForLossMakers; // Strong debt reduction
        details.push(`✓ Debt reduced: ₹${oldestDebt} Cr → ₹${latestDebt} Cr (${Math.abs(debtChange).toFixed(1)}% reduction${isLossMaking ? ' despite losses' : ''})`);
      } else if (debtChange <= -5) {
        score += 70 * bonusForLossMakers; // Moderate debt reduction
        details.push(`✓ Debt decreasing: ₹${oldestDebt} Cr → ₹${latestDebt} Cr (${Math.abs(debtChange).toFixed(1)}% reduction)`);
      } else if (debtChange <= 5) {
        score += 60; // Stable debt
        details.push(`○ Debt stable: ₹${latestDebt} Cr (${Math.abs(debtChange).toFixed(1)}% change)`);
      } else if (debtChange <= 20) {
        score += 40; // Moderate debt increase
        details.push(`○ Debt increasing moderately: ₹${oldestDebt} Cr → ₹${latestDebt} Cr (+${debtChange.toFixed(1)}%)`);
      } else if (debtChange <= 50 && !isLossMaking) {
        score += 30; // High increase but acceptable if profitable (expansion)
        details.push(`⚠ Debt increasing: ₹${oldestDebt} Cr → ₹${latestDebt} Cr (+${debtChange.toFixed(1)}% - expansion phase)`);
      } else {
        score += 10; // Very high debt increase - concern
        details.push(`❌ Debt surging: ₹${oldestDebt} Cr → ₹${latestDebt} Cr (+${debtChange.toFixed(1)}%${isLossMaking ? ' - red flag for loss-maker!' : ''})`);
      }
    }
  }
  
  // 4. Promoter Holding - Target: >50% and stable/increasing = 100 points
  if (shareholding.promoter != null) {
    factors++;
    if (shareholding.promoter >= 50) {
      if (shareholding.promoterTrend?.includes('Increasing')) {
        score += 100;
        details.push(`✅ High & rising promoter stake: ${shareholding.promoter.toFixed(1)}%`);
      } else if (shareholding.promoterTrend?.includes('Stable')) {
        score += 90;
        details.push(`✓ High & stable promoter stake: ${shareholding.promoter.toFixed(1)}%`);
      } else {
        score += 70;
        details.push(`○ High promoter stake: ${shareholding.promoter.toFixed(1)}%`);
      }
    } else if (shareholding.promoter >= 40) {
      score += 60;
      details.push(`○ Moderate promoter stake: ${shareholding.promoter.toFixed(1)}%`);
    } else if (shareholding.promoter >= 30) {
      score += 40;
      details.push(`⚠ Below-average promoter stake: ${shareholding.promoter.toFixed(1)}%`);
    } else {
      score += 20;
      details.push(`⚠ Low promoter stake: ${shareholding.promoter.toFixed(1)}%`);
    }
  } else {
    details.push('⚠ Promoter holding data not available');
  }
  
  // 5. Operating Profit Margin - Calculate from quarterly results
  if (quarterlyResults && quarterlyResults.length > 0) {
    const latest = quarterlyResults[quarterlyResults.length - 1];
    if (latest.sales && latest.operatingProfit) {
      factors++;
      const opm = (latest.operatingProfit / latest.sales) * 100;
      if (opm >= 20) {
        score += 100;
        details.push(`✅ Excellent OPM: ${opm.toFixed(1)}%`);
      } else if (opm >= 15) {
        score += 80;
        details.push(`✓ Good OPM: ${opm.toFixed(1)}%`);
      } else if (opm >= 10) {
        score += 60;
        details.push(`○ Moderate OPM: ${opm.toFixed(1)}%`);
      } else if (opm >= 5) {
        score += 40;
        details.push(`⚠ Low OPM: ${opm.toFixed(1)}%`);
      } else {
        score += 20;
        details.push(`⚠ Very low OPM: ${opm.toFixed(1)}%`);
      }
    }
  }
  
  // 6. Net Profit Margin - Calculate from quarterly results
  if (quarterlyResults && quarterlyResults.length > 0) {
    const latest = quarterlyResults[quarterlyResults.length - 1];
    if (latest.sales && latest.netProfit) {
      factors++;
      const npm = (latest.netProfit / latest.sales) * 100;
      if (npm >= 15) {
        score += 100;
        details.push(`✅ Excellent NPM: ${npm.toFixed(1)}%`);
      } else if (npm >= 10) {
        score += 80;
        details.push(`✓ Good NPM: ${npm.toFixed(1)}%`);
      } else if (npm >= 5) {
        score += 60;
        details.push(`○ Moderate NPM: ${npm.toFixed(1)}%`);
      } else if (npm >= 2) {
        score += 40;
        details.push(`⚠ Low NPM: ${npm.toFixed(1)}%`);
      } else if (npm >= 0) {
        score += 20;
        details.push(`⚠ Very low NPM: ${npm.toFixed(1)}%`);
      } else {
        score += 0;
        details.push(`❌ Negative NPM: ${npm.toFixed(1)}%`);
      }
    }
  }
  
  // 7. Earnings Consistency - Check quarterly profit volatility
  if (quarterlyResults && quarterlyResults.length >= 4) {
    const profits = quarterlyResults.slice(-4).map(q => q.netProfit).filter(p => p != null && Math.abs(p) > 0.1);
    if (profits.length >= 4) {
      factors++;
      const avgProfit = profits.reduce((sum, p) => sum + p, 0) / profits.length;
      const variance = profits.reduce((sum, p) => sum + Math.pow(p - avgProfit, 2), 0) / profits.length;
      const stdDev = Math.sqrt(variance);
      
      // Only calculate CV if avgProfit is meaningful (not near zero)
      if (Math.abs(avgProfit) > 10) { // At least ₹10 Cr average profit
        const coefficientOfVariation = (stdDev / Math.abs(avgProfit)) * 100;
        
        if (coefficientOfVariation < 10) {
          score += 100;
          details.push(`✅ Very consistent earnings (CV: ${coefficientOfVariation.toFixed(1)}%)`);
        } else if (coefficientOfVariation < 20) {
          score += 85;
          details.push(`✓ Consistent earnings (CV: ${coefficientOfVariation.toFixed(1)}%)`);
        } else if (coefficientOfVariation < 30) {
          score += 70;
          details.push(`○ Moderately consistent (CV: ${coefficientOfVariation.toFixed(1)}%)`);
        } else if (coefficientOfVariation < 50) {
          score += 55;
          details.push(`○ Variable earnings (CV: ${coefficientOfVariation.toFixed(1)}%)`);
        } else {
          score += 35;
          details.push(`⚠ Volatile earnings (CV: ${coefficientOfVariation.toFixed(1)}%)`);
        }
      } else {
        // Very small profits, can't reliably calculate CV
        score += 50;
        details.push('○ Earnings too small to assess consistency');
      }
    }
  }
  
  // 8. EPS Improvement (FOR LOSS-MAKING COMPANIES) - Track losses per share
  // Even negative EPS improving is a strong signal: -₹24,720 → -₹2.62 = massive improvement!
  if (isLossMaking && quarterlyResults && quarterlyResults.length >= 4) {
    const quartersWithEps = quarterlyResults.filter(q => q.eps != null);
    
    if (quartersWithEps.length >= 4) {
      factors++;
      
      const oldestEps = quartersWithEps[0].eps;
      const latestEps = quartersWithEps[quartersWithEps.length - 1].eps;
      
      // For negative EPS, improvement = becoming less negative
      if (oldestEps < 0 && latestEps < 0) {
        const epsImprovement = latestEps - oldestEps; // e.g., -2.62 - (-24720) = +24717.38
        const epsImprovementPct = (epsImprovement / Math.abs(oldestEps)) * 100;
        
        if (epsImprovementPct >= 80) {
          score += 70; // Exceptional improvement
          details.push(`✅ Exceptional EPS improvement: ₹${oldestEps.toFixed(2)} → ₹${latestEps.toFixed(2)} (+${epsImprovementPct.toFixed(0)}% - losses per share drastically reduced)`);
        } else if (epsImprovementPct >= 50) {
          score += 60; // Strong improvement
          details.push(`✓ Strong EPS improvement: ₹${oldestEps.toFixed(2)} → ₹${latestEps.toFixed(2)} (+${epsImprovementPct.toFixed(0)}%)`);
        } else if (epsImprovementPct >= 30) {
          score += 50; // Good improvement
          details.push(`✓ Good EPS improvement: ₹${oldestEps.toFixed(2)} → ₹${latestEps.toFixed(2)} (+${epsImprovementPct.toFixed(0)}%)`);
        } else if (epsImprovementPct >= 10) {
          score += 40; // Moderate improvement
          details.push(`○ Moderate EPS improvement: ₹${oldestEps.toFixed(2)} → ₹${latestEps.toFixed(2)} (+${epsImprovementPct.toFixed(0)}%)`);
        } else if (epsImprovementPct > 0) {
          score += 30; // Slight improvement
          details.push(`○ Slight EPS improvement: ₹${oldestEps.toFixed(2)} → ₹${latestEps.toFixed(2)}`);
        } else {
          score += 0; // Worsening
          details.push(`❌ EPS worsening: ₹${oldestEps.toFixed(2)} → ₹${latestEps.toFixed(2)} (losses per share increasing)`);
        }
      } else if (latestEps >= 0 && oldestEps < 0) {
        score += 100; // Turned profitable!
        details.push(`✅ Turned profitable: EPS ₹${oldestEps.toFixed(2)} → ₹${latestEps.toFixed(2)} (breakeven achieved!)`);
      }
    }
  }
  
  // 9. Free Cash Flow - Cash generation capability (forward-looking indicator)
  // NOTE: Negative FCF is common for growth companies expanding. Don't over-penalize.
  // For loss-makers: Improving FCF (less negative) is a strong signal of reducing cash burn
  if (cashFlow.freeCashFlow != null) {
    factors++;
    const fcf = cashFlow.freeCashFlow;
    
    // For loss-making companies, give extra credit if FCF is better than net profit (shows working capital efficiency)
    if (isLossMaking && fcf < 0 && quarterlyResults && quarterlyResults.length >= 2) {
      const latestProfit = quarterlyResults[quarterlyResults.length - 1]?.netProfit || 0;
      
      // If FCF is less negative than net profit, it's a positive sign
      // e.g., Net Profit -₹100 Cr but FCF -₹50 Cr = good working capital management
      if (latestProfit < 0 && fcf > latestProfit) {
        const fcfBetter = fcf - latestProfit; // e.g., -50 - (-100) = +50
        score += 40; // Give credit for better FCF than profit
        details.push(`✓ FCF better than net profit: ₹${Math.round(fcf)} Cr vs ₹${Math.round(latestProfit)} Cr (working capital efficiency)`);
      } else if (fcf > -200) {
        score += 35; // Moderate cash burn
        details.push(`○ Manageable negative FCF: ₹${Math.round(fcf)} Cr (controlled cash burn)`);
      } else if (fcf > -500) {
        score += 20; // High cash burn
        details.push(`⚠ Negative FCF: ₹${Math.round(fcf)} Cr (high cash burn)`);
      } else {
        score += 5; // Extreme cash burn
        details.push(`⚠ Severe negative FCF: ₹${Math.round(fcf)} Cr (unsustainable burn rate)`);
      }
    } else if (fcf > 2000) {
      score += 100;
      details.push(`✅ Exceptional FCF generation: ₹${Math.round(fcf)} Cr`);
    } else if (fcf > 1000) {
      score += 95;
      details.push(`✅ Strong FCF generation: ₹${Math.round(fcf)} Cr`);
    } else if (fcf > 500) {
      score += 90;
      details.push(`✓ Good FCF generation: ₹${Math.round(fcf)} Cr`);
    } else if (fcf > 100) {
      score += 75;
      details.push(`✓ Healthy FCF: ₹${Math.round(fcf)} Cr`);
    } else if (fcf > 0) {
      score += 60;
      details.push(`○ Positive FCF: ₹${Math.round(fcf)} Cr`);
    } else if (fcf > -200) {
      score += 45; // Minor penalty for negative FCF (expansion mode)
      details.push(`○ Negative FCF: ₹${Math.round(fcf)} Cr (expansion/growth phase)`);
    } else if (fcf > -500) {
      score += 30; // Moderate penalty for significant cash burn
      details.push(`⚠ Negative FCF: ₹${Math.round(fcf)} Cr (high cash burn)`);
    } else {
      score += 15; // Heavy penalty only for extreme cash burn
      details.push(`⚠ Severe negative FCF: ₹${Math.round(fcf)} Cr (unsustainable burn rate)`);
    }
  }
  
  // Calculate final score
  let finalScore = factors > 0 ? score / factors : 0;
  
  // Cap at 40 for loss-making companies
  if (isLossMaking && finalScore > 40) {
    finalScore = 40;
    details.push('⚠️ Score capped at 40 due to losses');
  }
  
  // Return 0 if no data available (not 50!)
  if (factors === 0) {
    return {
      score: 0,
      explanation: 'Insufficient data to evaluate business quality',
    };
  }
  
  return {
    score: finalScore,
    explanation: details.join(' | '),
  };
}

// PILLAR 2: GROWTH (0-100) - Enhanced with Growth Momentum factors for forward-looking analysis
function calculateGrowth(compoundedGrowth: any, quarterlyResults: any[], annualResults: any[], cashFlow: any, isLossMaking: boolean, peerMetrics: any = null): { score: number; explanation: string } {
  let score = 0;
  let factors = 0;
  const details: string[] = [];
  
  // Sales Growth - Weight 3Y (60%) and 5Y (40%) because recent performance matters more
  if (compoundedGrowth.sales3Y != null || compoundedGrowth.sales5Y != null) {
    factors++;
    
    let salesCAGR: number;
    let displayText: string;
    
    if (compoundedGrowth.sales3Y != null && compoundedGrowth.sales5Y != null) {
      // Both available - use weighted average (60% recent 3Y, 40% historical 5Y)
      salesCAGR = (compoundedGrowth.sales3Y * 0.6) + (compoundedGrowth.sales5Y * 0.4);
      displayText = `3Y: ${compoundedGrowth.sales3Y.toFixed(1)}%, 5Y: ${compoundedGrowth.sales5Y.toFixed(1)}%, Weighted: ${salesCAGR.toFixed(1)}%`;
      
      // CRITICAL: Warn if recent performance (3Y) is much worse than 5Y
      const deterioration = compoundedGrowth.sales5Y - compoundedGrowth.sales3Y;
      if (deterioration > 20) {
        details.push(`🚨 RECENT DECLINE: Sales ${displayText}`);
      }
    } else if (compoundedGrowth.sales3Y != null) {
      salesCAGR = compoundedGrowth.sales3Y;
      displayText = `3Y: ${salesCAGR.toFixed(1)}%`;
    } else {
      salesCAGR = compoundedGrowth.sales5Y;
      displayText = `5Y: ${salesCAGR.toFixed(1)}%`;
    }
    
    // TRY PERCENTILE-BASED SCORING (if peer data available)
    let salesScore = 0;
    if (peerMetrics && peerMetrics.sales3Y && peerMetrics.sales5Y) {
      // Use weighted peer CAGRs for comparison
      const peerSalesCAGRs = peerMetrics.sales3Y.map((s3: any, i: number) => {
        const s5 = peerMetrics.sales5Y[i];
        if (s3 != null && s5 != null) return (s3 * 0.6) + (s5 * 0.4);
        return s3 || s5;
      });
      
      const percentile = calculatePercentile(salesCAGR, peerSalesCAGRs, true);
      if (percentile != null) {
        salesScore = percentileToScore(percentile);
        details.push(`✅ Sales growth (${displayText}) - ${percentile}th percentile in sector`);
        score += salesScore;
      } else {
        // Fall back to fixed thresholds
        salesScore = getSalesFixedScore(salesCAGR, displayText, details);
        score += salesScore;
      }
    } else {
      // Use fixed thresholds
      salesScore = getSalesFixedScore(salesCAGR, displayText, details);
      score += salesScore;
    }
  } else {
    details.push('⚠ Sales growth data not available');
  }
  
  // Helper function for sales fixed threshold scoring
  function getSalesFixedScore(cagr: number, displayText: string, detailsArr: string[]): number {
    if (cagr >= 30) {
      detailsArr.push(`✅ Exceptional sales growth (${displayText})`);
      return 100;
    } else if (cagr >= 25) {
      detailsArr.push(`✅ Outstanding sales growth (${displayText})`);
      return 95;
    } else if (cagr >= 20) {
      detailsArr.push(`✅ Excellent sales growth (${displayText})`);
      return 90;
    } else if (cagr >= 15) {
      detailsArr.push(`✓ Strong sales growth (${displayText})`);
      return 80;
    } else if (cagr >= 12) {
      detailsArr.push(`✓ Good sales growth (${displayText})`);
      return 70;
    } else if (cagr >= 10) {
      detailsArr.push(`○ Moderate sales growth (${displayText})`);
      return 60;
    } else if (cagr >= 8) {
      detailsArr.push(`○ Average sales growth (${displayText})`);
      return 50;
    } else if (cagr >= 5) {
      detailsArr.push(`⚠ Slow sales growth (${displayText})`);
      return 35;
    } else if (cagr >= 0) {
      detailsArr.push(`⚠ Very slow sales growth (${displayText})`);
      return 20;
    } else {
      detailsArr.push(`❌ Declining sales (${displayText})`);
      return 0;
    }
  }
  
  // Profit Growth 5Y - Handle differently for loss-making companies
  if (isLossMaking) {
    // For loss-making companies, focus on PATH TO PROFITABILITY:
    // 1. OPM% improvement (MOST IMPORTANT - shows operational improvement)
    // 2. Sales growth (shows demand/market traction)
    // 3. Loss reduction (shows financial trajectory)
    
    details.push('⚠️ Company currently loss-making - profit CAGR not meaningful');
    
    // CRITICAL: OPM% Trajectory - Is operating margin improving? (Best indicator of path to profitability)
    if (quarterlyResults && quarterlyResults.length >= 4) {
      const quarters = quarterlyResults.slice(-8); // Look at up to 8 quarters for trend
      const opmValues: number[] = [];
      
      quarters.forEach(q => {
        if (q.sales && q.sales > 0 && q.operatingProfit != null) {
          const opm = (q.operatingProfit / q.sales) * 100;
          opmValues.push(opm);
        }
      });
      
      if (opmValues.length >= 4) {
        factors++;
        
        const oldest = opmValues[0];
        const latest = opmValues[opmValues.length - 1];
        const opmImprovement = latest - oldest; // e.g., -6% - (-46%) = +40pp
        
        // Heavy scoring for OPM improvement (this is THE key metric!)
        if (opmImprovement >= 30) {
          score += 100; // Exceptional improvement: -46% → -6% (40pp improvement)
          details.push(`✅ Exceptional OPM improvement: ${oldest.toFixed(1)}% → ${latest.toFixed(1)}% (+${opmImprovement.toFixed(1)}pp - clear path to profitability)`);
        } else if (opmImprovement >= 20) {
          score += 90;
          details.push(`✅ Outstanding OPM improvement: ${oldest.toFixed(1)}% → ${latest.toFixed(1)}% (+${opmImprovement.toFixed(1)}pp)`);
        } else if (opmImprovement >= 10) {
          score += 75;
          details.push(`✓ Strong OPM improvement: ${oldest.toFixed(1)}% → ${latest.toFixed(1)}% (+${opmImprovement.toFixed(1)}pp)`);
        } else if (opmImprovement >= 5) {
          score += 60;
          details.push(`✓ Good OPM improvement: ${oldest.toFixed(1)}% → ${latest.toFixed(1)}% (+${opmImprovement.toFixed(1)}pp)`);
        } else if (opmImprovement >= 0) {
          score += 40;
          details.push(`○ Slight OPM improvement: ${oldest.toFixed(1)}% → ${latest.toFixed(1)}% (+${opmImprovement.toFixed(1)}pp)`);
        } else if (opmImprovement >= -5) {
          score += 20;
          details.push(`⚠ OPM deteriorating slightly: ${oldest.toFixed(1)}% → ${latest.toFixed(1)}%`);
        } else {
          score += 0;
          details.push(`❌ OPM worsening: ${oldest.toFixed(1)}% → ${latest.toFixed(1)}% (${opmImprovement.toFixed(1)}pp decline)`);
        }
        
        // Additional context: Is OPM approaching breakeven?
        if (latest > -5 && latest < 0) {
          details.push(`🎯 Near breakeven: Latest OPM ${latest.toFixed(1)}% (profitability within reach)`);
        } else if (latest >= 0) {
          details.push(`✅ Operating profit positive: ${latest.toFixed(1)}% OPM`);
        }
      }
    }
    
    // Sales Growth for Loss-Makers - Give MORE credit than for profitable companies
    // Strong sales growth despite losses = market validation + scale potential
    if (quarterlyResults && quarterlyResults.length >= 4) {
      factors++;
      const recent = quarterlyResults.slice(-2);
      const older = quarterlyResults.slice(-4, -2);
      
      const recentAvgSales = recent.reduce((sum, q) => sum + (q.sales || 0), 0) / recent.length;
      const olderAvgSales = older.reduce((sum, q) => sum + (q.sales || 0), 0) / older.length;
      
      if (olderAvgSales > 0) {
        const salesGrowth = ((recentAvgSales - olderAvgSales) / olderAvgSales) * 100;
        
        // Give HIGHER scores for sales growth in loss-makers (validates business model)
        if (salesGrowth >= 100) {
          score += 100;
          details.push(`✅ Explosive sales growth: ${salesGrowth.toFixed(1)}% (strong market traction)`);
        } else if (salesGrowth >= 50) {
          score += 90;
          details.push(`✅ Very strong sales growth: ${salesGrowth.toFixed(1)}%`);
        } else if (salesGrowth >= 30) {
          score += 80;
          details.push(`✓ Strong sales growth: ${salesGrowth.toFixed(1)}%`);
        } else if (salesGrowth >= 20) {
          score += 70;
          details.push(`✓ Good sales growth: ${salesGrowth.toFixed(1)}%`);
        } else if (salesGrowth >= 10) {
          score += 50;
          details.push(`○ Moderate sales growth: ${salesGrowth.toFixed(1)}%`);
        } else if (salesGrowth >= 0) {
          score += 30;
          details.push(`⚠ Slow sales growth: ${salesGrowth.toFixed(1)}%`);
        } else {
          score += 0;
          details.push(`❌ Declining sales: ${salesGrowth.toFixed(1)}% (no revenue growth despite losses)`);
        }
      }
    }
    
    // Loss Reduction - Are absolute losses decreasing?
    if (quarterlyResults && quarterlyResults.length >= 4) {
      factors++;
      const recent = quarterlyResults.slice(-2);
      const older = quarterlyResults.slice(-4, -2);
      
      const recentAvgLoss = recent.reduce((sum, q) => sum + (q.netProfit || 0), 0) / recent.length;
      const olderAvgLoss = older.reduce((sum, q) => sum + (q.netProfit || 0), 0) / older.length;
      
      if (recentAvgLoss > olderAvgLoss) {
        const improvement = ((recentAvgLoss - olderAvgLoss) / Math.abs(olderAvgLoss)) * 100;
        score += 60; // Give credit for loss reduction
        details.push(`✓ Losses narrowing (${improvement.toFixed(1)}% reduction in net loss)`);
      } else {
        score += 20;
        details.push(`⚠ Losses widening - burn rate increasing`);
      }
    }
  } else {
    // For profitable companies, weight 3Y (60%) and 5Y (40%) profit growth
    if (compoundedGrowth.profit3Y != null || compoundedGrowth.profit5Y != null) {
      factors++;
      
      let profitCAGR: number;
      let displayText: string;
      
      if (compoundedGrowth.profit3Y != null && compoundedGrowth.profit5Y != null) {
        // Both available - use weighted average (60% recent 3Y, 40% historical 5Y)
        profitCAGR = (compoundedGrowth.profit3Y * 0.6) + (compoundedGrowth.profit5Y * 0.4);
        displayText = `3Y: ${compoundedGrowth.profit3Y.toFixed(1)}%, 5Y: ${compoundedGrowth.profit5Y.toFixed(1)}%, Weighted: ${profitCAGR.toFixed(1)}%`;
        
        // CRITICAL: Warn if recent performance (3Y) is much worse than 5Y
        const deterioration = compoundedGrowth.profit5Y - compoundedGrowth.profit3Y;
        if (deterioration > 20) {
          details.push(`🚨 PROFIT DECLINE: ${displayText}`);
        }
      } else if (compoundedGrowth.profit3Y != null) {
        profitCAGR = compoundedGrowth.profit3Y;
        displayText = `3Y: ${profitCAGR.toFixed(1)}%`;
      } else {
        profitCAGR = compoundedGrowth.profit5Y;
        displayText = `5Y: ${profitCAGR.toFixed(1)}%`;
      }
      
      // Score based on weighted/available CAGR
      if (profitCAGR >= 40) {
        score += 100;
        details.push(`✅ Exceptional profit growth (${displayText})`);
      } else if (profitCAGR >= 30) {
        score += 95;
        details.push(`✅ Outstanding profit growth (${displayText})`);
      } else if (profitCAGR >= 25) {
        score += 90;
        details.push(`✅ Excellent profit growth (${displayText})`);
      } else if (profitCAGR >= 20) {
        score += 85;
        details.push(`✅ Very strong profit growth (${displayText})`);
      } else if (profitCAGR >= 15) {
        score += 75;
        details.push(`✓ Strong profit growth (${displayText})`);
      } else if (profitCAGR >= 12) {
        score += 65;
        details.push(`✓ Good profit growth (${displayText})`);
      } else if (profitCAGR >= 10) {
        score += 55;
        details.push(`○ Moderate profit growth (${displayText})`);
      } else if (profitCAGR >= 8) {
        score += 45;
        details.push(`○ Average profit growth (${displayText})`);
      } else if (profitCAGR >= 5) {
        score += 30;
        details.push(`⚠ Slow profit growth (${displayText})`);
      } else if (profitCAGR >= 0) {
        score += 15;
        details.push(`⚠ Very slow profit growth (${displayText})`);
      } else {
        score += 0;
        details.push(`❌ Declining profits (${displayText})`);
      }
    }
  }
  
  // Recent quarterly performance - Check if last 2 quarters are growing (sales, not profit for loss-makers)
  if (quarterlyResults && quarterlyResults.length >= 2) {
    const q1 = quarterlyResults[quarterlyResults.length - 1];
    const q2 = quarterlyResults[quarterlyResults.length - 2];
    
    // Use sales growth for loss-making companies, profit for profitable
    const metric = isLossMaking ? 'sales' : 'netProfit';
    const metricName = isLossMaking ? 'Sales Q-o-Q' : 'Profit Q-o-Q';
    
    if (q1?.[metric] && q2?.[metric] && q2[metric] !== 0) {
      factors++;
      const growth = ((q1[metric] - q2[metric]) / Math.abs(q2[metric])) * 100;
      if (growth >= 20) {
        score += 100;
        details.push(`✅ Excellent ${metricName}: ${growth.toFixed(1)}%`);
      } else if (growth >= 10) {
        score += 80;
        details.push(`✓ Good ${metricName}: ${growth.toFixed(1)}%`);
      } else if (growth >= 5) {
        score += 60;
        details.push(`○ Moderate ${metricName}: ${growth.toFixed(1)}%`);
      } else if (growth >= 0) {
        score += 40;
        details.push(`○ Flat ${metricName}: ${growth.toFixed(1)}%`);
      } else if (growth >= -10) {
        score += 20;
        details.push(`⚠ Declining ${metricName}: ${growth.toFixed(1)}%`);
      } else {
        score += 0;
        details.push(`❌ Sharp ${metricName} decline: ${growth.toFixed(1)}%`);
      }
    }
  }
  
  // Growth Trend Analysis - Only penalize SEVERE deterioration (>30pp), otherwise focus on absolute growth quality
  // A company with 35% profit growth should NOT be heavily penalized just because it used to be 43%!
  if (compoundedGrowth.profit3Y != null && compoundedGrowth.profit5Y != null) {
    const diff = compoundedGrowth.profit3Y - compoundedGrowth.profit5Y; // Positive = acceleration, Negative = deterioration
    const profitCAGR3Y = compoundedGrowth.profit3Y;
    
    // Only add as a factor if there's meaningful information (not neutral)
    if (diff >= 5 || diff <= -30 || (diff <= -10 && profitCAGR3Y < 10)) {
      factors++;
      
      if (diff >= 10) {
        score += 100;
        details.push(`✅ Accelerating growth (3Y better than 5Y by ${diff.toFixed(1)}pp)`);
      } else if (diff >= 5) {
        score += 90;
        details.push(`✓ Growth accelerating (3Y better by ${diff.toFixed(1)}pp)`);
      } else if (diff <= -30) {
        // Only penalize if drop is severe
        score += 0;
        details.push(`❌ Sharp deterioration (3Y worse by ${Math.abs(diff).toFixed(1)}pp)`);
      } else if (diff <= -20 && profitCAGR3Y < 10) {
        // Penalize if slowdown is significant AND current growth is weak
        score += 30;
        details.push(`⚠ Slowing growth (3Y worse by ${Math.abs(diff).toFixed(1)}pp)`);
      } else if (diff <= -10 && profitCAGR3Y < 10) {
        // Minor penalty only if current growth is weak
        score += 60;
        details.push(`○ Moderate slowdown (3Y slower by ${Math.abs(diff).toFixed(1)}pp)`);
      }
      // If diff is between -10 and -30 but growth is still strong (>10%), DON'T add a factor at all
    }
    // Otherwise, don't penalize at all - the weighted CAGR already reflects the slowdown
  }
  
  // === GROWTH MOMENTUM FACTORS (Forward-Looking Indicators) ===
  
  // 1. Sales Acceleration - Is recent growth accelerating vs historical?
  if (quarterlyResults && quarterlyResults.length >= 2 && compoundedGrowth.sales5Y != null) {
    factors++;
    const q1 = quarterlyResults[quarterlyResults.length - 1];
    const q2 = quarterlyResults[quarterlyResults.length - 2];
    
    if (q1?.sales && q2?.sales && q2.sales !== 0) {
      const recentQoQ = ((q1.sales - q2.sales) / q2.sales) * 100;
      const annualized = recentQoQ * 4; // Rough annualization
      const historicalCAGR = compoundedGrowth.sales5Y;
      
      if (annualized > historicalCAGR + 10) {
        score += 100;
        details.push(`🚀 Sales accelerating (recent: ${recentQoQ.toFixed(1)}% Q-o-Q vs ${historicalCAGR.toFixed(1)}% CAGR)`);
      } else if (annualized > historicalCAGR) {
        score += 80;
        details.push(`✓ Sales momentum building (recent: ${recentQoQ.toFixed(1)}% Q-o-Q)`);
      } else if (annualized > historicalCAGR - 5) {
        score += 60;
        details.push(`○ Sales steady with trend (${recentQoQ.toFixed(1)}% Q-o-Q)`);
      } else {
        score += 30;
        details.push(`⚠ Sales decelerating vs trend (${recentQoQ.toFixed(1)}% Q-o-Q)`);
      }
    }
  }
  
  if (factors === 0) {
    return {
      score: 0,
      explanation: 'Insufficient data to evaluate growth',
    };
  }
  
  return {
    score: score / factors,
    explanation: details.join(' | '),
  };
}

// PILLAR 3: VALUATION (0-100)
function calculateValuation(fundamentals: any, compoundedGrowth: any, currentPrice: number, isLossMaking: boolean, peerMetrics: any = null): { score: number; explanation: string } {
  let score = 0;
  let factors = 0;
  const details: string[] = [];
  
  // SPECIAL HANDLING FOR LOSS-MAKING COMPANIES
  if (isLossMaking) {
    details.push('⚠️ Loss-making company - using alternative valuation metrics');
    
    // For loss-making companies, use Price/Sales instead of P/E
    // We don't have P/S ratio, so we'll be more conservative
    
    // P/B Ratio - Target: <1.5 for loss-making = 100 points
    if (fundamentals.pbRatio != null) {
      factors++;
      if (fundamentals.pbRatio < 1) {
        score += 100;
        details.push(`✅ Trading below book value: P/B = ${fundamentals.pbRatio.toFixed(2)}`);
      } else if (fundamentals.pbRatio < 1.5) {
        score += 80;
        details.push(`✓ Reasonable P/B: ${fundamentals.pbRatio.toFixed(2)}`);
      } else if (fundamentals.pbRatio < 2) {
        score += 60;
        details.push(`○ Moderate P/B: ${fundamentals.pbRatio.toFixed(2)}`);
      } else if (fundamentals.pbRatio < 3) {
        score += 40;
        details.push(`⚠ High P/B for loss-making: ${fundamentals.pbRatio.toFixed(2)}`);
      } else {
        score += 20;
        details.push(`❌ Very expensive P/B: ${fundamentals.pbRatio.toFixed(2)}`);
      }
    }
    
    // Price vs 52-week range - Better if near 52W low
    if (fundamentals.fiftyTwoWeekHigh && fundamentals.fiftyTwoWeekLow && currentPrice) {
      factors++;
      const range = fundamentals.fiftyTwoWeekHigh - fundamentals.fiftyTwoWeekLow;
      const position = (currentPrice - fundamentals.fiftyTwoWeekLow) / range;
      
      if (position < 0.3) {
        score += 100;
        details.push('✅ Near 52-week low - potential value');
      } else if (position < 0.5) {
        score += 80;
        details.push('✓ Below mid-range');
      } else if (position < 0.7) {
        score += 60;
        details.push('○ Above mid-range');
      } else {
        score += 40;
        details.push('⚠ Near 52-week high despite losses');
      }
    }
    
    // Cap valuation score at 60 for loss-making companies
    const finalScore = factors > 0 ? Math.min((score / factors), 60) : 0;
    details.push('⚠️ Valuation score capped at 60 due to losses');
    
    return {
      score: finalScore,
      explanation: details.join(' | '),
    };
  }
  
  // NORMAL VALUATION FOR PROFITABLE COMPANIES
  
  // P/E Ratio - Use percentile-based scoring when peer data available
  // PEG is the MOST IMPORTANT valuation metric - weight it 2x
  // Use weighted growth (60% 3Y, 40% 5Y) for more accurate recent performance
  const hasProfit3Y = compoundedGrowth.profit3Y != null && compoundedGrowth.profit3Y > 0;
  const hasProfit5Y = compoundedGrowth.profit5Y != null && compoundedGrowth.profit5Y > 0;
  
  if (fundamentals.peRatio != null && (hasProfit3Y || hasProfit5Y)) {
    factors += 2; // Double weight for PEG
    
    // Calculate weighted growth for PEG
    let profitGrowth: number;
    if (hasProfit3Y && hasProfit5Y) {
      profitGrowth = (compoundedGrowth.profit3Y * 0.6) + (compoundedGrowth.profit5Y * 0.4);
    } else if (hasProfit3Y) {
      profitGrowth = compoundedGrowth.profit3Y;
    } else {
      profitGrowth = compoundedGrowth.profit5Y;
    }
    
    const peg = fundamentals.peRatio / profitGrowth;
    
    // PEG < 1 is undervalued, PEG = 1-1.5 is fair, PEG > 2 is expensive
    if (peg < 0.8) {
      score += 200; // Double score for double weight
      details.push(`✅ Highly undervalued: PEG = ${peg.toFixed(2)} (P/E=${fundamentals.peRatio.toFixed(1)}, Growth=${profitGrowth.toFixed(1)}%)`);
    } else if (peg < 1.2) {
      score += 180;
      details.push(`✅ Fair value: PEG = ${peg.toFixed(2)}`);
    } else if (peg < 1.5) {
      score += 140;
      details.push(`○ Reasonable valuation: PEG = ${peg.toFixed(2)}`);
    } else if (peg < 2.0) {
      score += 100;
      details.push(`⚠ Expensive: PEG = ${peg.toFixed(2)}`);
    } else if (peg < 3.0) {
      score += 60;
      details.push(`⚠ Very expensive: PEG = ${peg.toFixed(2)}`);
    } else {
      score += 40;
      details.push(`❌ Extremely expensive: PEG = ${peg.toFixed(2)}`);
    }
  } else if (fundamentals.peRatio != null) {
    // Fallback: Just use PE ratio if growth not available (lower weight)
    factors++;
    if (fundamentals.peRatio < 15) {
      score += 90;
      details.push(`✅ Low P/E: ${fundamentals.peRatio.toFixed(1)}`);
    } else if (fundamentals.peRatio < 20) {
      score += 80;
      details.push(`✓ Moderate P/E: ${fundamentals.peRatio.toFixed(1)}`);
    } else if (fundamentals.peRatio < 25) {
      score += 60;
      details.push(`○ Fair P/E: ${fundamentals.peRatio.toFixed(1)}`);
    } else if (fundamentals.peRatio < 35) {
      score += 40;
      details.push(`⚠ High P/E: ${fundamentals.peRatio.toFixed(1)}`);
    } else {
      score += 20;
      details.push(`❌ Very high P/E: ${fundamentals.peRatio.toFixed(1)}`);
    }
  }
  
  // P/B Ratio - Target: <3 = 100 points (for most sectors)
  if (fundamentals.pbRatio != null) {
    factors++;
    if (fundamentals.pbRatio < 2) {
      score += 100;
      details.push(`✅ Excellent P/B: ${fundamentals.pbRatio.toFixed(2)}`);
    } else if (fundamentals.pbRatio < 3) {
      score += 80;
      details.push(`✓ Good P/B: ${fundamentals.pbRatio.toFixed(2)}`);
    } else if (fundamentals.pbRatio < 5) {
      score += 60;
      details.push(`○ Moderate P/B: ${fundamentals.pbRatio.toFixed(2)}`);
    } else if (fundamentals.pbRatio < 8) {
      score += 40;
      details.push(`⚠ High P/B: ${fundamentals.pbRatio.toFixed(2)}`);
    } else {
      score += 20;
      details.push(`❌ Very high P/B: ${fundamentals.pbRatio.toFixed(2)}`);
    }
  }
  
  // Price vs 52-week range - Better if near 52W low
  if (fundamentals.fiftyTwoWeekHigh && fundamentals.fiftyTwoWeekLow && currentPrice) {
    factors++;
    const range = fundamentals.fiftyTwoWeekHigh - fundamentals.fiftyTwoWeekLow;
    const position = (currentPrice - fundamentals.fiftyTwoWeekLow) / range;
    
    // Lower in the range = better value opportunity
    if (position < 0.3) {
      score += 100;
      details.push('✅ Near 52-week low - excellent entry opportunity');
    } else if (position < 0.5) {
      score += 80;
      details.push('✓ Below mid-range of 52-week');
    } else if (position < 0.7) {
      score += 60;
      details.push('○ Above mid-range of 52-week');
    } else if (position < 0.9) {
      score += 40;
      details.push('⚠ Near 52-week high');
    } else {
      score += 20;
      details.push('⚠ At 52-week high - expensive');
    }
  }
  
  // Dividend Yield - Bonus for income investors, shows financial stability
  if (fundamentals.dividendYield != null && fundamentals.dividendYield > 0) {
    factors++;
    if (fundamentals.dividendYield >= 3.0) {
      score += 100;
      details.push(`✅ High dividend yield: ${fundamentals.dividendYield.toFixed(2)}%`);
    } else if (fundamentals.dividendYield >= 2.0) {
      score += 80;
      details.push(`✓ Good dividend yield: ${fundamentals.dividendYield.toFixed(2)}%`);
    } else if (fundamentals.dividendYield >= 1.0) {
      score += 60;
      details.push(`○ Moderate dividend: ${fundamentals.dividendYield.toFixed(2)}%`);
    } else {
      score += 40;
      details.push(`○ Low dividend: ${fundamentals.dividendYield.toFixed(2)}%`);
    }
  }
  
  if (factors === 0) {
    return {
      score: 0,
      explanation: 'Insufficient data to evaluate valuation',
    };
  }
  
  return {
    score: score / factors,
    explanation: details.join(' | '),
  };
}

// PILLAR 4: TECHNICAL STRENGTH (0-100)
function calculateTechnicalStrength(technicals: any, currentPrice: number): { score: number; explanation: string } {
  let score = 0;
  let factors = 0;
  const details: string[] = [];
  
  // RSI - Target: 50-60 (healthy uptrend) - Conservative scoring
  if (technicals.rsi != null) {
    factors++;
    if (technicals.rsi >= 50 && technicals.rsi <= 60) {
      score += 90; // Reduced from 100 to be more conservative
      details.push(`✅ Optimal RSI zone: ${technicals.rsi.toFixed(1)}`);
    } else if (technicals.rsi >= 40 && technicals.rsi < 50) {
      score += 75; // Reduced from 80
      details.push(`✓ Value zone RSI: ${technicals.rsi.toFixed(1)}`);
    } else if (technicals.rsi >= 60 && technicals.rsi < 70) {
      score += 65; // Reduced from 70
      details.push(`○ Strong RSI: ${technicals.rsi.toFixed(1)}`);
    } else if (technicals.rsi >= 30 && technicals.rsi < 40) {
      score += 55; // Reduced from 60
      details.push(`○ Oversold RSI: ${technicals.rsi.toFixed(1)}`);
    } else if (technicals.rsi >= 70) {
      score += 25; // Reduced from 30
      details.push(`⚠ Overbought RSI: ${technicals.rsi.toFixed(1)}`);
    } else {
      score += 35; // Reduced from 40
      details.push(`⚠ Very oversold RSI: ${technicals.rsi.toFixed(1)}`);
    }
  } else {
    details.push('⚠ RSI data not available');
  }
  
  // Price vs 200 DMA - Above = bullish
  if (technicals.sma200 && currentPrice) {
    factors++;
    const aboveSMA200 = ((currentPrice - technicals.sma200) / technicals.sma200) * 100;
    
    if (aboveSMA200 > 10) {
      score += 100;
      details.push(`✅ Strong uptrend: ${aboveSMA200.toFixed(1)}% above 200 DMA`);
    } else if (aboveSMA200 > 5) {
      score += 90;
      details.push(`✓ Above 200 DMA: +${aboveSMA200.toFixed(1)}%`);
    } else if (aboveSMA200 > 0) {
      score += 80;
      details.push(`✓ Just above 200 DMA: +${aboveSMA200.toFixed(1)}%`);
    } else if (aboveSMA200 > -5) {
      score += 50;
      details.push(`○ Just below 200 DMA: ${aboveSMA200.toFixed(1)}%`);
    } else {
      score += 30;
      details.push(`⚠ Well below 200 DMA: ${aboveSMA200.toFixed(1)}%`);
    }
  } else {
    details.push('⚠ 200 DMA data not available');
  }
  
  // Moving Average alignment - 20 > 50 > 200 is bullish - Conservative scoring
  if (technicals.sma20 && technicals.sma50 && technicals.sma200) {
    factors++;
    if (technicals.sma20 > technicals.sma50 && technicals.sma50 > technicals.sma200) {
      score += 90; // Reduced from 100
      details.push('✅ Golden cross (20>50>200)');
    } else if (technicals.sma20 > technicals.sma50) {
      score += 65; // Reduced from 70
      details.push('✓ Short-term bullish (20>50)');
    } else if (technicals.sma50 > technicals.sma200) {
      score += 55; // Reduced from 60
      details.push('○ Medium-term bullish (50>200)');
    } else {
      score += 25; // Reduced from 30
      details.push('⚠ Bearish MA alignment');
    }
  } else {
    details.push('⚠ Moving average data incomplete');
  }
  
  // MACD - Check if positive - Conservative scoring
  if (technicals.macd?.macd != null && technicals.macd?.signal != null) {
    factors++;
    const macdValue = technicals.macd.macd - technicals.macd.signal;
    if (macdValue > 0 && technicals.macd.macd > 0) {
      score += 90; // Reduced from 100
      details.push('✅ MACD bullish');
    } else if (macdValue > 0) {
      score += 65; // Reduced from 70
      details.push('✓ MACD bullish crossover');
    } else if (macdValue > -5) {
      score += 45; // Reduced from 50
      details.push('○ MACD near crossover');
    } else {
      score += 25; // Reduced from 30
      details.push('⚠ MACD bearish');
    }
  } else {
    details.push('⚠ MACD data not available');
  }
  
  if (factors === 0) {
    return {
      score: 0,
      explanation: 'Insufficient technical data available',
    };
  }
  
  return {
    score: score / factors,
    explanation: details.join(' | '),
  };
}

// PILLAR 5: MARKET CONFIDENCE (0-100)
function calculateMarketConfidence(shareholding: any): { score: number; explanation: string } {
  let score = 0;
  let factors = 0;
  const details: string[] = [];
  
  // Check if shareholding object has any data
  if (!shareholding || Object.keys(shareholding).length === 0) {
    return {
      score: 0,
      explanation: 'Insufficient shareholding data available',
    };
  }
  
  // FII Holding - Higher is better
  if (shareholding.fii != null && shareholding.fii > 0) {
    factors++;
    if (shareholding.fii >= 30) {
      score += 100;
      details.push(`✅ Very high FII holding: ${shareholding.fii.toFixed(1)}%`);
    } else if (shareholding.fii >= 20) {
      score += 80;
      details.push(`✓ High FII holding: ${shareholding.fii.toFixed(1)}%`);
    } else if (shareholding.fii >= 10) {
      score += 60;
      details.push(`○ Moderate FII holding: ${shareholding.fii.toFixed(1)}%`);
    } else if (shareholding.fii >= 5) {
      score += 45;
      details.push(`○ Low FII holding: ${shareholding.fii.toFixed(1)}%`);
    } else {
      score += 30;
      details.push(`⚠ Very low FII holding: ${shareholding.fii.toFixed(1)}%`);
    }
  }
  
  // FII Trend - Increasing is very bullish, decreasing is bearish
  // Use numeric trend change (change in percentage points over last 5 quarters)
  if (shareholding.fiiTrendChange != null) {
    factors++;
    const change = shareholding.fiiTrendChange;
    
    if (change >= 5) {
      score += 100; // Strong FII accumulation
      details.push(`✅ FII increasing strongly: +${change.toFixed(2)}pp (institutional confidence rising)`);
    } else if (change >= 2) {
      score += 90; // Moderate FII accumulation
      details.push(`✓ FII increasing: +${change.toFixed(2)}pp`);
    } else if (change >= 0.5) {
      score += 75; // Slight FII accumulation
      details.push(`✓ FII increasing slightly: +${change.toFixed(2)}pp`);
    } else if (change >= -0.5) {
      score += 60; // Stable
      details.push(`○ FII stake stable: ${Math.abs(change).toFixed(2)}pp change`);
    } else if (change >= -2) {
      score += 40; // Slight exit
      details.push(`⚠ FII decreasing slightly: ${change.toFixed(2)}pp`);
    } else if (change >= -5) {
      score += 20; // Moderate exit
      details.push(`⚠ FII exiting: ${change.toFixed(2)}pp (institutional confidence declining)`);
    } else {
      score += 0; // Major exit - RED FLAG
      details.push(`🚨 FII MAJOR EXIT: ${change.toFixed(2)}pp (strong bearish signal)`);
    }
  }
  
  // DII Holding - Higher is better
  if (shareholding.dii != null && shareholding.dii > 0) {
    factors++;
    if (shareholding.dii >= 20) {
      score += 100;
      details.push(`✅ Strong DII holding: ${shareholding.dii.toFixed(1)}%`);
    } else if (shareholding.dii >= 15) {
      score += 80;
      details.push(`✓ Good DII holding: ${shareholding.dii.toFixed(1)}%`);
    } else if (shareholding.dii >= 10) {
      score += 60;
      details.push(`○ Moderate DII holding: ${shareholding.dii.toFixed(1)}%`);
    } else if (shareholding.dii >= 5) {
      score += 45;
      details.push(`○ Low DII holding: ${shareholding.dii.toFixed(1)}%`);
    } else {
      score += 30;
      details.push(`⚠ Very low DII holding: ${shareholding.dii.toFixed(1)}%`);
    }
  }
  
  // DII Trend - Increasing is bullish, especially if compensating for FII exit
  // Use numeric trend change
  if (shareholding.diiTrendChange != null) {
    factors++;
    const change = shareholding.diiTrendChange;
    
    // Special bonus: If FII exiting but DII buying (smart money rotation)
    const fiiExiting = shareholding.fiiTrendChange != null && shareholding.fiiTrendChange < -2;
    const bonusMultiplier = (fiiExiting && change > 2) ? 1.2 : 1.0;
    
    if (change >= 5) {
      score += 100 * bonusMultiplier; // Strong DII accumulation
      details.push(`✅ DII increasing strongly: +${change.toFixed(2)}pp${fiiExiting ? ' (domestic support despite FII exit!)' : ''}`);
    } else if (change >= 2) {
      score += 90 * bonusMultiplier; // Moderate DII accumulation
      details.push(`✓ DII increasing: +${change.toFixed(2)}pp${fiiExiting ? ' (offsetting FII exit)' : ''}`);
    } else if (change >= 0.5) {
      score += 75; // Slight DII accumulation
      details.push(`✓ DII increasing slightly: +${change.toFixed(2)}pp`);
    } else if (change >= -0.5) {
      score += 60; // Stable
      details.push(`○ DII stake stable: ${Math.abs(change).toFixed(2)}pp change`);
    } else if (change >= -2) {
      score += 40; // Slight exit
      details.push(`⚠ DII decreasing slightly: ${change.toFixed(2)}pp`);
    } else {
      score += 20; // Major exit
      details.push(`⚠ DII exiting: ${change.toFixed(2)}pp`);
    }
  }
  
  // Promoter Holding - Higher is generally better (for most companies)
  if (shareholding.promoter != null && shareholding.promoter > 0) {
    factors++;
    if (shareholding.promoter >= 70) {
      score += 100;
      details.push(`✅ Very high promoter stake: ${shareholding.promoter.toFixed(1)}%`);
    } else if (shareholding.promoter >= 60) {
      score += 90;
      details.push(`✓ High promoter stake: ${shareholding.promoter.toFixed(1)}%`);
    } else if (shareholding.promoter >= 50) {
      score += 75;
      details.push(`✓ Good promoter stake: ${shareholding.promoter.toFixed(1)}%`);
    } else if (shareholding.promoter >= 40) {
      score += 60;
      details.push(`○ Moderate promoter stake: ${shareholding.promoter.toFixed(1)}%`);
    } else if (shareholding.promoter >= 30) {
      score += 45;
      details.push(`○ Below-average promoter stake: ${shareholding.promoter.toFixed(1)}%`);
    } else {
      score += 30;
      details.push(`⚠ Low promoter stake: ${shareholding.promoter.toFixed(1)}%`);
    }
  }
  
  // Promoter Trend - Increasing is bullish, decreasing can be concerning
  // Use numeric trend change
  if (shareholding.promoterTrendChange != null) {
    factors++;
    const change = shareholding.promoterTrendChange;
    
    if (change >= 3) {
      score += 100; // Strong promoter accumulation
      details.push(`✅ Promoters increasing stake significantly: +${change.toFixed(2)}pp (strong confidence)`);
    } else if (change >= 1) {
      score += 90; // Moderate promoter accumulation
      details.push(`✓ Promoters increasing stake: +${change.toFixed(2)}pp`);
    } else if (change >= 0.2) {
      score += 80; // Slight promoter accumulation
      details.push(`✓ Promoters increasing slightly: +${change.toFixed(2)}pp`);
    } else if (change >= -0.2) {
      score += 70; // Stable
      details.push(`○ Promoter stake stable: ${Math.abs(change).toFixed(2)}pp change`);
    } else if (change >= -1) {
      score += 50; // Slight dilution/selling
      details.push(`○ Promoters decreasing slightly: ${change.toFixed(2)}pp`);
    } else if (change >= -3) {
      score += 30; // Moderate selling
      details.push(`⚠ Promoters reducing stake: ${change.toFixed(2)}pp`);
    } else {
      score += 10; // Major selling
      details.push(`⚠ Promoters selling significantly: ${change.toFixed(2)}pp (confidence declining)`);
    }
  }
  
  // Shareholder Count Trend - Increasing retail participation is positive (broad-based interest)
  if (shareholding.shareholderCountChange != null && shareholding.shareholderCount != null) {
    factors++;
    const change = shareholding.shareholderCountChange;
    
    if (change >= 50) {
      score += 100; // Explosive retail interest
      details.push(`✅ Shareholder count surging: +${change.toFixed(1)}% (${shareholding.shareholderCount.toLocaleString('en-IN')} investors - viral retail interest)`);
    } else if (change >= 30) {
      score += 90; // Strong retail interest
      details.push(`✓ Shareholder count growing strongly: +${change.toFixed(1)}% (${shareholding.shareholderCount.toLocaleString('en-IN')} investors)`);
    } else if (change >= 15) {
      score += 80; // Good retail interest
      details.push(`✓ Shareholder count increasing: +${change.toFixed(1)}% (${shareholding.shareholderCount.toLocaleString('en-IN')} investors)`);
    } else if (change >= 5) {
      score += 70; // Moderate growth
      details.push(`○ Shareholder count growing: +${change.toFixed(1)}%`);
    } else if (change >= -5) {
      score += 50; // Stable
      details.push(`○ Shareholder count stable: ${Math.abs(change).toFixed(1)}% change`);
    } else {
      score += 30; // Declining
      details.push(`⚠ Shareholder count declining: ${change.toFixed(1)}% (retail losing interest)`);
    }
  }
  
  // If we still have no factors (all data is null or zero), return 0
  if (factors === 0) {
    return {
      score: 0,
      explanation: 'Insufficient shareholding data available',
    };
  }
  
  return {
    score: score / factors,
    explanation: details.join(' | '),
  };
}

// Calculate momentum score - measures what's already running
// Separates "good past returns" from "good investment today"
// Uses actual price returns (1M, 3M, 6M, 1Y) from Yahoo Finance
function calculateMomentum(
  f: any, 
  q: any[], 
  t: any, 
  currentPrice: number,
  priceReturns: any
): { score: number; explanation: string } {
  let score = 0;
  let factors = 0;
  const details: string[] = [];
  
  // FACTOR 1: Price Returns (50 points total)
  // Recent performance weighted: 1Y (15pts), 6M (15pts), 3M (12pts), 1M (8pts)
  if (priceReturns) {
    if (priceReturns.returns1Y !== null) {
      factors++;
      const ret = priceReturns.returns1Y;
      let pts = 0;
      if (ret >= 100) pts = 15; // >100% = max
      else if (ret >= 50) pts = 13;
      else if (ret >= 30) pts = 11;
      else if (ret >= 20) pts = 9;
      else if (ret >= 10) pts = 7;
      else if (ret >= 0) pts = 4;
      else if (ret >= -10) pts = 2;
      else pts = 0; // <-10% = 0
      
      score += pts;
      details.push(`1Y: ${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%`);
    }
    
    if (priceReturns.returns6M !== null) {
      factors++;
      const ret = priceReturns.returns6M;
      let pts = 0;
      if (ret >= 50) pts = 15;
      else if (ret >= 30) pts = 13;
      else if (ret >= 20) pts = 11;
      else if (ret >= 10) pts = 8;
      else if (ret >= 0) pts = 5;
      else if (ret >= -10) pts = 2;
      else pts = 0;
      
      score += pts;
      details.push(`6M: ${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%`);
    }
    
    if (priceReturns.returns3M !== null) {
      factors++;
      const ret = priceReturns.returns3M;
      let pts = 0;
      if (ret >= 30) pts = 12;
      else if (ret >= 20) pts = 10;
      else if (ret >= 10) pts = 8;
      else if (ret >= 5) pts = 6;
      else if (ret >= 0) pts = 3;
      else pts = 0;
      
      score += pts;
      details.push(`3M: ${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%`);
    }
    
    if (priceReturns.returns1M !== null) {
      factors++;
      const ret = priceReturns.returns1M;
      let pts = 0;
      if (ret >= 15) pts = 8;
      else if (ret >= 10) pts = 6;
      else if (ret >= 5) pts = 4;
      else if (ret >= 0) pts = 2;
      else pts = 0;
      
      score += pts;
      details.push(`1M: ${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%`);
    }
  }
  
  // FACTOR 2: 52-Week Range Position (25 points)
  // Near 52W high = momentum continuation signal
  if (f?.fiftyTwoWeekHigh && f?.fiftyTwoWeekLow && currentPrice) {
    const high = parseFloat(f.fiftyTwoWeekHigh);
    const low = parseFloat(f.fiftyTwoWeekLow);
    if (!isNaN(high) && !isNaN(low) && high > low) {
      factors++;
      const position = ((currentPrice - low) / (high - low)) * 100;
      const positionScore = (position / 100) * 25; // Scale to 25 points
      score += positionScore;
      
      if (position >= 95) {
        details.push(`📈 At 52W high (${position.toFixed(0)}%) - Breakout`);
      } else if (position >= 85) {
        details.push(`↗️ Near 52W high (${position.toFixed(0)}%)`);
      } else if (position >= 50) {
        details.push(`→ Mid-range (${position.toFixed(0)}%)`);
      } else {
        details.push(`↘️ Lower range (${position.toFixed(0)}%)`);
      }
    }
  }
  
  // FACTOR 3: Volume Trend (15 points)
  // Increasing volume = strong momentum
  if (priceReturns?.volumeTrend) {
    factors++;
    if (priceReturns.volumeTrend === 'increasing') {
      score += 15;
      details.push('📊 Volume increasing - strong participation');
    } else if (priceReturns.volumeTrend === 'stable') {
      score += 8;
      details.push('Volume stable');
    } else {
      score += 3;
      details.push('Volume decreasing - weak participation');
    }
  }
  
  // FACTOR 4: Moving Average Alignment (10 points)
  // Price above MAs = uptrend
  if (t?.sma20 && t?.sma50 && t?.sma200 && currentPrice) {
    factors++;
    const sma20 = parseFloat(t.sma20);
    const sma50 = parseFloat(t.sma50);
    const sma200 = parseFloat(t.sma200);
    
    let alignment = 0;
    if (!isNaN(sma20) && currentPrice > sma20) alignment++;
    if (!isNaN(sma50) && currentPrice > sma50) alignment++;
    if (!isNaN(sma200) && currentPrice > sma200) alignment++;
    
    const maScore = (alignment / 3) * 10;
    score += maScore;
    
    if (alignment === 3) {
      details.push('✅ Above all MAs - strong trend');
    } else if (alignment >= 2) {
      details.push(`Above ${alignment}/3 MAs`);
    } else {
      details.push('Below MAs - downtrend');
    }
  }
  
  if (factors === 0) {
    return {
      score: 0,
      explanation: 'Insufficient price data for momentum analysis',
    };
  }
  
  // Cap at 100
  score = Math.min(100, score);
  
  // Add summary
  let summary = '';
  if (score >= 80) summary = '🚀 Exceptional momentum - already running strong';
  else if (score >= 60) summary = '📈 Strong momentum - outperforming';
  else if (score >= 40) summary = '→ Moderate momentum';
  else if (score >= 20) summary = '⚠️ Weak momentum - lagging';
  else summary = '↘️ Poor momentum - underperforming';
  
  const explanation = `${summary} | ${details.join(' | ')}`;
  
  return {
    score,
    explanation,
  };
}

// Calculate entry point based on technical analysis
export function calculateEntryPoint(stockData: any, stockScore: StockScore): {
  currentPrice: number;
  idealEntry: number;
  valueBasedEntry: number | null;
  technicalEntry: number;
  stopLoss: number;
  target: number;
  recommendation: string;
} {
  const currentPrice = stockData.currentPrice;
  const t = stockData.technicals || {};
  const f = stockData.fundamentals || {};
  const hasTechnicals = t.rsi != null && t.sma200 != null;
  
  // Calculate support level (use SMA 200 or 52W low)
  const support = t.sma200 || f.fiftyTwoWeekLow || currentPrice * 0.95;
  const supportType = t.sma200 ? '200-day MA' : (f.fiftyTwoWeekLow ? '52-week low' : 'estimated support');
  
  // Calculate target using conservative valuation approach
  // NOT using profit CAGR directly (earnings growth ≠ stock price growth)
  const g = stockData.compoundedGrowth || {};
  const pe = f.peRatio || 20;
  const fiftyTwoWeekHigh = parseFloat(f.fiftyTwoWeekHigh) || currentPrice * 1.15;
  
  // Target: Lesser of (52W high) or (current + 15% conservative upside)
  // More realistic than using earnings CAGR directly
  const conservativeTarget = currentPrice * 1.15;
  const resistanceTarget = fiftyTwoWeekHigh;
  const target = Math.min(conservativeTarget, resistanceTarget * 1.05);
  
  // CALCULATE VALUE-BASED ENTRY (from fair value with margin of safety)
  let valueBasedEntry: number | null = null;
  if (stockScore.fairValue) {
    // Determine margin of safety based on business quality
    const isPremiumBusiness = (f.roe != null && f.roe > 20) && (f.roce != null && f.roce > 25);
    const marginOfSafety = isPremiumBusiness ? 0.15 : 0.20; // Premium: 15%, Normal: 20%
    valueBasedEntry = Math.round(stockScore.fairValue * (1 - marginOfSafety));
  }
  
  // CALCULATE TECHNICAL ENTRY (momentum-based)
  let technicalEntry = currentPrice;
  let recommendation = '';
  let methodology = '';
  
  if (stockScore.investmentScore >= 80) {
    // High quality opportunity
    if (hasTechnicals && t.rsi > 70) {
      technicalEntry = currentPrice * 0.97; // Wait for small dip
      methodology = '3% dip from current (RSI overbought)';
      recommendation = `Wait for minor dip to buy this quality stock. Entry: ${methodology}.`;
    } else if (hasTechnicals && t.rsi < 40) {
      technicalEntry = currentPrice; // Oversold, but buy at current or lower
      methodology = 'Current price or lower (RSI oversold - good value)';
      recommendation = `Oversold value opportunity - buy at current price. Entry: ${methodology}.`;
    } else if (hasTechnicals) {
      technicalEntry = currentPrice;
      methodology = 'Current price (favorable technicals)';
      recommendation = `Buy now - good entry opportunity. Methodology: ${methodology}.`;
    } else {
      technicalEntry = currentPrice;
      methodology = 'Current price (strong fundamentals, technical data unavailable)';
      recommendation = `Buy now based on fundamentals. Methodology: ${methodology}.`;
    }
  } else if (stockScore.investmentScore >= 60) {
    // Accumulate on dips - wait for better entry
    const dippedEntry = Math.min(support * 1.02, currentPrice * 0.97);
    technicalEntry = dippedEntry;
    if (dippedEntry < currentPrice) {
      methodology = `Near ${supportType} support (₹${Math.round(support)}) or 3% dip`;
      recommendation = `Accumulate on dips to support levels. Entry: ${methodology}.`;
    } else {
      methodology = 'Current price (near support)';
      recommendation = `Accumulate at current levels. Entry: ${methodology}.`;
    }
  } else {
    // High risk - steep discount needed
    technicalEntry = currentPrice * 0.90; // Significant discount needed
    methodology = '10% discount from current (risk premium for weak fundamentals)';
    recommendation = `High risk - buy only at steep discount. Entry: ${methodology}.`;
  }
  
  // idealEntry defaults to technical entry for backward compatibility
  const idealEntry = technicalEntry;
  
  // Calculate stop loss (8% below technical entry)
  const stopLoss = technicalEntry * 0.92;
  const stopLossMethodology = '8% below technical entry (risk management)';
  
  // Target methodology - be honest about limitations
  const targetMethodology = `Conservative upside estimate (52W high or 15% gain, whichever is lower) - NOT a price target`;
  
  // Build complete recommendation with all methodologies
  const fullRecommendation = `${recommendation} | Stop Loss: ${stopLossMethodology} | Target Range: ${targetMethodology}`;
  
  return {
    currentPrice,
    idealEntry: Math.round(idealEntry),
    valueBasedEntry,
    technicalEntry: Math.round(technicalEntry),
    stopLoss: Math.round(stopLoss),
    target: Math.round(target),
    recommendation: fullRecommendation,
  };
}
