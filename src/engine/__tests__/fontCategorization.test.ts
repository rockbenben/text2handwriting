import { describe, it, expect } from 'vitest';
import { BUNDLED_FONTS, INITIAL_SYSTEM_FONTS, BUILTIN_FONTS, deduplicateFontList, createCustomFontOption } from '../fontLoader';

describe('Two-category Font System (仓库自带 与 系统扫描)', () => {
  it('only has two categories: bundled and system', () => {
    for (const font of BUILTIN_FONTS) {
      expect(['bundled', 'system']).toContain(font.category);
    }
  });

  it('bundled fonts only contains repository-stored offline fonts', () => {
    expect(BUNDLED_FONTS.length).toBeGreaterThanOrEqual(4);
    const families = BUNDLED_FONTS.map(f => f.family);
    expect(families).toContain('Zhi Mang Xing');
    expect(families).toContain('Ma Shan Zheng');
    expect(families).toContain('Long Cang');
    expect(families).toContain('ZCOOL KuaiLe');
  });

  it('initial system fonts include brand and popular handwriting fonts', () => {
    const families = INITIAL_SYSTEM_FONTS.map(f => f.family);
    expect(families.some(f => f.includes('HarmonyOS'))).toBe(true);
    expect(families.some(f => f.includes('MiSans'))).toBe(true);
    expect(families.some(f => f.includes('Alibaba'))).toBe(true);
    expect(families.some(f => f.includes('STXingkai') || f.includes('华文行楷'))).toBe(true);
  });

  it('strictly deduplicates fonts without case or quote duplicates', () => {
    const rawList = [
      ...BUNDLED_FONTS,
      ...INITIAL_SYSTEM_FONTS,
      { id: 'dup_1', name: 'MiSans', family: 'MiSans', category: 'system' as const },
      { id: 'dup_2', name: '华文行楷', family: 'STXingkai, "华文行楷"', category: 'system' as const },
      { id: 'dup_3', name: '志莽行书', family: 'Zhi Mang Xing', category: 'system' as const }, // already in bundled!
    ];

    const clean = deduplicateFontList(rawList);
    // Zhi Mang Xing should only appear once (under bundled)
    const zhimangCount = clean.filter(f => f.family.includes('Zhi Mang Xing')).length;
    expect(zhimangCount).toBe(1);

    // MiSans should only appear once
    const misansCount = clean.filter(f => f.name.includes('MiSans')).length;
    expect(misansCount).toBe(1);
  });

  it('adds user custom input to system category', () => {
    const custom = createCustomFontOption('庞中华硬笔行书');
    expect(custom.category).toBe('system');
    expect(custom.isCustom).toBe(true);
  });
});
