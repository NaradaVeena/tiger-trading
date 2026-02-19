const yahooFinance = require('yahoo-finance2');
console.log('yahooFinance object:', typeof yahooFinance);
console.log('Available methods/properties:');
console.log(Object.keys(yahooFinance));

// Try different import approaches
try {
    const yf = require('yahoo-finance2').default;
    console.log('\nDefault export:', typeof yf);
    if (yf) {
        console.log('Default export keys:', Object.keys(yf));
    }
} catch (e) {
    console.log('\nDefault export error:', e.message);
}

// Check the version and see if we can find historical data
console.log('\nTrying to use historical method...');
if (yahooFinance.historical) {
    console.log('historical method available');
} else if (yahooFinance.chart) {
    console.log('chart method available');
} else {
    console.log('Neither historical nor chart methods found');
}