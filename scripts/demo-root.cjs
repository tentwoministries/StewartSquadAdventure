// After `vite build --mode demo`: a root index.html that forwards to the hub, then dist-demo.zip.
// The reel is static (relative paths, no runtime network calls); any static host serves it from the folder root.
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const out = path.join(process.cwd(), 'dist-demo');
fs.writeFileSync(path.join(out, 'index.html'), '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=./sandbox/"><title>Stewart Squad Adventure: the demo scenes</title></head><body style="background:#0B0E1A;color:#FFF5E6;font-family:Georgia,serif;padding:40px"><a href="./sandbox/" style="color:#E8A838">Open the demo scenes</a></body></html>\n');
const zip = path.join(process.cwd(), 'dist-demo.zip');
if (fs.existsSync(zip)) fs.unlinkSync(zip);
try {
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${out}\\*' -DestinationPath '${zip}' -Force"`, { stdio: 'inherit' });
  console.log('demo build: dist-demo/ and dist-demo.zip (' + Math.round(fs.statSync(zip).size / 1024) + ' KB)');
} catch { console.log('demo build: dist-demo/ ready (zip step skipped: PowerShell Compress-Archive unavailable)'); }
