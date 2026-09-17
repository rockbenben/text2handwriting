import { describe, it, expect } from 'vitest';
import { getPdfPageFormat } from '../exporter';

describe('PDF Export calculations', () => {
  it('maps paper sizes to jspdf format and dimensions', () => {
    const a4 = getPdfPageFormat('a4');
    expect(a4.format).toBe('a4');
    expect(a4.widthMm).toBeCloseTo(210);
    expect(a4.heightMm).toBeCloseTo(297);

    const b5 = getPdfPageFormat('b5');
    expect(b5.format).toBe('b5');
    expect(b5.widthMm).toBeCloseTo(176);

    const a5 = getPdfPageFormat('a5');
    expect(a5.format).toBe('a5');
    expect(a5.widthMm).toBeCloseTo(148);

    const custom = getPdfPageFormat('custom', 1200, 1800);
    expect(custom.format).toBe('custom');
    // 1200×1800 比例 1.5 已高于 A4 的 1.414，旧实现按 210mm 宽换算出 315mm 高的页面，
    // 超出 A4 可打印范围会被打印机裁掉底部。现在改为保持比例并收缩宽度以塞进 A4。
    expect(custom.heightMm).toBe(297);
    expect(custom.widthMm).toBe(Math.round(297 / 1.5));
  });

  it('keeps custom pages within an A4 bounding box for common phone photo ratios', () => {
    const cases: Array<[number, number]> = [
      [1200, 1697], // A4 本身
      [1200, 1800], // 3:2
      [1200, 2133], // 9:16 手机竖拍
      [1200, 2400], // 1:2
    ];

    for (const [width, height] of cases) {
      const res = getPdfPageFormat('custom', width, height);
      // 无论输入比例如何，输出的纸张都必须能放进一张 A4
      expect(res.widthMm).toBeLessThanOrEqual(210);
      expect(res.heightMm).toBeLessThanOrEqual(297);
      // 宽高比保持，避免 PDF 内嵌图被拉伸
      const inputRatio = height / width;
      const outRatio = res.heightMm / res.widthMm;
      expect(outRatio).toBeCloseTo(inputRatio, 0);
    }
  });

  it('short custom papers still use the full 210mm width', () => {
    const res = getPdfPageFormat('custom', 1200, 1200);
    expect(res.widthMm).toBe(210);
    expect(res.heightMm).toBe(210);
  });

  it('falls back to A4 ratio when dimensions are invalid', () => {
    const res = getPdfPageFormat('custom', 0, 0);
    expect(res.widthMm).toBeLessThanOrEqual(210);
    expect(res.heightMm).toBeLessThanOrEqual(297);
  });
});
