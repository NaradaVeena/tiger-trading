const yahooFinance = require('yahoo-finance2').default;

async function testBasicFunctionality() {
    try {
        console.log('Testing basic quote functionality...');
        const quote = await yahooFinance.quote('AAPL');
        console.log('Quote result:', quote);
        
        console.log('\nTesting historical functionality...');
        const historical = await yahooFinance.historical('AAPL', {
            period1: '2026-01-01',
            period2: '2026-02-18',
            interval: '1d'
        });
        console.log('Historical result length:', historical.length);
        console.log('Sample data:', historical[0]);
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testBasicFunctionality();