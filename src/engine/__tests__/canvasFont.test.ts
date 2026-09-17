import { describe, it, expect } from 'vitest';
import { formatFontFamilyForCanvas, buildCanvasFont } from '../paper';

describe('Canvas Font String Formatter', () => {
  it('correctly handles single font without quotes', () => {
    expect(formatFontFamilyForCanvas('Zhi Mang Xing')).toBe('"Zhi Mang Xing"');
    expect(buildCanvasFont(36, 'Zhi Mang Xing')).toContain('36px "Zhi Mang Xing"');
  });

  it('correctly handles single font with existing quotes without duplicating quotes', () => {
    expect(formatFontFamilyForCanvas('"Zhi Mang Xing"')).toBe('"Zhi Mang Xing"');
    expect(buildCanvasFont(36, '"Zhi Mang Xing"')).not.toContain('""');
  });

  it('correctly handles multi-font comma separated stacks without syntax error', () => {
    const input = '"HarmonyOS Sans SC", "HarmonyOS Sans", "鸿蒙黑体", sans-serif';
    const formatted = formatFontFamilyForCanvas(input);
    expect(formatted).not.toContain('""');
    expect(formatted).toContain('"HarmonyOS Sans SC"');
    expect(formatted).toContain('sans-serif');

    const fontStr = buildCanvasFont(36, input);
    expect(fontStr).not.toContain('""');
    expect(fontStr.startsWith('36px ')).toBe(true);
  });

  it('correctly handles system fonts with mixed quotes and keywords', () => {
    const input = 'STXingkai, "华文行楷", cursive';
    const formatted = formatFontFamilyForCanvas(input);
    expect(formatted).not.toContain('""');
    expect(formatted).toContain('"STXingkai"');
    expect(formatted).toContain('"华文行楷"');
    expect(formatted).toContain('cursive');

    const fontStr = buildCanvasFont(36, input);
    expect(fontStr).not.toContain('""');
  });

  it('correctly formats generic system and scanned custom fonts', () => {
    expect(formatFontFamilyForCanvas('田英章硬笔楷书')).toBe('"田英章硬笔楷书"');
    expect(buildCanvasFont(40, '田英章硬笔楷书')).toBe('40px "田英章硬笔楷书", "KaiTi", "STKaiti", "Microsoft YaHei", sans-serif');
  });
});
