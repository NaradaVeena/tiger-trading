const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function analyzeCRWV() {
  try {
    // Fetch 2 years of weekly data
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 2);
    
    const data = await yahooFinance.historical('CRWV', {
      period1: start,
      period2: end,
      interval: '1wk'
    });
    
    if (!data || data.length === 0) {
      console.log('No data available for CRWV');
      return;
    }
    
    const prices = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    // Calculate MAs
    const ma20 = (prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length)).toFixed(2);
    const ma50 = (prices.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, prices.length)).toFixed(2);
    const ma200 = (prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length)).toFixed(2);
    
    const currentPrice = prices[prices.length - 1];
    const high52w = Math.max(...highs);
    const low52w = Math.min(...lows);
    
    console.log('CRWV Weekly Analysis');
    console.log('====================');
    console.log(`Current Price: $${currentPrice.toFixed(2)}`);
    console.log(`52W High: $${high52w.toFixed(2)}`);
    console.log(`52W Low: $${low52w.toFixed(2)}`);
    console.log(`20W MA: $${ma20}`);
    console.log(`50W MA: $${ma50}`);
    console.log(`200W MA: $${ma200}`);
    console.log();
    console.log('Last 10 weeks:');
    data.slice(-10).forEach(d => {
      console.log(`${d.date.toDateString()}: O=${d.open.toFixed(2)} H=${d.high.toFixed(2)} L=${d.low.toFixed(2)} C=${d.close.toFixed(2)}`);
    });
    
    // Trend analysis
    console.log('\nTREND ANALYSIS:');
    const aboveMA20 = currentPrice > parseFloat(ma20);
    const aboveMA50 = currentPrice > parseFloat(ma50);
    const ma20Above50 = parseFloat(ma20) > parseFloat(ma50);
    
    console.log(`Price vs 20W MA: ${aboveMA20 ? 'ABOVE' : 'BELOW'}`);
    console.log(`Price vs 50W MA: ${aboveMA50 ? 'ABOVE' : 'BELOW'}`);
    console.log(`20W vs 50W MA: ${ma20Above50 ? 'BULLISH (20 > 50)' : 'BEARISH (20 < 50)'}`);
    
  } catch (err) {
    console.log('Error:', err.message);
  }
}

analyzeCRWV();
