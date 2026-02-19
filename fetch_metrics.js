const yahooFinance = require('yahoo-finance2').default;

// Function to calculate Simple Moving Average
function calculateSMA(prices, period) {
    if (prices.length < period) return null;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
}

// Function to calculate RSI
function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    let gains = [];
    let losses = [];
    
    for (let i = 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) {
            gains.push(change);
            losses.push(0);
        } else {
            gains.push(0);
            losses.push(Math.abs(change));
        }
    }
    
    if (gains.length < period) return null;
    
    // Calculate initial average gain and loss
    let avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// Function to fetch and analyze ticker data
async function analyzeTicker(ticker) {
    try {
        console.log(`Fetching data for ${ticker}...`);
        
        const data = await yahooFinance.chart(ticker, {
            period1: '2025-04-01',
            period2: '2026-02-19',
            interval: '1d'
        });
        
        if (!data || !data.quotes || data.quotes.length === 0) {
            return {
                ticker,
                error: 'No data available'
            };
        }
        
        const quotes = data.quotes;
        const closePrices = quotes.map(q => q.close).filter(p => p != null);
        
        if (closePrices.length < 200) {
            return {
                ticker,
                error: 'Insufficient data for analysis'
            };
        }
        
        // Current price (latest close)
        const currentPrice = closePrices[closePrices.length - 1];
        const previousPrice = closePrices[closePrices.length - 2];
        
        // Daily change %
        const dailyChange = ((currentPrice - previousPrice) / previousPrice) * 100;
        
        // Calculate SMAs
        const sma20 = calculateSMA(closePrices, 20);
        const sma50 = calculateSMA(closePrices, 50);
        const sma200 = calculateSMA(closePrices, 200);
        
        // MA alignment (SMA20 > SMA50 > SMA200)
        const maAligned = sma20 > sma50 && sma50 > sma200;
        
        // Distance from SMA200
        const distFromSMA200 = ((currentPrice - sma200) / sma200) * 100;
        
        // RSI calculation
        const rsi = calculateRSI(closePrices, 14);
        
        return {
            ticker,
            price: currentPrice,
            dailyChange,
            rsi,
            maAligned,
            distFromSMA200,
            sma20,
            sma50,
            sma200
        };
        
    } catch (error) {
        console.error(`Error fetching ${ticker}:`, error.message);
        return {
            ticker,
            error: error.message
        };
    }
}

// Main function
async function main() {
    const tickers = ['ALAB', 'NVT', 'FN', 'CRDO', 'COHR', 'PWR', 'TSEM', 'ANET', 'SMH'];
    const results = [];
    
    console.log('Fetching data for all tickers...\n');
    
    for (const ticker of tickers) {
        const result = await analyzeTicker(ticker);
        results.push(result);
        // Small delay to be respectful to Yahoo Finance
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n=== STOCK ANALYSIS RESULTS ===\n');
    console.log('TICKER | Price     | Chg%    | RSI    | MA_Aligned | Dist_SMA200%');
    console.log('-------|-----------|---------|--------|------------|-------------');
    
    results.forEach(result => {
        if (result.error) {
            console.log(`${result.ticker.padEnd(6)} | ERROR: ${result.error}`);
        } else {
            const price = result.price.toFixed(2).padStart(9);
            const chg = result.dailyChange.toFixed(2).padStart(7);
            const rsi = result.rsi ? result.rsi.toFixed(1).padStart(6) : '  N/A';
            const aligned = result.maAligned ? '    YES   ' : '     NO   ';
            const dist = result.distFromSMA200.toFixed(1).padStart(11);
            
            console.log(`${result.ticker.padEnd(6)} | ${price} | ${chg}% | ${rsi} | ${aligned} | ${dist}%`);
        }
    });
    
    console.log('\nAnalysis completed at:', new Date().toISOString());
}

// Run the analysis
main().catch(console.error);