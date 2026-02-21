
const yf = require('yahoo-finance2');
console.log('Exports:', Object.keys(yf));
console.log('Default:', yf.default);
try {
  console.log('New Default:', new yf.default());
} catch(e) { console.log('Default not constructor'); }
