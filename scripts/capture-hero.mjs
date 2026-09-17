// 采集 README 首屏图 docs/images/hero-{zh,en}.png（1600×760）
//
// 为什么不用 playwright：这个仓库不为文档资源引入运行时依赖，
// 直接用系统已装的 Chrome + CDP（Node 22 起有原生 WebSocket）就够了。
//
// 用法：
//   1) 另开一个终端起 dev server： npm run dev
//   2) 用远程调试端口启动 Chrome（下面以 Windows 为例）：
//        "C:/Program Files/Google/Chrome/Application/chrome.exe" \
//          --headless=new --remote-debugging-port=9333 --user-data-dir=/tmp/t2h-shot about:blank
//      macOS：/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome 同上参数
//   3) node scripts/capture-hero.mjs en docs/images/hero-en.png
//      node scripts/capture-hero.mjs zh-CN docs/images/hero-zh.png
//
// 两个坑（踩过）：
//   - 必须先 localStorage.clear()。否则复用旧 profile 时 hasStoredText() 为真，
//     正文会取上次存下的内容，首屏图就变成「英文界面 + 中文文稿」。
//   - 中英文两张必须同尺寸，否则 README 里同宽显示会一高一矮。
import fs from 'node:fs';

const CDP = process.env.CDP_ENDPOINT || 'http://127.0.0.1:9333';
const APP = process.env.APP_URL || 'http://localhost:5173/';
const KEY = 'text2handwriting_language';
const VIEWPORT = { width: 1600, height: 760 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const newTab = async () => (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();

function connect(wsUrl) {
  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    ws.onopen = () =>
      resolve((method, params = {}) =>
        new Promise((res) => {
          const i = ++id;
          pending.set(i, res);
          ws.send(JSON.stringify({ id: i, method, params }));
        })
      );
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        const done = pending.get(msg.id);
        pending.delete(msg.id);
        done(msg.result);
      }
    };
  });
}

const lang = process.argv[2] || 'zh-CN';
const out = process.argv[3] || `docs/images/hero-${lang === 'en' ? 'en' : 'zh'}.png`;

const tab = await newTab();
const send = await connect(tab.webSocketDebuggerUrl);
await send('Page.enable');
await send('Runtime.enable');
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try{localStorage.clear();localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(lang)});}catch(e){}`,
});
await send('Emulation.setDeviceMetricsOverride', { ...VIEWPORT, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: APP });

// 等语言生效且文本长度稳定，避免截到加载中途
let last = -1;
let stable = 0;
for (let i = 0; i < 80; i++) {
  await sleep(250);
  const r = await send('Runtime.evaluate', {
    expression: `[document.documentElement.lang, document.body.innerText.length].join('|')`,
    returnByValue: true,
  });
  const [seen, len] = String(r.result.value).split('|');
  const n = Number(len);
  if (seen === lang && n > 150 && n === last) {
    if (++stable >= 2) break;
  } else {
    stable = 0;
  }
  last = n;
}
// 手写字体是本地 ttf，等字体就绪再截，否则会拍到兜底字体
await send('Runtime.evaluate', {
  expression: `document.fonts ? document.fonts.ready.then(()=>1) : 1`,
  awaitPromise: true,
  returnByValue: true,
});
await sleep(1200);

const info = await send('Runtime.evaluate', {
  expression: `JSON.stringify({ lang: document.documentElement.lang, dir: document.documentElement.dir,
    brand: document.querySelector('.brand-title').innerText.replace(/\\n/g,' ').trim().slice(0,40),
    docHead: (document.querySelector('textarea')?.value || '').trim().slice(0,28).replace(/\\n/g,' '),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth })`,
  returnByValue: true,
});
console.log('页面状态:', info.result.value);

const png = await send('Page.captureScreenshot', { format: 'png' });
const buf = Buffer.from(png.data, 'base64');
fs.writeFileSync(out, buf);
console.log(`已写入 ${out}  ${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}  ${(buf.length / 1024).toFixed(0)} KB`);

await fetch(`${CDP}/json/close/${tab.id}`);
