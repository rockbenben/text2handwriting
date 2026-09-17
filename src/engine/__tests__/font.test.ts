import { describe, it, expect } from 'vitest';
import { BUILTIN_FONTS, createCustomFontOption } from '../fontLoader';

describe('Font Management & Customization', () => {
  it('bundles mainstream offline handwriting fonts', () => {
    const families = BUILTIN_FONTS.map(f => f.family);
    expect(families).toContain('Zhi Mang Xing');
    expect(families).toContain('Ma Shan Zheng');
    expect(families).toContain('Long Cang');
    expect(families).toContain('ZCOOL KuaiLe');
  });

  it('includes popular Chinese system handwriting fonts', () => {
    const families = BUILTIN_FONTS.map(f => f.family);
    // STXingkai (华文行楷) is a staple Windows handwriting font
    expect(families.some(f => f.includes('STXingkai') || f.includes('华文行楷'))).toBe(true);
    // KaiTi (楷体)
    expect(families.some(f => f.includes('KaiTi') || f.includes('楷体'))).toBe(true);
  });

  it('creates custom font option from user typed name', () => {
    const custom = createCustomFontOption('田英章硬笔楷书');
    expect(custom.name).toContain('田英章硬笔楷书');
    expect(custom.family).toContain('田英章硬笔楷书');
    expect(custom.category).toBe('system');
    expect(custom.isCustom).toBe(true);
  });
});
