import jsPDF from 'jspdf';
import { composeOutputPage, downloadBlob, getPdfPageFormat, type PageComposition } from './exporter';
import type { PageLayout } from './types';

/**
 * 让出主线程执行权，给浏览器重绘进度条的机会。
 *
 * 在导出多页长文档时，Canvas 绘制和 JPEG 压缩是 CPU 密集型操作。
 * 若紧密循环同步执行，UI 线程会被完全卡死，进度弹窗不会更新甚至触发浏览器「页面无响应」提示。
 *
 * 实现机制：
 * 1. 标签页在前台：等一帧 requestAnimationFrame（浏览器先完成本帧绘制），再用 setTimeout 0
 *    把恢复排进宏任务，让进度条有机会重绘后再继续下一页。
 * 2. 标签页在后台：rAF 不会触发，直接 setTimeout 0 继续；后台本来就不需要重绘，无需等帧。
 * 3. 兜底：在前台等待 rAF 期间被切到后台时，100ms 超时计时器强制恢复，避免整次导出卡死。
 */
function yieldForProgressPaint(): Promise<void> {
  return new Promise(resolve => {
    if (document.hidden) {
      window.setTimeout(resolve, 0);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      window.clearTimeout(timeout);
      window.setTimeout(resolve, 0);
    });
    const timeout = window.setTimeout(() => {
      window.cancelAnimationFrame(frame);
      resolve();
    }, 100);
  });
}

/**
 * 将全部页面导出为高质量多页 PDF 文档。
 *
 * 该模块通过动态 import('./pdfExporter') 按需加载，把 jsPDF 与 PDF 导出管线
 * （独立 chunk ≈400 kB / gzip ≈130 kB）隔离在首屏 bundle 之外。
 *
 * @param pages 全部排版页面数组
 * @param composition 页面合成参数（纸张、笔迹、缩放、底图与手绘标注）
 * @param onProgress 进度回调函数 (当前页, 总页数)
 * @param fileBaseName 导出文件名前缀
 */
export async function exportAllPagesAsPdf(
  pages: readonly PageLayout[],
  composition: PageComposition,
  onProgress?: (current: number, total: number) => void,
  fileBaseName = 'handwriting'
): Promise<void> {
  const { paper } = composition;
  const { widthMm, heightMm } = getPdfPageFormat(paper.size, paper.width, paper.height);
  const orientation = widthMm > heightMm ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
  });

  const offscreenCanvas = document.createElement('canvas');

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      pdf.addPage([widthMm, heightMm], orientation);
    }

    composeOutputPage(offscreenCanvas, pages[i], composition);

    // 使用 0.92 质量的高压缩比 JPEG 作为内嵌位图，既保证手写字迹锐利，又大幅削减 PDF 体积
    const imgData = offscreenCanvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm, undefined, 'FAST');

    if (onProgress) {
      onProgress(i + 1, pages.length);
      if (pages.length > 1) await yieldForProgressPaint();
    }
  }

  const pdfBlob = pdf.output('blob');
  downloadBlob(pdfBlob, `${fileBaseName}_${pages.length}pages_${Date.now()}.pdf`);
}
