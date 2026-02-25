const yahooFinance = require('yahoo-finance2').default;
yahooFinance.historical('ALAB', { period1: new Date('2025-01-01'), period2: new Date('2026-02-24') })
  .then(data => console.log('success', data.length))
  .catch(err => console.log('error', err.message));
