// Run after `npm run build`.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createInstance } from '@module-federation/runtime';
import ssrEntryLoaderPlugin from '@module-federation/vite/ssrEntryLoader';

const dist = path.resolve('dist');

// 1. What the manifest advertises vs. what the build emitted.
for (const file of ['mf-manifest.json', 'mf-stats.json']) {
  const entry = JSON.parse(fs.readFileSync(path.join(dist, file), 'utf8')).metaData.ssrRemoteEntry;
  console.log(`dist/${file} metaData.ssrRemoteEntry = ${JSON.stringify(entry)}`);
  if (entry) {
    const exists = fs.existsSync(path.join(dist, entry.path, entry.name));
    console.log(`  dist/${entry.path}${entry.name} exists: ${exists}`);
  }
}

// 2. A Node consumer that resolves the remote through its manifest.
const server = http.createServer((req, res) => {
  const file = path.join(dist, new URL(req.url, 'http://localhost').pathname);
  const ok = file.startsWith(dist + path.sep) && fs.statSync(file, { throwIfNoEntry: false })?.isFile();
  console.log(`  [static] ${req.method} ${req.url} -> ${ok ? 200 : 404}`);
  if (!ok) return res.writeHead(404).end('not found');
  res.writeHead(200, { 'content-type': file.endsWith('.json') ? 'application/json' : 'text/javascript' });
  res.end(fs.readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

const mf = createInstance({
  name: 'host',
  remotes: [{ name: 'remote', entry: `http://127.0.0.1:${server.address().port}/mf-manifest.json` }],
  plugins: [ssrEntryLoaderPlugin()],
});
try {
  await mf.loadRemote('remote/widget');
  console.log('loadRemote("remote/widget") resolved');
} catch (error) {
  console.log(`loadRemote("remote/widget") rejected: ${error.name}: ${error.message.split('\n')[0]}`);
} finally {
  server.close();
}
