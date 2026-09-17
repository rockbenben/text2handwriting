import { describe, it, expect } from 'vitest';
import { typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Glyph Deformation Engine (同字异构微形变与多态变异)', () => {
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

  const calmConfig: HandwritingConfig = {
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
    glyphVariance: 0,
  };

  const repeatText = '常常常常常常常常常常常常常常常常常常常常常常';

  it('leaves scaleX=1, scaleY=1, skewX=0 when glyphVariance is 0', () => {
    const result = typesetText(repeatText, paper, { ...calmConfig, glyphVariance: 0 });
    const chars = result.pages[0].chars;

    for (const char of chars) {
      expect(char.scaleX ?? 1).toBe(1);
      expect(char.scaleY ?? 1).toBe(1);
      expect(char.skewX ?? 0).toBe(0);
    }
  });

  it('produces distinct organic aspect-ratio and shear values for identical characters when glyphVariance is active', () => {
    const result = typesetText(repeatText, paper, { ...calmConfig, glyphVariance: 0.6 });
    const chars = result.pages[0].chars;

    const scaleXValues = new Set(chars.map(c => Number((c.scaleX ?? 1).toFixed(4))));
    const scaleYValues = new Set(chars.map(c => Number((c.scaleY ?? 1).toFixed(4))));
    const skewXValues = new Set(chars.map(c => Number((c.skewX ?? 0).toFixed(4))));

    // Identical characters must receive diverse organic aspect ratios
    expect(scaleXValues.size).toBeGreaterThan(5);
    expect(scaleYValues.size).toBeGreaterThan(5);
    expect(skewXValues.size).toBeGreaterThan(5);
  });

  it('guarantees successive occurrences of the same character have noticeable biometric differences', () => {
    const text = '的的是的';
    const result = typesetText(text, paper, { ...calmConfig, glyphVariance: 0.5 });
    const chars = result.pages[0].chars;

    // First '的' and second '的' must not have identical scale ratio or skew
    const de1 = chars[0];
    const de2 = chars[1];
    const de4 = chars[3];

    expect(de1.char).toBe('的');
    expect(de2.char).toBe('的');
    expect(de4.char).toBe('的');

    // Differences in aspect ratios between occurrences
    const ratio1 = (de1.scaleX ?? 1) / (de1.scaleY ?? 1);
    const ratio2 = (de2.scaleX ?? 1) / (de2.scaleY ?? 1);
    expect(Math.abs(ratio1 - ratio2)).toBeGreaterThan(0.02);

    // Differences in skew or rotation
    expect(de1.skewX).not.toBe(de2.skewX);
    expect(de2.skewX).not.toBe(de4.skewX);
  });
});
