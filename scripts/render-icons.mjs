// 把 public/ 下的 SVG 图标渲染成 PWA / iOS 需要的 PNG。
// 用后即弃的依赖，不进 package.json：
//   npm i --no-save @resvg/resvg-js && node scripts/render-icons.mjs
//
// 为什么必须补 PNG：
//   - iOS 的 apple-touch-icon 【不支持 SVG】，只认 PNG。指向 .svg 的结果是
//     「添加到主屏幕」拿不到图标，回落到网页截图。
//   - PWA 安装提示与 Android 启动器对 SVG 图标的支持不稳定；192 / 512 是标准尺寸。
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = (f) => join(root, 'public', f)

const render = (svgFile, size, outFile) => {
  const svg = readFileSync(pub(svgFile), 'utf8')
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
  writeFileSync(pub(outFile), png)
  console.log(`  ${outFile.padEnd(24)} ${String(size).padStart(4)}x${size}  ${(png.length / 1024).toFixed(1)} KB`)
}

console.log('渲染图标：')
// purpose: any —— 用圆角版，按原设计显示
render('favicon.svg', 192, 'icon-192.png')
render('favicon.svg', 512, 'icon-512.png')
// maskable 与 iOS 需要【满幅不透明】方图：iOS 与 Android 都会自己做圆角遮罩，
// 用带透明圆角的 favicon 会在四角露底
render('icon-maskable.svg', 512, 'icon-maskable-512.png')
render('icon-maskable.svg', 180, 'apple-touch-icon.png')
console.log('完成')
