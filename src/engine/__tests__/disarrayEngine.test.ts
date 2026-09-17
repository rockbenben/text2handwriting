import { describe, it, expect } from 'vitest';
import { typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Handwriting Position Disarray & Stroke Roughness Engine', () => {
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
    seed: 555,
    positionDisarray: 0,
    strokeRoughness: 0,
    edgeCrowding: false,
  };

  const text = '这是测试位置凌乱度与笔画凌乱度的手写效果';

  it('produces higher Y dispersion when positionDisarray is increased', () => {
    const calmResult = typesetText(text, paper, { ...calmConfig, positionDisarray: 0, yVariance: 0, lineTiltVariance: 0 });
    const messyResult = typesetText(text, paper, {
      ...calmConfig,
      positionDisarray: 1.5,
      yVariance: 0,
      lineTiltVariance: 0,
    });

    const calmChars = calmResult.pages[0].chars;
    const messyChars = messyResult.pages[0].chars;

    // In calmConfig with yVariance=0 and positionDisarray=0, all characters in a single line have identical baseline Y
    const calmYDiffs = calmChars.slice(1).map((c, i) => Math.abs(c.y - calmChars[i].y));
    const messyYDiffs = messyChars.slice(1).map((c, i) => Math.abs(c.y - messyChars[i].y));

    const avgCalmDiff = calmYDiffs.reduce((a, b) => a + b, 0) / calmYDiffs.length;
    const avgMessyDiff = messyYDiffs.reduce((a, b) => a + b, 0) / messyYDiffs.length;

    expect(avgCalmDiff).toBe(0);
    expect(avgMessyDiff).toBeGreaterThan(0.4);
  });

  it('tightens character spacing towards right edge when edgeCrowding is enabled', () => {
    const fullLineText = '这是一段用于测试行末拥挤效应的文字排版体验手写稿';
    const noCrowd = typesetText(fullLineText, paper, { ...calmConfig, edgeCrowding: false });
    const crowd = typesetText(fullLineText, paper, { ...calmConfig, edgeCrowding: true });

    const noCrowdLast = noCrowd.pages[0].chars.slice(-3);
    const crowdLast = crowd.pages[0].chars.slice(-3);

    const noCrowdAvg = noCrowdLast.reduce((s, c) => s + c.fontSize, 0) / noCrowdLast.length;
    const crowdAvg = crowdLast.reduce((s, c) => s + c.fontSize, 0) / crowdLast.length;

    expect(crowdAvg).toBeLessThan(noCrowdAvg);
  });

  it('augments stroke width variation when strokeRoughness is enabled', () => {
    const calmResult = typesetText(text, paper, { ...calmConfig, strokeWidthVariance: 0, strokeRoughness: 0 });
    const roughResult = typesetText(text, paper, {
      ...calmConfig,
      strokeWidthVariance: 0,
      strokeRoughness: 0.8,
    });

    const calmStrokes = new Set(calmResult.pages[0].chars.map(c => c.strokeWidth));
    const roughStrokes = new Set(roughResult.pages[0].chars.map(c => c.strokeWidth));

    expect(roughStrokes.size).toBeGreaterThan(calmStrokes.size);
  });
});
