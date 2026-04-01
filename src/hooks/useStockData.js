"use client";
import { useState, useEffect, useCallback } from 'react';
import { 
  calculateSMA, 
  calculateEMA, 
  calculateRSI, 
  calculateMACD, 
  calculateVolatility, 
  calculateSharpeRatio, 
  calculateDrawdown 
} from '@/lib/finance-utils';

export function useStockData(symbol, range = '1y', interval = '1d') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const fetchStockData = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stocks?symbols=${symbol}&range=${range}&interval=${interval}`);
      const result = await response.json();

      if (!result.success || !result.data[0].success) {
        throw new Error(result.data?.[0]?.error || 'Failed to fetch stock data');
      }

      const stockData = result.data[0];
      const history = stockData.history || [];

      if (history.length > 0) {
        // Compute technicals
        const sma50 = calculateSMA(history, 50);
        const sma200 = calculateSMA(history, 200);
        const rsi = calculateRSI(history, 14);
        const macd = calculateMACD(history);
        
        // Compute risk metrics
        const volatility = calculateVolatility(history);
        const sharpe = calculateSharpeRatio(history);
        const drawdown = calculateDrawdown(history);

        setAnalysis({
          technicals: { sma50, sma200, rsi, macd },
          risk: { volatility, sharpe, drawdown },
          currentPrice: stockData.price,
          change: stockData.change,
          changePercent: stockData.changePercent
        });
      }

      setData(history);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol, range, interval]);

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  return { data, loading, error, analysis, refetch: fetchStockData };
}
