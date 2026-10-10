import { formatCDF } from './src/lib/format.js';

console.log('Testing formatCDF:');
console.log('formatCDF(0):', JSON.stringify(formatCDF(0)));
console.log('formatCDF(100):', JSON.stringify(formatCDF(100)));
console.log('formatCDF(1234):', JSON.stringify(formatCDF(1234)));
console.log('formatCDF(123456):', JSON.stringify(formatCDF(123456)));

const test1 = formatCDF(0);
const test2 = '0 CDF';

console.log('Are they equal?', test1 === test2);
console.log('Test1 chars:', [...test1].map(c => c.charCodeAt(0)));
console.log('Test2 chars:', [...test2].map(c => c.charCodeAt(0)));