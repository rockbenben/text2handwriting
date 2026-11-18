import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

function offlineShell(): Plugin {
  let workerPath: string
  return {
    name: 'offline-shell',
    apply: 'build',
    configResolved(config) {
      workerPath = resolve(config.publicDir, 'sw.js')
    },
    generateBundle: {
      order: 'post',
      async handler(_, bundle) {
        const entry = bundle['index.html']
        if (entry?.type !== 'asset') throw new Error('Offline shell requires index.html')

        const html = String(entry.source)
        const resources = new Set(['index.html'])
        const addResource = (file: string) => {
          if (resources.has(file)) return
          const output = bundle[file]
          if (!output) throw new Error(`Missing offline shell resource: ${file}`)
          resources.add(file)
          if (output.type === 'chunk') output.imports.forEach(addResource)
        }
        for (const [, file] of html.matchAll(/\b(?:src|href)="\.\/([^"]+\.(?:js|css))"/g)) {
          addResource(file)
        }
        if (resources.size === 1) throw new Error('Offline shell has no entry assets')

        const source = await readFile(workerPath, 'utf8')
        const version = createHash('sha256')
          .update(source)
          .update(html)
          .update(JSON.stringify(Object.keys(bundle).sort()))
          .digest('hex')
          .slice(0, 16)
        const build = JSON.stringify({ version, resources: [...resources] })
        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: source.replace('const BUILD = null;', `const BUILD = ${build};`),
        })
      },
    },
  }
}

// https://vite.dev/config/
//
// base: './' — 用相对路径输出资源，使构建产物可以部署到任意子路径
// (GitHub Pages 的 https://<user>.github.io/<repo>/、企业内网静态服务器等)，
// 而不是只能挂在域名根路径。
export default defineConfig({
  base: './',
  plugins: [react(), offlineShell()],
})
