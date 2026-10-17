// Performance monitoring and bundle analysis script
// Usage: node scripts/performance-monitor.js

const fs = require('fs');
const path = require('path');

const analyzeBundle = () => {
  const statsPath = path.join(process.cwd(), 'dist', 'stats.json');

  if (!fs.existsSync(statsPath)) {
    console.log('📊 Bundle analysis not found. Run "npm run build" first to generate stats.json');
    return;
  }

  try {
    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));

    console.log('\n📊 Bundle Analysis Report');
    console.log('========================\n');

    // Analyze chunks by size
    const chunks = Object.values(stats.assets)
      .filter(asset => asset.type === 'javascript' || asset.type === 'chunk')
      .sort((a, b) => b.size - a.size);

    console.log('Top 15 Largest Chunks:');
    chunks.slice(0, 15).forEach((chunk, index) => {
      const sizeKB = (chunk.size / 1024).toFixed(2);
      const percentage = ((chunk.size / stats.assetsTotal) * 100).toFixed(1);
      const typeIcon = chunk.type === 'chunk' ? '📦' : '📜';
      console.log(`  ${index + 1}. ${typeIcon} ${chunk.name} - ${sizeKB}KB (${percentage}%)`);
    });

    // Check for oversized chunks (>500KB)
    const oversizedChunks = chunks.filter(chunk => chunk.size > 500 * 1024);
    if (oversizedChunks.length > 0) {
      console.log('\n⚠️  Oversized chunks (>500KB):');
      oversizedChunks.forEach(chunk => {
        const sizeKB = (chunk.size / 1024).toFixed(2);
        console.log(`  - ${chunk.name}: ${sizeKB}KB`);
      });
    }

    // Analyze vendor chunks
    const vendorChunks = chunks.filter(chunk =>
      chunk.name.includes('vendor') ||
      chunk.name.includes('react') ||
      chunk.name.includes('base44') ||
      chunk.name.includes('radix')
    );

    console.log('\n📦 Vendor/Library Chunks Analysis:');
    vendorChunks.forEach(chunk => {
      const sizeKB = (chunk.size / 1024).toFixed(2);
      console.log(`  - ${chunk.name}: ${sizeKB}KB`);
    });

    // Calculate optimization potential
    const totalSize = stats.assetsTotal;
    const optimizationTarget = totalSize * 0.7; // 30% reduction target
    const currentOptimized = chunks
      .filter(chunk => chunk.size < 200 * 1024) // <200KB chunks
      .reduce((sum, chunk) => sum + chunk.size, 0);

    const optimizationPercentage = (currentOptimized / totalSize * 100).toFixed(1);
    console.log(`\n🎯 Optimization Progress: ${optimizationPercentage}% of bundle is optimized (<200KB)`);

    // Performance recommendations
    console.log('\n💡 Performance Optimization Recommendations:');

    if (oversizedChunks.length > 0) {
      console.log('  • Split oversized chunks into smaller bundles');
    }

    if (vendorChunks.length > 0) {
      const vendorTotal = vendorChunks.reduce((sum, chunk) => sum + chunk.size, 0);
      const vendorPercentage = (vendorTotal / totalSize * 100).toFixed(1);
      console.log(`  • Vendor chunks: ${vendorPercentage}% of total bundle size - consider lazy loading`);
    }

    const cssAssets = Object.values(stats.assets).filter(asset =>
      asset.name?.endsWith('.css') || asset.name?.endsWith('.style')
    );
    if (cssAssets.length > 3) {
      console.log(`  • ${cssAssets.length} CSS files - consider CSS code splitting`);
    }

    // Check for code splitting opportunities
    const similarChunks = chunks.reduce((groups, chunk) => {
      const baseName = chunk.name.split('.')[0];
      if (!groups[baseName]) groups[baseName] = [];
      groups[baseName].push(chunk);
      return groups;
    }, {});

    const duplicateGroups = Object.values(similarChunks).filter(group => group.length > 1);
    if (duplicateGroups.length > 0) {
      console.log(`  • ${duplicateGroups.length} duplicate chunk patterns - check for bundle splitting opportunities`);
    }

  } catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
  }
};

const generateHtmlReport = () => {
  const reportPath = path.join(process.cwd(), 'dist', 'bundle-report.html');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bundle Analysis Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .card h3 {
            margin: 0 0 10px 0;
            font-size: 1.2em;
        }
        .card .value {
            font-size: 2em;
            font-weight: bold;
        }
        .chunk-list {
            max-height: 500px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .chunk-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid #eee;
        }
        .chunk-item:last-child {
            border-bottom: none;
        }
        .chunk-name {
            font-family: monospace;
            flex: 1;
        }
        .chunk-size {
            font-weight: bold;
            color: #e74c3c;
        }
        .optimization-section {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .optimization-section h2 {
            color: #2c3e50;
            margin-top: 0;
        }
        .recommendation {
            background: white;
            padding: 12px;
            margin: 8px 0;
            border-left: 4px solid #3498db;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Bundle Analysis Report</h1>

        <div class="summary-cards">
            <div class="card">
                <h3>Total Bundle Size</h3>
                <div class="value">${(stats.assetsTotal / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <div class="card">
                <h3>Chunk Count</h3>
                <div class="value">${chunks.length}</div>
            </div>
            <div class="card">
                <h3>Optimization Progress</h3>
                <div class="value">${optimizationPercentage}%</div>
            </div>
        </div>

        <h2>📦 Top 10 Largest Chunks</h2>
        <div class="chunk-list">
            ${chunks.slice(0, 10).map((chunk, index) => `
                <div class="chunk-item">
                    <div class="chunk-name">${chunk.name}</div>
                    <div class="chunk-size">${(chunk.size / 1024).toFixed(2)} KB</div>
                </div>
            `).join('')}
        </div>

        <div class="optimization-section">
            <h2>🎯 Optimization Recommendations</h2>
            ${recommendations.map(rec => `
                <div class="recommendation">
                    <strong>${rec.title}:</strong> ${rec.description}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(reportPath, html);
    console.log(`\n📄 HTML report generated: ${reportPath}`);
};

// Run analysis
const main = () => {
    console.log('🚀 Starting bundle analysis...');

    // Check if we're in a build environment
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
        console.log('📁 Dist directory not found. Please run "npm run build" first.');
        return;
    }

    try {
        // Try to analyze existing stats.json
        analyzeBundle();

        // Generate HTML report if available
        if (fs.existsSync(path.join(process.cwd(), 'dist', 'stats.json'))) {
            generateHtmlReport();
        }

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
    }
};

// Additional analysis functions
const stats = {
    assetsTotal: 0,
    assets: []
};

const chunks = [];
const optimizationPercentage = '0';
const recommendations = [
    { title: 'Lazy Loading', description: 'Implement route-based code splitting for better initial load performance' },
    { title: 'Bundle Analysis', description: 'Use vite-bundle-analyzer for detailed bundle breakdown' },
    { title: 'Tree Shaking', description: 'Optimize imports to remove unused code' },
    { title: 'Code Splitting', description: 'Split large libraries into smaller chunks' },
    { title: 'Asset Optimization', description: 'Optimize and compress images, fonts, and other static assets' }
];

main();