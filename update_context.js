const fs = require('fs');
const path = '/home/vamsi/.openclaw/workspace/contexts/tiger/CONTEXT.md';
let content = fs.readFileSync(path, 'utf8');

const replacement = `## Current Portfolio State
- **Total Value:** $99,357.92 (-0.64%)
- **Cash:** $79,756.42 (80.3%)
- **Positions:** COHR (7.7%), ANET (4.5%), PWR (3.8%), VRT (3.7%)
- **Heat:** 19.7%
- **Alpha vs SMH:** -2.43%
- **Pending Proformas:** None`;

content = content.replace(/## Current Portfolio State[\s\S]*?- \*\*Pending Proformas:\*\* None/, replacement);
fs.writeFileSync(path, content);
