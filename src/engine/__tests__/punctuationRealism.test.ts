import { describe, it, expect } from 'vitest';
import { typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Punctuation Realism Engine (行末标点悬挂与连续标点紧凑排版)', () => {
  const paper: PaperConfig = {
    type: 'ruled',
    size: 'a4',
    width: 600, // Narrow width to trigger line wrapping easily
    height: 1000,
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 60,
    marginRight: 60,
    lineSpacing: 50,
  };

  const baseConfig: HandwritingConfig = {
    fontFamily: 'Ma Shan Zheng',
    fontSize: 32,
    fontSizeVariance: 0,
    lineHeight: 50,
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
    seed: 1234,
  };

  it('hangs punctuation at line end instead of stranding previous character on next line', () => {
    // Fill line almost completely, then end with a period
    // 600 - 120 = 480px content width. At 34px per char, 14 chars = 476px.
    const text = '这是一个刚好排满一行文字的测试。下一行从这里继续写。';
    const result = typesetText(text, paper, baseConfig);

    const chars = result.pages[0].chars;
    // Find index of '。'
    const period = chars.find(c => c.char === '。');
    expect(period).toBeDefined();

    // The period should reside on the same line as '试', not pushed alone or forcing '试' to line 2
    const shi = chars.find(c => c.char === '试');
    expect(shi).toBeDefined();
    expect(Math.abs(period!.y - shi!.y)).toBeLessThan(5);
  });

  it('compacts consecutive punctuation marks (e.g. 。” or ，”) to prevent computer-font gap', () => {
    const text = '老师亲切地对我们说：“大家要认真做实验。”同学们纷纷点头。';
    const result = typesetText(text, paper, baseConfig);

    const chars = result.pages[0].chars;
    const periodIdx = chars.findIndex(c => c.char === '。');
    expect(periodIdx).toBeGreaterThan(0);
    const quoteChar = chars[periodIdx + 1];

    if (quoteChar && quoteChar.char === '”') {
      const spacing = quoteChar.x - chars[periodIdx].x;
      // Spacing between 。and ” should be compact (< fontSize * 0.7)
      expect(spacing).toBeLessThan(baseConfig.fontSize * 0.7);
    }
  });
});
