/**
 * Finance Pro - Quantitative Engineering Utilities
 * Precision implementations of Technical Indicators and Risk Metrics
 */

// --- Technical Indicators ---

export const calculateSMA = (data, period) => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
    result.push(sum / period);
  }
  return result;
};

export const calculateEMA = (data, period) => {
  const result = [];
  const k = 2 / (period + 1);
  let ema = data[0].close;
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(ema);
    } else {
      ema = data[i].close * k + ema * (1 - k);
      result.push(ema);
    }
  }
  return result;
};

export const calculateRSI = (data, period = 14) => {
  const result = Array(data.length).fill(null);
  if (data.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / (avgLoss || 1);
    result[i] = 100 - (100 / (1 + rs));
  }
  return result;
};

export const calculateMACD = (data, slow = 26, fast = 12, signal = 9) => {
  const fastEMA = calculateEMA(data, fast);
  const slowEMA = calculateEMA(data, slow);
  const macdLine = fastEMA.map((f, i) => (f !== null && slowEMA[i] !== null ? f - slowEMA[i] : null));
  
  // Signal line is EMA of MACD Line
  const macdData = macdLine.map(m => ({ close: m || 0 }));
  const signalLine = calculateEMA(macdData, signal);
  const histogram = macdLine.map((m, i) => (m !== null && signalLine[i] !== null ? m - signalLine[i] : null));

  return { macdLine, signalLine, histogram };
};

// --- Risk Metrics ---

export const calculateVolatility = (data) => {
  if (data.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  // Annualized volatility (assuming daily data)
  return Math.sqrt(variance) * Math.sqrt(252);
};

export const calculateSharpeRatio = (data, riskFreeRate = 0.07) => {
  const annualVolatility = calculateVolatility(data);
  if (annualVolatility === 0) return 0;
  
  const totalReturn = (data[data.length - 1].close - data[0].close) / data[0].close;
  // This is a simplified annualization of returns
  const days = (new Date(data[data.length - 1].date) - new Date(data[0].date)) / (1000 * 60 * 60 * 24);
  const annualReturn = Math.pow(1 + totalReturn, 365 / days) - 1;
  
  return (annualReturn - riskFreeRate) / annualVolatility;
};

export const calculateDrawdown = (data) => {
  let peak = -Infinity;
  const drawdowns = data.map(d => {
    if (d.close > peak) peak = d.close;
    return (d.close - peak) / peak;
  });
  return {
    current: drawdowns[drawdowns.length - 1],
    max: Math.min(...drawdowns),
    series: drawdowns
  };
};
