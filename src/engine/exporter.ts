import type { PaperConfig, PaperSize, PageLayout, HandwritingConfig, DoodleMap } from './types';
import { renderHandwritingPageToCanvas } from './paper';
import { drawDoodles } from './doodle';

/** 在已按 scale 渲染好的页面画布上叠加该页手绘层 */
function paintDoodles(canvas: HTMLCanvasElement, scale: number, strokes: DoodleMap[number] | undefined): void {
  if (!strokes || strokes.length === 0) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  ctx.scale(scale, scale);
  drawDoodles(ctx, strokes);
  ctx.restore();
}

// jspdf / jszip 只在点击导出时才用到，改成动态 import 后 Vite 会把它们拆成
// 独立 chunk，不再计入首屏体积（jszip 含 bluebird/fflate 约 450KB，jspdf 约 270KB）。
// 每次调用都 await import() 没有额外开销：模块求值结果会被 JS 运行时缓存，
// 第二次导出的 import() 直接命中已加载模块。

export function getPdfPageFormat(size: PaperSize, width = 1200, height = 1697): { format: string; widthMm: number; heightMm: number } {
  switch (size) {
    case 'b5':
      return { format: 'b5', widthMm: 176, heightMm: 250 };
    case 'a5':
      return { format: 'a5', widthMm: 148, heightMm: 210 };
    case 'custom': {
      const ratio = height > 0 && width > 0 ? height / width : 1697 / 1200;
      // 上传手机拍纸后纸张尺寸完全跟随照片比例。若按 210mm 宽等比换算，
      // 3:2 → 315mm、16:9 → 373mm，都超出 A4 可打印高度，打印机会裁掉底部。
      // 因此对超高比例改成"保持宽高比、且整页能塞进一张 A4"。
      // 画布是按 widthMm×heightMm 整体拉伸的，宽高比一致就不会失真。
      if (ratio >= 297 / 210) {
        return { format: 'custom', widthMm: Math.round(297 / ratio), heightMm: 297 };
      }
      return { format: 'custom', widthMm: 210, heightMm: Math.round(210 * ratio) };
    }
    case 'a4':
    default:
      return { format: 'a4', widthMm: 210, heightMm: 297 };
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 延迟释放，兼容个别浏览器在同步 click 后仍需读 blob URL 的情况
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * 在隐藏 iframe 里打印一张已合成好的整页图片（纸张+文字+手绘）。
 *
 * 不走 window.print() + 打印 CSS：那条路径截的是实时预览，分辨率只有预览档、
 * 手绘覆盖层不保证进入打印快照，而且 1200px 宽的纸在 A4 上会被页边裁切。
 * 这里直接把 @page 尺寸设成纸张的真实毫米尺寸、margin 0、图片铺满，
 * 打印出来的内容与导出 PNG 完全一致。
 */
export function printPageImage(dataUrl: string, widthMm: number, heightMm: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    let settled = false;
    const cleanup = () => {
      setTimeout(() => iframe.remove(), 500);
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const fail = (err: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err instanceof Error ? err : new Error('print failed'));
    };

    iframe.onload = () => {
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      if (!win || !doc) {
        fail(new Error('print iframe unavailable'));
        return;
      }
      doc.open();
      doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>print</title>
<style>
@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
img { display: block; width: ${widthMm}mm; height: ${heightMm}mm; }
</style></head><body><img src="${dataUrl}" alt="handwriting page"/></body></html>`);
      doc.close();

      const img = doc.querySelector('img');
      const triggerPrint = () => {
        try {
          win.focus();
          win.print();
          // 多数浏览器：打印对话框关闭后触发 afterprint
          win.addEventListener('afterprint', finish, { once: true });
          // 兜底：某些环境不发 afterprint，避免 iframe 常驻
          setTimeout(finish, 120_000);
        } catch (err) {
          fail(err);
        }
      };
      if (img && !img.complete) {
        img.onload = triggerPrint;
        img.onerror = () => fail(new Error('print image failed to load'));
      } else {
        triggerPrint();
      }
    };

    document.body.appendChild(iframe);
  });
}

/**
 * Exports a single page canvas to image file
 */
export async function exportCanvasAsImage(
  canvas: HTMLCanvasElement,
  filename: string,
  format: 'png' | 'jpeg' = 'png',
  quality = 0.95
): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready;
  }
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          downloadBlob(blob, filename);
          resolve();
        } else {
          // toBlob 在 canvas 被污染 (CORS) 或编码失败时回调 null。
          // 若不 reject，调用方会以为导出成功，用户看到的却是"点了没反应"。
          reject(new Error(`toBlob returned null for ${format}`));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Exports all pages as a ZIP bundle of high-res images
 */
export async function exportAllPagesAsZip(
  pages: PageLayout[],
  paper: PaperConfig,
  handwriting: HandwritingConfig,
  scale = 2.0,
  format: 'png' | 'jpeg' = 'png',
  customImage?: HTMLImageElement | null,
  onProgress?: (current: number, total: number) => void,
  doodles?: DoodleMap,
  fileBaseName = 'handwriting'
): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready;
  }
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const offscreenCanvas = document.createElement('canvas');
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';

  for (let i = 0; i < pages.length; i++) {
    renderHandwritingPageToCanvas(offscreenCanvas, pages[i], paper, handwriting, scale, customImage);
    paintDoodles(offscreenCanvas, scale, doodles?.[pages[i].pageIndex]);

    const blob = await new Promise<Blob>((resolve, reject) => {
      offscreenCanvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            // 静默跳过的话，压缩包实际页数会比文件名声称的少
            reject(new Error(`toBlob returned null for page ${i + 1}`));
          }
        },
        mimeType,
        0.95
      );
    });

    const pageNum = String(i + 1).padStart(2, '0');
    zip.file(`handwriting_page_${pageNum}.${ext}`, blob);

    if (onProgress) {
      onProgress(i + 1, pages.length);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, `${fileBaseName}_all-${pages.length}pages_${Date.now()}.zip`);
}

/**
 * Exports all pages as a multi-page PDF
 */
export async function exportAllPagesAsPdf(
  pages: PageLayout[],
  paper: PaperConfig,
  handwriting: HandwritingConfig,
  scale = 2.0,
  customImage?: HTMLImageElement | null,
  onProgress?: (current: number, total: number) => void,
  doodles?: DoodleMap,
  fileBaseName = 'handwriting'
): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready;
  }
  const { widthMm, heightMm } = getPdfPageFormat(paper.size, paper.width, paper.height);
  const orientation = widthMm > heightMm ? 'landscape' : 'portrait';
  const { default: jsPDF } = await import('jspdf');
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

    renderHandwritingPageToCanvas(offscreenCanvas, pages[i], paper, handwriting, scale, customImage);
    paintDoodles(offscreenCanvas, scale, doodles?.[pages[i].pageIndex]);

    const imgData = offscreenCanvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm, undefined, 'FAST');

    if (onProgress) {
      onProgress(i + 1, pages.length);
    }
  }

  const pdfBlob = pdf.output('blob');
  downloadBlob(pdfBlob, `${fileBaseName}_${pages.length}pages_${Date.now()}.pdf`);
}
