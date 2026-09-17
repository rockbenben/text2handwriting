import { describe, it, expect } from 'vitest';
import { BUNDLED_FONTS, INITIAL_SYSTEM_FONTS, BUILTIN_FONTS, deduplicateFontList } from '../fontLoader';

describe('Expanded Handwriting Fonts Collection', () => {
  it('contains extended bundled handwriting fonts (Liu Jian Mao Cao, ZCOOL XiaoWei, etc.)', () => {
    const families = BUNDLED_FONTS.map(f => f.family);
    expect(families).toContain('Liu Jian Mao Cao');
    expect(families).toContain('ZCOOL XiaoWei');
    expect(families).toContain('Caveat');
    expect(families).toContain('Kalam');
    expect(BUNDLED_FONTS.length).toBeGreaterThanOrEqual(8);
  });

  it('contains popular Chinese handwriting fonts in INITIAL_SYSTEM_FONTS', () => {
    const families = INITIAL_SYSTEM_FONTS.map(f => f.family);
    expect(families.some(f => f.includes('庞中华') || f.includes('PangZhongHua'))).toBe(true);
    expect(families.some(f => f.includes('田英章') || f.includes('TianYingZhang'))).toBe(true);
    expect(families.some(f => f.includes('清松手写体') || f.includes('JasonHandwriting'))).toBe(true);
    expect(families.some(f => f.includes('汉仪尚巍') || f.includes('HYShangWei'))).toBe(true);
  });

  it('strictly deduplicates all newly added fonts in master BUILTIN_FONTS', () => {
    const clean = deduplicateFontList(BUILTIN_FONTS);
    expect(clean.length).toBe(BUILTIN_FONTS.length);

    // Verify each font option only has category 'bundled' or 'system'
    for (const f of clean) {
      expect(['bundled', 'system']).toContain(f.category);
    }
  });
});
