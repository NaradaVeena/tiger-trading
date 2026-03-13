const fs = require('fs');
const path = require('path');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey','ripHistorical'] });

const [,, ticker, outDir] = process.argv;
if (!ticker || !outDir) {
  console.error('Usage: node fetch-regime-ticker.js TICKER OUT_DIR');
  process.exit(1);
}

(async () => {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2);
  const result = await yahooFinance.chart(ticker, {
    interval: '1d',
    period1: startDate.toISOString().split('T')[0]
  });
  const quotes = (result.quotes || [])
    .filter(q => q && q.close != null && q.high != null && q.low != null && q.volume != null)
    .map(q => ({
      date: new Date(q.date).toISOString().split('T')[0],
      close: q.close,
      high: q.high,
      low: q.low,
      volume: q.volume
    }));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${ticker}.json`), JSON.stringify({ ticker, quotes }));
  console.log(`${ticker} ${quotes.length}`);
})().catch(err => {
  console.error(`${ticker} ERROR ${err.message}`);
  process.exit(1);
});
