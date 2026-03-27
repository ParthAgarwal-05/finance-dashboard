import { NextResponse } from 'next/server';

/**
 * High-Resilience Stock API
 * Uses v8 Chart API which is currently the most permissive Yahoo endpoint.
 * Includes server-side caching to prevent 429 Rate Limiting.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');

  if (!symbols) {
    return NextResponse.json({ success: false, error: 'No symbols provided' }, { status: 400 });
  }

  const symbolArray = symbols.split(',').map(s => s.trim()).filter(Boolean);
  
  // 5-minute cache to avoid Yahoo 429 (Too Many Requests) blocks
  const CACHE_DURATION = 300; 

  try {
    // Strategy: Fetch each symbol via the Chart v8 API
    // This is more reliable for NSE than the batch quote API which is heavily protected.
    const fetchPromises = symbolArray.map(async (symbol) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://finance.yahoo.com/'
          },
          next: { revalidate: CACHE_DURATION }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];
        
        if (!result || !result.meta) {
          return { symbol, success: false, error: 'No data' };
        }

        const meta = result.meta;
        return {
          symbol,
          price: meta.regularMarketPrice,
          change: meta.regularMarketPrice - meta.chartPreviousClose,
          changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
          currency: meta.currency,
          name: symbol.split('.')[0],
          success: true
        };
      } catch (err) {
        return { symbol, success: false, error: err.message };
      }
    });

    const results = await Promise.all(fetchPromises);
    const successfulResults = results.filter(r => r.success);

    if (successfulResults.length === 0) {
      // If we got all errors, check if any were 429
      const isRateLimited = results.some(r => r.error?.includes('429'));
      const isForbidden = results.some(r => r.error?.includes('401') || r.error?.includes('403'));
      
      let errorMessage = 'Stock Market connection failed.';
      if (isRateLimited) errorMessage = 'Yahoo Finance rate limit exceeded. Please wait 5 minutes.';
      if (isForbidden) errorMessage = 'Access denied by Yahoo Finance. This often happens on shared cloud IPs.';

      return NextResponse.json({ 
        success: false, 
        error: 'Market Data Unavailable',
        message: errorMessage
      }, { status: isRateLimited ? 429 : 503 });
    }

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Final API Crash:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal API Error',
      message: error.message 
    }, { status: 500 });
  }
}
