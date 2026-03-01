const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

async function createChart() {
  try {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 2);
    
    const data = await yahooFinance.historical('CRWV', {
      period1: start,
      period2: end,
      interval: '1wk'
    });
    
    if (!data || data.length === 0) {
      console.log('No data');
      return;
    }
    
    const prices = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    const currentPrice = prices[prices.length - 1];
    const high52w = Math.max(...highs);
    const low52w = Math.min(...lows);
    
    // Calculate MAs
    const ma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length);
    const ma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, prices.length);
    
    console.log('\n=== CRWV WEEKLY CHART (ASCII) ===\n');
    
    // Simple ASCII chart - last 20 weeks
    const weeksToShow = 20;
    const recentData = data.slice(-weeksToShow);
    const recentPrices = recentData.map(d => d.close);
    const maxPrice = Math.max(...recentPrices) * 1.1;
    const minPrice = Math.min(...recentPrices) * 0.9;
    const chartHeight = 20;
    
    // Print price scale
    for (let row = 0; row < chartHeight; row++) {
      const priceLevel = maxPrice - (row / (chartHeight - 1)) * (maxPrice - minPrice);
      if (row === 0 || row === chartHeight - 1 || Math.abs(priceLevel - currentPrice) < 2 || Math.abs(priceLevel - ma20) < 2 || Math.abs(priceLevel - ma50) < 2) {
        console.log(`${priceLevel.toFixed(0).padStart(5)} |`);
      } else {
        console.log('      |');
      }
    }
    console.log('      +' + '-'.repeat(weeksToShow));
    
    // Print candles
    for (let col = 0; col < weeksToShow; col++) {
      const d = recentData[col];
      const price = d.close;
      const row = Math.round(((maxPrice - price) / (maxPrice - minPrice)) * (chartHeight - 1));
      
      if (col === weeksToShow - 1) {
        console.log(`      ${'|'.repeat(col)}★${' '.repeat(weeksToShow - col - 1)}  ${d.date.toLocaleDateString()} @ $${price.toFixed(2)}`);
      } else {
        console.log(`      ${'|'.repeat(col)}•${' '.repeat(weeksToShow - col - 1)}`);
      }
    }
    
    console.log('\n=== KEY LEVELS ===');
    console.log(`Current: $${currentPrice.toFixed(2)}`);
    console.log(`20W MA: $${ma20.toFixed(2)} ${currentPrice > ma20 ? '(ABOVE)' : '(BELOW)'}`);
    console.log(`50W MA: $${ma50.toFixed(2)} ${currentPrice > ma50 ? '(ABOVE)' : '(BELOW)'}`);
    console.log(`52W High: $${high52w.toFixed(2)}`);
    console.log(`52W Low: $${low52w.toFixed(2)}`);
    
    // Find recent swing highs/lows
    const recentHighs = recentData.slice(-10).map(d => d.high);
    const recentLows = recentData.slice(-10).map(d => d.low);
    console.log(`\nRecent Resistance: $${Math.max(...recentHighs).toFixed(2)}`);
    console.log(`Recent Support: $${Math.min(...recentLows).toFixed(2)}`);
    
  } catch (err) {
    console.log('Error:', err.message);
  }
}

createChart();
