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
 * 1. 标签页可见时：等待 requestAnimationFrame 并在下一帧后的宏任务 (setTimeout 0) 中恢复，
 *    确保浏览器在绘制完成后才继续下一页。
 * 2. 标签页切后台时：rAF 会被暂停，通过 100ms 超时计时器兜底恢复，保证后台导出不中断。
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
 * 该模块通过动态 import('./pdfExporter') 按需加载，将体积庞大的 jsPDF（~130 kB gzip）
 * 隔离在独立 chunk 中，不进入首屏 bundle。
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
