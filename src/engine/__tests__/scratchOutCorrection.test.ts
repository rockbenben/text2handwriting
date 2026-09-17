import { describe, it, expect } from 'vitest';
import { typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Scratch-Out Correction (涂改后补写正确字) Engine', () => {
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
    paragraphIndent: 0,
    alignToLines: true,
    seed: 777,
    scratchOutProbability: 0.3,
  };

  const sampleText = '在大学物理实验中，我们认真记录数据并得出科学严谨的结论。';

  it('places the correct intended character above the struck-through character by default', () => {
    const result = typesetText(sampleText, paper, {
      ...baseConfig,
      scratchOutShowCorrection: true,
      scratchOutUseCaret: true,
    });

    const scratched = result.pages[0].chars.filter(c => c.scratchOut);
    expect(scratched.length).toBeGreaterThan(0);

    for (const charItem of scratched) {
      // Must have correction character placed above
      expect(charItem.scratchOut?.correctionChar).toBeDefined();
      expect(typeof charItem.scratchOut?.correctionChar).toBe('string');
      expect(charItem.scratchOut?.correctionChar!.length).toBe(1);
      expect(charItem.scratchOut?.showCaret).toBe(true);
    }
  });

  it('preserves the original sentence integrity via correctionChar', () => {
    const text = '物理实验报告';
    const result = typesetText(text, paper, {
      ...baseConfig,
      scratchOutProbability: 1.0, // force all chars to have scratchOut
      scratchOutShowCorrection: true,
    });

    const chars = result.pages[0].chars;
    // For every character, the correctionChar should be the exact original intended character from the source text
    const correctedString = chars.map(c => c.scratchOut?.correctionChar || c.char).join('');
    expect(correctedString).toBe(text);
  });

  it('respects scratchOutShowCorrection: false when user explicitly disables it', () => {
    const result = typesetText(sampleText, paper, {
      ...baseConfig,
      scratchOutShowCorrection: false,
    });

    const scratched = result.pages[0].chars.filter(c => c.scratchOut);
    expect(scratched.length).toBeGreaterThan(0);

    for (const charItem of scratched) {
      expect(charItem.scratchOut?.correctionChar).toBeUndefined();
    }
  });

  it('supports custom correction color (such as red grading pen)', () => {
    const result = typesetText(sampleText, paper, {
      ...baseConfig,
      scratchOutShowCorrection: true,
      scratchOutCorrectionColor: '#dc2626',
    });

    const scratched = result.pages[0].chars.filter(c => c.scratchOut);
    expect(scratched.length).toBeGreaterThan(0);

    for (const charItem of scratched) {
      expect(charItem.scratchOut?.correctionColor).toBe('#dc2626');
    }
  });

  it('defaults to top_right position with rightward horizontal shift and natural slant angle', () => {
    const result = typesetText(sampleText, paper, {
      ...baseConfig,
      scratchOutProbability: 0.8,
      scratchOutShowCorrection: true,
      scratchOutCorrectionPosition: 'top_right',
    });

    const scratched = result.pages[0].chars.filter(c => c.scratchOut && c.scratchOut.correctionChar);
    expect(scratched.length).toBeGreaterThan(0);

    for (const item of scratched) {
      const so = item.scratchOut!;
      // For top_right, horizontal offset must be shifted right (offsetDX > 0.3)
      expect(so.offsetDX).toBeGreaterThan(0.3);
      // Vertical offset must be negative (above baseline)
      expect(so.offsetDY).toBeLessThan(0);
      // Tilt angle should have a natural clockwise slant for right-hand stroke (> 0 rad)
      expect(so.tiltAngle).toBeGreaterThan(0);
      expect(so.position).toBe('top_right');
    }
  });

  it('supports centered top position when explicitly requested', () => {
    const result = typesetText(sampleText, paper, {
      ...baseConfig,
      scratchOutProbability: 0.8,
      scratchOutShowCorrection: true,
      scratchOutCorrectionPosition: 'top',
    });

    const scratched = result.pages[0].chars.filter(c => c.scratchOut && c.scratchOut.correctionChar);
    expect(scratched.length).toBeGreaterThan(0);

    for (const item of scratched) {
      const so = item.scratchOut!;
      // Centered top offsetDX should stay close to 0.08 (0.0 to 0.25)
      expect(so.offsetDX).toBeLessThan(0.3);
      expect(so.position).toBe('top');
    }
  });

  it('supports random position mode mixing top_right and top across document', () => {
    const longText = '在大学物理实验中，我们认真记录数据并得出科学严谨的结论。每一次重复试验都为了获得更准确的数据与分析。';
    const result = typesetText(longText, paper, {
      ...baseConfig,
      scratchOutProbability: 0.9,
      scratchOutShowCorrection: true,
      scratchOutCorrectionPosition: 'random',
    });

    const scratched = result.pages[0].chars.filter(c => c.scratchOut && c.scratchOut.correctionChar);
    expect(scratched.length).toBeGreaterThan(5);

    const positions = new Set(scratched.map(c => c.scratchOut?.position));
    // Must contain both 'top_right' and 'top' across random choices
    expect(positions.has('top_right')).toBe(true);
    expect(positions.has('top')).toBe(true);
  });

  it('applies first-line smart avoidance to prevent top margin collision', () => {
    const shortFirstLine = '物理实验数据记录';
    const result = typesetText(shortFirstLine, paper, {
      ...baseConfig,
      scratchOutProbability: 1.0,
      scratchOutShowCorrection: true,
      scratchOutSmartAvoidance: true,
    });

    const scratched = result.pages[0].chars.filter(c => c.scratchOut && c.scratchOut.correctionChar);
    expect(scratched.length).toBeGreaterThan(0);

    for (const item of scratched) {
      const so = item.scratchOut!;
      expect(so.isFirstLine).toBe(true);
      // In first-line avoidance mode, offsetDY is lowered closer to baseline (> -0.75 instead of -0.85)
      expect(so.offsetDY).toBeGreaterThan(-0.75);
    }
  });
});
