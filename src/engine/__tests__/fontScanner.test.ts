import { describe, it, expect } from 'vitest';
import { 
  POPULAR_LOCAL_FONTS_PROBE, 
  filterAndDeduplicateFonts, 
  isHandwritingOrCalligraphyFont 
} from '../fontScanner';

describe('Local Font Scanner & Detector', () => {
  it('contains comprehensive popular Chinese probe fonts list', () => {
    expect(POPULAR_LOCAL_FONTS_PROBE.length).toBeGreaterThanOrEqual(30);

    // Should include HarmonyOS, MiSans, Alibaba, and classic calligraphy
    expect(POPULAR_LOCAL_FONTS_PROBE).toContain('HarmonyOS Sans SC');
    expect(POPULAR_LOCAL_FONTS_PROBE).toContain('MiSans');
    expect(POPULAR_LOCAL_FONTS_PROBE).toContain('Alibaba PuHuiTi');
    expect(POPULAR_LOCAL_FONTS_PROBE).toContain('华文行楷');
    expect(POPULAR_LOCAL_FONTS_PROBE).toContain('方正舒体');
  });

  it('correctly identifies handwriting and calligraphy fonts', () => {
    expect(isHandwritingOrCalligraphyFont('华文行楷')).toBe(true);
    expect(isHandwritingOrCalligraphyFont('田英章硬笔楷书')).toBe(true);
    expect(isHandwritingOrCalligraphyFont('汉仪尚巍手书')).toBe(true);
    expect(isHandwritingOrCalligraphyFont('庞中华行书')).toBe(true);
    expect(isHandwritingOrCalligraphyFont('Arial')).toBe(false);
  });

  it('deduplicates and filters raw font items cleanly', () => {
    const raw = [
      { family: 'Arial', fullName: 'Arial Regular' },
      { family: 'Arial', fullName: 'Arial Bold' },
      { family: '@Arial', fullName: '@Arial' }, // vertical font to exclude
      { family: '华文行楷', fullName: 'STXingkai' },
      { family: '华文行楷', fullName: '华文行楷' },
      { family: 'MiSans', fullName: 'MiSans Regular' },
    ];

    const result = filterAndDeduplicateFonts(raw);
    expect(result.length).toBe(3); // Arial, 华文行楷, MiSans
    expect(result.map(f => f.family)).toEqual(['华文行楷', 'MiSans', 'Arial']); // handwriting & chinese sorted first
  });
});
