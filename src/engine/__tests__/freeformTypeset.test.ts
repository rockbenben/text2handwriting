import { describe, it, expect } from 'vitest';
import { typesetText, estimateCharWidth } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Freeform Text Input & Whitespace Preservation', () => {
  const paper: PaperConfig = {
    type: 'blank',
    size: 'a4',
    width: 1200,
    height: 1697,
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 100,
    marginRight: 100,
    lineSpacing: 60,
  };

  const freeConfig: HandwritingConfig = {
    fontFamily: 'Ma Shan Zheng',
    fontSize: 30,
    fontSizeVariance: 0,
    lineHeight: 45,
    lineHeightVariance: 0,
    letterSpacing: 0,
    letterSpacingVariance: 0,
    rotationVariance: 0,
    xVariance: 0,
    yVariance: 0,
    strokeWidthVariance: 0,
    opacityVariance: 0,
    lineTiltVariance: 0,
    inkColor: '#000000',
    paragraphIndent: 0, // Zero forced indent (Freeform input)
    alignToLines: false, // Free line height (unconstrained by paper lines)
    seed: 123,
  };

  it('accurately estimates width of whitespace including CJK full-width spaces', () => {
    const fontSize = 30;
    expect(estimateCharWidth(' ', fontSize)).toBeCloseTo(fontSize * 0.35);
    expect(estimateCharWidth('\t', fontSize)).toBeCloseTo(fontSize * 1.5);
    expect(estimateCharWidth('\u3000', fontSize)).toBe(fontSize);
  });

  it('starts exactly at marginLeft when paragraphIndent is 0', () => {
    const text = '自由书写起始文字，无强制缩进。';
    const result = typesetText(text, paper, freeConfig);

    expect(result.pages.length).toBe(1);
    const firstChar = result.pages[0].chars[0];
    expect(firstChar.char).toBe('自');
    expect(firstChar.x).toBe(paper.marginLeft);
  });

  it('preserves user-typed leading spaces accurately in freeform mode', () => {
    const spaces = '    '; // 4 half-width spaces
    const text = `${spaces}缩进四个空格的诗句`;
    const result = typesetText(text, paper, freeConfig);

    const firstChar = result.pages[0].chars[0];
    expect(firstChar.char).toBe('缩');
    const expectedOffset = 4 * (freeConfig.fontSize * 0.35);
    expect(firstChar.x).toBeCloseTo(paper.marginLeft + expectedOffset, 1);
  });

  it('preserves CJK full-width spaces without emitting glyph characters', () => {
    const text = '\u3000\u3000全角空格首行缩进';
    const result = typesetText(text, paper, freeConfig);

    // No glyph for '\u3000' should be emitted
    expect(result.pages[0].chars.some(c => c.char === '\u3000')).toBe(false);
    const firstChar = result.pages[0].chars[0];
    expect(firstChar.char).toBe('全');
    // Two full-width spaces advance 2 * fontSize
    const expectedOffset = 2 * freeConfig.fontSize;
    expect(firstChar.x).toBeCloseTo(paper.marginLeft + expectedOffset, 1);
  });

  it('uses custom lineHeight when alignToLines is false', () => {
    const text = '第一行\n第二行';
    const customLineHeightConfig = { ...freeConfig, lineHeight: 40, alignToLines: false };
    const result = typesetText(text, paper, customLineHeightConfig);

    const line1Char = result.pages[0].chars.find(c => c.char === '第');
    const line2Char = result.pages[0].chars.find(c => c.char === '二');

    expect(line1Char).toBeDefined();
    expect(line2Char).toBeDefined();
    // Vertical distance between line 1 and line 2 should equal custom lineHeight (40)
    const dy = line2Char!.y - line1Char!.y;
    expect(dy).toBeCloseTo(40, 0);
  });
});
