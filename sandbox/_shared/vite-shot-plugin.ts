// Phase 0.75 sandbox only: a dev-server middleware that saves a PNG posted by a study page
// into docs/design/mockups/. Deleted with sandbox/ after p1-style-locked. Never part of a build.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

const MOCKUPS = join(process.cwd(), 'docs', 'design', 'mockups');
const SAFE = /^[a-z0-9][a-z0-9-]{0,60}$/;

export function sandboxShotPlugin(): Plugin {
  return {
    name: 'sandbox-shot',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__sandbox/shot', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        const url = new URL(req.url ?? '/', 'http://localhost');
        const study = url.searchParams.get('study') ?? '';
        if (!SAFE.test(study)) { res.statusCode = 400; res.end('bad study name'); return; }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          const b64 = body.replace(/^data:image\/png;base64,/, '');
          mkdirSync(MOCKUPS, { recursive: true });
          const existing = readdirSync(MOCKUPS).filter((f) => f.startsWith(study + '-') && f.endsWith('.png'));
          const next = existing.reduce((m, f) => Math.max(m, Number(f.slice(study.length + 1, -4)) || 0), 0) + 1;
          const name = `${study}-${String(next).padStart(2, '0')}.png`;
          writeFileSync(join(MOCKUPS, name), Buffer.from(b64, 'base64'));
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ file: `docs/design/mockups/${name}` }));
        });
      });
    },
  };
}
