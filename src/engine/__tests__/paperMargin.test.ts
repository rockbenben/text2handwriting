import { describe, it, expect } from 'vitest';
import { getVerticalMarginLineX, getRuledLinePositions } from '../paper';
import { typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Paper Margins & Margin Line Separation', () => {
  const basePaper: PaperConfig = {
    type: 'ruled',
    size: 'a4',
    width: 1200,
    height: 1697,
    marginTop: 140,
    marginBottom: 130,
    marginLeft: 120,
    marginRight: 90,
    lineSpacing: 56,
    showLineGuide: true,
    showMarginLine: true,
  };

  const baseConfig: HandwritingConfig = {
    fontFamily: 'Ma Shan Zheng',
    fontSize: 36,
    fontSizeVariance: 0,
    lineHeight: 56,
    lineHeightVariance: 0,
    letterSpacing: 2,
    letterSpacingVariance: 0,
    rotationVariance: 0,
    xVariance: 0,
    yVariance: 0,
    strokeWidthVariance: 0,
    opacityVariance: 0,
    lineTiltVariance: 0,
    inkColor: '#1e293b',
    paragraphIndent: 0,
    alignToLines: true,
    seed: 42,
  };

  it('calculates vertical margin line position to the left of marginLeft', () => {
    const marginX = getVerticalMarginLineX(basePaper);
    expect(marginX).not.toBeNull();
    // Margin line must be strictly to the left of text start marginLeft
    expect(marginX!).toBeLessThan(basePaper.marginLeft);
    expect(marginX!).toBe(basePaper.marginLeft - 16);
  });

  it('returns null when showMarginLine is false', () => {
    const noMarginPaper: PaperConfig = { ...basePaper, showMarginLine: false };
    expect(getVerticalMarginLineX(noMarginPaper)).toBeNull();
  });

  it('ensures all rendered characters start to the right of the vertical margin line', () => {
    const marginX = getVerticalMarginLineX(basePaper)!;
    const text = '第一行文字内容，测试左侧边距与装订红线不会重叠。\n第二行文字内容。';
    const result = typesetText(text, basePaper, baseConfig);

    expect(result.pages.length).toBeGreaterThan(0);
    const chars = result.pages[0].chars;

    for (const c of chars) {
      // Every character X must be strictly greater than margin line X
      expect(c.x).toBeGreaterThan(marginX);
      // And must start at or after marginLeft
      expect(c.x).toBeGreaterThanOrEqual(basePaper.marginLeft);
    }
  });

  it('respects independent 4-directional margins', () => {
    const customMarginPaper: PaperConfig = {
      ...basePaper,
      marginLeft: 200,
      marginRight: 150,
      marginTop: 220,
      marginBottom: 180,
    };
    const text = '独立四向边距测试，上边距220，下边距180，左边距200，右边距150。';
    const result = typesetText(text, customMarginPaper, baseConfig);

    const chars = result.pages[0].chars;
    for (const c of chars) {
      expect(c.x).toBeGreaterThanOrEqual(customMarginPaper.marginLeft);
      expect(c.x).toBeLessThanOrEqual(customMarginPaper.width - customMarginPaper.marginRight);
    }
  });

  it('keeps paper background lines spanning across sheet even when writing margins are enlarged', () => {
    const hugeMarginPaper: PaperConfig = {
      ...basePaper,
      marginTop: 400,
      marginBottom: 400,
      marginLeft: 300,
      marginRight: 300,
    };
    // Writing bounds lines
    const textLines = getRuledLinePositions(hugeMarginPaper, false);
    // Background full sheet lines
    const sheetLines = getRuledLinePositions(hugeMarginPaper, true);

    expect(sheetLines.length).toBeGreaterThan(textLines.length);
    // Background sheet lines extend above huge marginTop
    expect(sheetLines[0].y).toBeLessThan(hugeMarginPaper.marginTop);
    // Background sheet lines extend below height - marginBottom
    expect(sheetLines[sheetLines.length - 1].y).toBeGreaterThan(hugeMarginPaper.height - hugeMarginPaper.marginBottom);
  });
});
