// 渲染 public/social-card.svg → public/social-card.png (og:image 用，1200×630)
// 用后即弃的依赖，不进 package.json：
//   npm i --no-save @resvg/resvg-js && node scripts/render-social-card.mjs
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'public/social-card.svg'), 'utf8')
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    // 手写字体用仓库自带的 OFL 字体，界面文字用系统字体
    fontDirs: [join(root, 'public/fonts')],
    loadSystemFonts: true,
    defaultFontFamily: 'Microsoft YaHei',
  },
})
writeFileSync(join(root, 'public/social-card.png'), resvg.render().asPng())
console.log('public/social-card.png written')
