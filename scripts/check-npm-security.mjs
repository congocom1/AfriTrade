import { spawnSync } from 'node:child_process';
const result = spawnSync('npm', ['audit','--json'], { encoding:'utf8', maxBuffer: 10000000 });
let audit;
try { audit = JSON.parse(result.stdout); } catch { console.error('npm audit is unavailable'); process.exit(1); }
if (audit.error || !audit.vulnerabilities) { console.error('npm audit failed'); process.exit(1); }
const severe = Object.entries(audit.vulnerabilities).filter(([,v]) => ['high','critical'].includes(v.severity)).map(([k]) => k);
const newIssues = severe;
console.log(`npm audit: ${severe.length} high/critical affected packages, ${newIssues.length} remaining`);
if (newIssues.length) { console.error('New high/critical: '+newIssues.join(', ')); process.exit(1); }
