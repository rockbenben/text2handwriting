import { describe, it, expect } from 'vitest';
import { typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Handwritten Random Scratch-out (错字涂改模拟)', () => {
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
    paragraphIndent: 2,
    alignToLines: true,
    seed: 42,
    scratchOutProbability: 0,
    scratchOutStyle: 'single_line',
  };

  const longText = `中华优秀传统文化博大精深、源远流长，是中华民族的根和魂。
在五千多年的历史长河中，中华民族创造了灿烂辉煌的文明，培育了特有的精神气质与道德规范。
自强不息的奋斗精神、厚德载物的包容品格、天下兴亡匹夫有责的家国情怀，始终激励着一代又一代华夏儿女。
当代青年应当坚定文化自信，传承红色基因，在新时代的广阔舞台上绽放青春华彩，书写无愧于时代的奋斗篇章。
我们更要坚持守正创新，以开放包容的胸怀吸收外来优秀文化，让古老的中华文明在现代社会焕发出更加绚烂夺目的生机。`;

  it('generates zero scratch-outs when probability is 0', () => {
    const result = typesetText(longText, paper, { ...baseConfig, scratchOutProbability: 0 });
    const allChars = result.pages.flatMap(p => p.chars);
    const scratched = allChars.filter(c => c.scratchOut);
    expect(scratched.length).toBe(0);
  });

  it('generates occasional scratch-out marks when probability is enabled', () => {
    const result = typesetText(longText, paper, {
      ...baseConfig,
      scratchOutProbability: 0.04, // 4%
      scratchOutStyle: 'double_line',
    });
    const allChars = result.pages.flatMap(p => p.chars);
    const scratched = allChars.filter(c => c.scratchOut);

    expect(scratched.length).toBeGreaterThan(0);
    expect(scratched.length).toBeLessThan(allChars.length * 0.15);

    // Scratched characters must have proper style and inkColor
    for (const c of scratched) {
      expect(c.scratchOut?.style).toBe('double_line');
      expect(c.scratchOut?.color).toBe(baseConfig.inkColor);
      // Punctuation and whitespace must never be scratched
      expect(['，', '。', '、', ' ']).not.toContain(c.char);
    }
  });

  it('supports multiple scratch-out styles (single_line, double_line, wavy, scribble)', () => {
    const styles: Array<'single_line' | 'double_line' | 'wavy' | 'scribble'> = [
      'single_line',
      'double_line',
      'wavy',
      'scribble',
    ];

    for (const style of styles) {
      const result = typesetText(longText, paper, {
        ...baseConfig,
        scratchOutProbability: 0.05,
        scratchOutStyle: style,
        seed: 12345,
      });
      const scratched = result.pages.flatMap(p => p.chars).filter(c => c.scratchOut);
      expect(scratched.length).toBeGreaterThan(0);
      expect(scratched[0].scratchOut?.style).toBe(style);
    }
  });
});
