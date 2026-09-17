import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initI18n } from './i18n'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

// 先初始化 i18n（非默认语言需先取回语言包），再挂载，避免首屏语言闪烁。
// catch 不能省：initI18n 一旦抛错，不兜住就会让后面的 .then 永不执行 ——
// React 根本不挂载，页面全白且没有任何提示。语言包取不回来时它自己会回落到
// 默认语言，这里只需保证「无论初始化成功与否，应用照常挂载」。
void initI18n()
  .catch((err) => {
    console.error('i18n 初始化失败，以默认语言启动:', err);
  })
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        {/* 包住整个应用：渲染期任何未捕获异常都会落到这里，显示可读的
            错误页而不是白屏。放在 StrictMode 内层、App 外层。 */}
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    )
  })

// 生产环境注册 Service Worker（开发服务器下不注册，避免缓存干扰调试）。
// 路径基于 BASE_URL 解析，使子路径部署（GitHub Pages）与根域名（EdgeOne）都能正确限定作用域。
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl).catch((err) => {
      // 注册失败（隐私模式 / 不支持 / 被浏览器策略拒绝）不影响应用功能
      console.warn('Service worker registration failed:', err);
    });
  });
}
