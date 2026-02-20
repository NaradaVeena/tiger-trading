const YF = require('yahoo-finance2').default;

(async () => {
    try {
        // Try as instance
        // const yf = new YF(); // If YF is a class
        // BUT the previous output showed it has methods like historical attached directly?
        // Let's inspect if it's a class or object.
        console.log('Type of default:', typeof YF);
        
        // If it's a function (class), try new
        if (typeof YF === 'function') {
            try {
                const yf = new YF();
                console.log('Instantiated YF.');
                const res = await yf.historical('AAPL', { period1: '2024-01-01' });
                console.log('Success with instance:', res[0]);
            } catch(e) {
                console.log('Failed with instance:', e.message);
            }
        }

        // Try as static/object
        try {
            const res = await YF.historical('AAPL', { period1: '2024-01-01' });
            console.log('Success with static/object:', res[0]);
        } catch(e) {
            console.log('Failed with static/object:', e.message);
        }

    } catch(e) {
        console.log(e);
    }
})();
