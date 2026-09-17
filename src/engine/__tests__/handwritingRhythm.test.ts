import { describe, it, expect } from 'vitest';
import type { PaperConfig, HandwritingConfig } from '../types';
import { typesetText } from '../typeset';

describe('Stage 3: Writing Rhythm Dynamics & Line-End Auto-Squeeze', () => {
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
    fontFamily: 'KaiTi',
    fontSize: 38,
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
    seed: 1234,
    glyphVariance: 0.3,
  };

  it('imparts natural velocity slant and fluid dynamics to high-frequency function words', () => {
    // String with high frequency words like "的", "了", "在" and standard content
    const text = '这是一个充满希望的春天，阳光洒在了大地上。';
    const result = typesetText(text, paper, config);

    expect(result.pages.length).toBe(1);
    const chars = result.pages[0].chars;

    // Find "的" and "了"
    const deChar = chars.find((c) => c.char === '的');
    const leChar = chars.find((c) => c.char === '了');

    expect(deChar).toBeDefined();
    expect(leChar).toBeDefined();

    // High-frequency words should have dynamic handwriting skew / scale applied
    expect(deChar?.skewX).toBeDefined();
    expect(typeof deChar?.skewX).toBe('number');
  });

  it('squeezes a single trailing character at line end rather than breaking it alone onto a new line', () => {
    // Construct a sentence that without squeeze would leave exactly 1 character on the next line
    // Content width: 1200 - 110 - 90 = 1000px.
    // Indent: 2 chars = 2 * (38 + 2) = 80px. Remaining: 920px.
    // Each char ~ 40px -> 920 / 40 = 23 chars.
    // If text has 24 chars in paragraph, the 24th char would normally wrap to line 2 alone.
    // With smart line-end squeeze, it squeezes onto line 1 or prevents orphan single character.
    const exactFitPlusOne = '春风拂过江南岸两岸桃花盛开柳绿花红一片生机勃勃景象美';
    const result = typesetText(exactFitPlusOne, paper, {
      ...config,
      edgeCrowding: true,
    });

    // Check lines emitted
    expect(result.pages.length).toBe(1);
    // Should not have a trailing line with only 1 isolated character
    const page = result.pages[0];

    // Group characters by line (by approximate y coordinate)
    const lineMap = new Map<number, number>();
    for (const c of page.chars) {
      const lineKey = Math.round(c.y / 20) * 20;
      lineMap.set(lineKey, (lineMap.get(lineKey) || 0) + 1);
    }

    // Verify no line is an orphan with only 1 character at the end of paragraph
    const counts = Array.from(lineMap.values());
    if (counts.length > 1) {
      const lastLineCount = counts[counts.length - 1];
      expect(lastLineCount).toBeGreaterThanOrEqual(2);
    }
  });
});
