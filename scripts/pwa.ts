import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

/** Precache the exact output of each build, including lazy chunks. */
export function pwa(): Plugin {
  return {
    name: 'apoio-pwa',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const version = createHash('sha256');
      for (const file of Object.values(bundle)) {
        version.update(file.type === 'chunk' ? file.code : file.source);
      }
      const assets = ['/index.html', '/site.webmanifest',
        '/pwa/icon-192.png', '/pwa/icon-512.png', '/pwa/apple-touch-icon.png',
        '/brand/apoio-na-rede-logo.png', '/brand/apoio-na-rede-logo-white.png',
        ...Object.keys(bundle).filter(name => name.startsWith('assets/')).map(name => `/${name}`)];
      for (const asset of assets.filter(path => path !== '/index.html' && !path.startsWith('/assets/'))) {
        version.update(readFileSync(new URL(`../public${asset}`, import.meta.url)));
      }
      const template = readFileSync(new URL('./service-worker.js', import.meta.url), 'utf8');
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: template
        .replace('__BUILD_VERSION__', version.digest('hex').slice(0, 16))
        .replace('__PRECACHE_ASSETS__', JSON.stringify(assets)) });
    },
  };
}
