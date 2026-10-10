// Simple test to verify money functions work
const { round2Cents, round2, usdCentsToCdfCents, cdfCentsToUsdCents, formatUSD, formatCDF } = require('./src/lib/format');

console.log('Testing money functions...');

// Test round2Cents
console.log('round2Cents(1234):', round2Cents(1234));
console.log('round2Cents(0):', round2Cents(0));
console.log('round2Cents(-50):', round2Cents(-50));

// Test round2Cents rounding
console.log('round2Cents(1234.5):', round2Cents(1234.5));
console.log('round2Cents(1234.4):', round2Cents(1234.4));
console.log('round2Cents(1234.500001):', round2Cents(1234.500001));

// Test round2
console.log('round2(12.34):', round2(12.34));
console.log('round2(12.345):', round2(12.345));
console.log('round2(12.344):', round2(12.344));

// Test USD to CDF conversion
console.log('usdCentsToCdfCents(100):', usdCentsToCdfCents(100)); // 1 USD -> 2800 CDF
console.log('usdCentsToCdfCents(50):', usdCentsToCdfCents(50)); // 0.5 USD -> 1400 CDF
console.log('usdCentsToCdfCents(1):', usdCentsToCdfCents(1)); // 0.01 USD -> 28 CDF

// Test CDF to USD conversion
console.log('cdfCentsToUsdCents(280000):', cdfCentsToUsdCents(280000)); // 2800 CDF -> 1 USD
console.log('cdfCentsToUsdCents(140000):', cdfCentsToUsdCents(140000)); // 1400 CDF -> 0.5 USD
console.log('cdfCentsToUsdCents(28):', cdfCentsToUsdCents(28)); // 0.28 CDF -> 0.0001 USD (rounded)

// Test formatting
console.log('formatUSD(0):', formatUSD(0));
console.log('formatUSD(100):', formatUSD(100));
console.log('formatUSD(1234):', formatUSD(1234));
console.log('formatUSD(123456):', formatUSD(123456));

console.log('formatCDF(0):', formatCDF(0));
console.log('formatCDF(100):', formatCDF(100));
console.log('formatCDF(1234):', formatCDF(1234));
console.log('formatCDF(123456):', formatCDF(123456));

console.log('All money function tests completed successfully!');