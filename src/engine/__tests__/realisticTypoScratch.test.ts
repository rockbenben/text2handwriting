import { describe, it, expect } from 'vitest';
import { typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Realistic Typo Scratch-Out Guarantee (绝不划掉正确字)', () => {
  const paper: PaperConfig = {
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

  const config: HandwritingConfig = {
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
    seed: 12345,
    scratchOutProbability: 0.25,
    scratchOutShowCorrection: true,
  };

  const article = `大学物理实验报告：光电效应与普朗克常数测定。
观察光电效应的基本规律，验证爱因斯坦光电效应方程。测量不同频率光照射下的截止电压，计算普朗克常数。
实验测量了单色光波长下的截止电压，实验数据良好，符合理论预期。`;

  it('guarantees every struck-through character with a correction is genuinely a mistake different from the correction', () => {
    const result = typesetText(article, paper, config);
    const chars = result.pages.flatMap(p => p.chars);
    const scratchedChars = chars.filter(c => c.scratchOut && c.scratchOut.correctionChar);

    expect(scratchedChars.length).toBeGreaterThan(3);

    for (const item of scratchedChars) {
      // The baseline struck-through character MUST NOT be the correct word!
      expect(item.char).not.toBe(item.scratchOut?.correctionChar);
    }
  });

  it('fully restores original text reading sequence from correction characters', () => {
    const shortText = '大学物理实验报告';
    const result = typesetText(shortText, paper, {
      ...config,
      scratchOutProbability: 1.0, // force scratch on all eligible chars
    });

    const chars = result.pages[0].chars;
    const restored = chars.map(c => c.scratchOut?.correctionChar || c.char).join('');
    expect(restored).toBe(shortText);
  });
});
