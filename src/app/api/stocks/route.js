import { NextResponse } from 'next/server';

/**
 * High-Resilience Stock API
 * Handles invalid symbols gracefully without breaking the entire request.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');

  if (!symbols) {
    return NextResponse.json({ success: false, error: 'No symbols provided' }, { status: 400 });
  }

  const symbolArray = symbols.split(',').map(s => s.trim()).filter(Boolean);
  const CACHE_DURATION = 300; 

  try {
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

        // 404 means the symbol doesn't exist. We handle this as a "soft" error.
        if (response.status === 404) {
          return { symbol, success: false, error: 'Invalid Symbol' };
        }

        if (!response.ok) {
          return { symbol, success: false, error: `Server ${response.status}` };
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];
        
        if (!result || !result.meta) {
          return { symbol, success: false, error: 'No data available' };
        }

        const meta = result.meta;
        return {
          symbol,
          price: meta.regularMarketPrice,
          change: meta.regularMarketPrice - (meta.chartPreviousClose || meta.regularMarketPrice),
          changePercent: meta.chartPreviousClose ? ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 : 0,
          currency: meta.currency || 'INR',
          name: symbol.split('.')[0],
          success: true
        };
      } catch (err) {
        return { symbol, success: false, error: 'Connection Timeout' };
      }
    });

    const results = await Promise.all(fetchPromises);

    // We ALWAYS return success: true at the top level if the API logic itself didn't crash.
    // This allows the frontend to show the table and let users delete the bad stocks.
    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stock API Critical Failure:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'API Service Error',
      message: 'The stock data service is having internal issues.'
    }, { status: 500 });
  }
}
