import axios from 'axios';

// Search for stocks dynamically using Yahoo Finance API
export async function searchStocks(query: string, limit: number = 8): Promise<Array<{ symbol: string; name: string; exchange: string }>> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v1/finance/search`,
      {
        params: {
          q: query,
          quotesCount: limit,
          newsCount: 0,
          enableFuzzyQuery: false,
          quotesQueryId: 'tss_match_phrase_query'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    const quotes = response.data.quotes || [];
    
    // Filter for NSE stocks only (.NS suffix)
    const nseStocks = quotes
      .filter((quote: any) => 
        quote.symbol?.endsWith('.NS') && 
        quote.quoteType === 'EQUITY'
      )
      .map((quote: any) => ({
        symbol: quote.symbol.replace('.NS', ''), // Remove .NS for display
        name: quote.longname || quote.shortname || quote.symbol,
        exchange: 'NSE'
      }));

    return nseStocks;
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
}
