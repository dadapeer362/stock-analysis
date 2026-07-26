import { HistoricalData } from './stockApi';

const SMA = require('technicalindicators').SMA;
const RSI = require('technicalindicators').RSI;
const MACD = require('technicalindicators').MACD;
const BollingerBands = require('technicalindicators').BollingerBands;

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
}

export function calculateTechnicalIndicators(
  historicalData: HistoricalData[]
): TechnicalIndicators {
  const closes = historicalData.map(d => d.close);

  // RSI (14 periods)
  let rsiValue = null;
  try {
    const rsiValues = RSI.calculate({ values: closes, period: 14 });
    rsiValue = rsiValues[rsiValues.length - 1] || null;
  } catch (error) {
    console.error('Error calculating RSI:', error);
  }

  // MACD
  let macdData = { macd: null, signal: null, histogram: null };
  try {
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
      macdData = {
        macd: lastMACD.MACD || null,
        signal: lastMACD.signal || null,
        histogram: lastMACD.histogram || null,
      };
    }
  } catch (error) {
    console.error('Error calculating MACD:', error);
  }

  // Moving Averages
  let sma20 = null;
  let sma50 = null;
  let sma200 = null;

  try {
    const sma20Values = SMA.calculate({ period: 20, values: closes });
    sma20 = sma20Values[sma20Values.length - 1] || null;
  } catch (error) {
    console.error('Error calculating SMA20:', error);
  }

  try {
    const sma50Values = SMA.calculate({ period: 50, values: closes });
    sma50 = sma50Values[sma50Values.length - 1] || null;
  } catch (error) {
    console.error('Error calculating SMA50:', error);
  }

  try {
    const sma200Values = SMA.calculate({ period: 200, values: closes });
    sma200 = sma200Values[sma200Values.length - 1] || null;
  } catch (error) {
    console.error('Error calculating SMA200:', error);
  }

  // Bollinger Bands
  let bollingerData = { upper: null, middle: null, lower: null };
  try {
    const bbValues = BollingerBands.calculate({
      period: 20,
      values: closes,
      stdDev: 2
    });
    const lastBB = bbValues[bbValues.length - 1];
    if (lastBB) {
      bollingerData = {
        upper: lastBB.upper || null,
        middle: lastBB.middle || null,
        lower: lastBB.lower || null,
      };
    }
  } catch (error) {
    console.error('Error calculating Bollinger Bands:', error);
  }

  return {
    rsi: rsiValue,
    macd: macdData,
    sma20,
    sma50,
    sma200,
    bollingerBands: bollingerData,
  };
}

export function findSupportResistance(historicalData: HistoricalData[]): {
  support: number[];
  resistance: number[];
} {
  // Simple algorithm: find local minima and maxima
  const support: number[] = [];
  const resistance: number[] = [];

  for (let i = 2; i < historicalData.length - 2; i++) {
    const current = historicalData[i].close;
    const prev2 = historicalData[i - 2].close;
    const prev1 = historicalData[i - 1].close;
    const next1 = historicalData[i + 1].close;
    const next2 = historicalData[i + 2].close;

    // Local minimum (support)
    if (
      current < prev2 &&
      current < prev1 &&
      current < next1 &&
      current < next2
    ) {
      support.push(current);
    }

    // Local maximum (resistance)
    if (
      current > prev2 &&
      current > prev1 &&
      current > next1 &&
      current > next2
    ) {
      resistance.push(current);
    }
  }

  // Return the most significant levels (top 3)
  return {
    support: support.sort((a, b) => b - a).slice(0, 3),
    resistance: resistance.sort((a, b) => b - a).slice(0, 3),
  };
}
