import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
//
// base: './' — 用相对路径输出资源，使构建产物可以部署到任意子路径
// (GitHub Pages 的 https://<user>.github.io/<repo>/、企业内网静态服务器等)，
// 而不是只能挂在域名根路径。
export default defineConfig({
  base: './',
  plugins: [react()],
})
