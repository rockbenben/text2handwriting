import { describe, it, expect } from 'vitest';
import { getRecommendedFontSize } from '../paper';
import type { PaperConfig } from '../types';

describe('Stage 1: getRecommendedFontSize', () => {
  it('calculates optimal font size for ruled notebook', () => {
    const ruledPaper: PaperConfig = {
      type: 'ruled',
      size: 'a4',
      width: 1200,
      height: 1697,
      marginTop: 140,
      marginBottom: 130,
      marginLeft: 110,
      marginRight: 90,
      lineSpacing: 56,
    };

    // 56 * 0.68 = 38.08 -> 38
    expect(getRecommendedFontSize(ruledPaper)).toBe(38);
  });

  it('calculates optimal font size for composition grid paper', () => {
    const gridPaper: PaperConfig = {
      type: 'grid',
      size: 'a4',
      width: 1200,
      height: 1697,
      marginTop: 150,
      marginBottom: 140,
      marginLeft: 100,
      marginRight: 100,
      lineSpacing: 50,
      gridCols: 20,
      gridRows: 26,
    };

    // contentWidth = 1200 - 100 - 100 = 1000
    // cellWidth = 1000 / 20 = 50
    // 50 * 0.72 = 36
    expect(getRecommendedFontSize(gridPaper)).toBe(36);
  });

  it('handles wide line spacing and clamps gracefully', () => {
    const widePaper: PaperConfig = {
      type: 'ruled',
      size: 'a4',
      width: 1200,
      height: 1697,
      marginTop: 100,
      marginBottom: 100,
      marginLeft: 100,
      marginRight: 100,
      lineSpacing: 120,
    };

    const size = getRecommendedFontSize(widePaper);
    expect(size).toBeLessThanOrEqual(64);
    expect(size).toBeGreaterThanOrEqual(18);
  });
});
