# mf-manifest.json advertises an SSR entry that was not emitted

Minimal reproduction for `@module-federation/vite` 1.23.1 with Vite 8.3.2 (also seen on Vite 7.3.6).

A browser-only remote (one expose, plain `vite build`, no `ssr` environment, no `--ssr`) writes
`metaData.ssrRemoteEntry` into `dist/mf-manifest.json` and `dist/mf-stats.json`, but
`dist/remoteEntry.ssr.js` is not emitted. A Node consumer that resolves the remote through the
manifest then requests a file that responds with 404.

## Steps

```sh
npm install
npm run build
npm run check
```

`check.mjs` prints what the manifest advertises and whether that file exists, then serves `dist/`
on a local port and calls `loadRemote('remote/widget')` from Node with `@module-federation/runtime`
and the `@module-federation/vite/ssrEntryLoader` runtime plugin.

## Expected

Because the build emitted no SSR entry, `metaData.ssrRemoteEntry` is absent from
`mf-manifest.json` and `mf-stats.json` (the field is optional in the manifest format). A consumer
can see that the remote has no SSR entry and skip server rendering for it.

## Actual

```text
dist/mf-manifest.json metaData.ssrRemoteEntry = {"name":"remoteEntry.ssr.js","path":"","type":"module"}
  dist/remoteEntry.ssr.js exists: false
dist/mf-stats.json metaData.ssrRemoteEntry = {"name":"remoteEntry.ssr.js","path":"","type":"module"}
  dist/remoteEntry.ssr.js exists: false
  [static] GET /mf-manifest.json -> 200
  [static] GET /remoteEntry.ssr.js -> 404
loadRemote("remote/widget") rejected: SsrEntryHttpError: Failed to fetch SSR module "http://127.0.0.1:<port>/remoteEntry.ssr.js": 404 Not Found
```
