const fs = require('fs');
const path = require('path');

// 1. additions-n90.test.js
const n90Path = path.resolve('server/tests/additions-n90.test.js');
let n90 = fs.readFileSync(n90Path, 'utf8');
n90 = n90.replace(/if \(mongoose\.connection\.readyState !== 1\) \{[\s\S]*?await mongoose\.connect\(uri\);[\s\S]*?\}/, '');
fs.writeFileSync(n90Path, n90, 'utf8');

// 2. additions-n92.test.js
const n92Path = path.resolve('server/tests/additions-n92.test.js');
let n92 = fs.readFileSync(n92Path, 'utf8');
n92 = n92.replace(/if \(mongoose\.connection\.readyState !== 1\) \{[\s\S]*?await mongoose\.connect\(uri\);[\s\S]*?\}/, '');
fs.writeFileSync(n92Path, n92, 'utf8');

// 3. additions-n93.test.js
const n93Path = path.resolve('server/tests/additions-n93.test.js');
let n93 = fs.readFileSync(n93Path, 'utf8');
n93 = n93.replace(/if \(mongoose\.connection\.readyState !== 1\) \{[\s\S]*?await mongoose\.connect\(uri\);[\s\S]*?\}/, '');
fs.writeFileSync(n93Path, n93, 'utf8');

console.log('Successfully stripped redundant mongoose.connect from addition tests');
