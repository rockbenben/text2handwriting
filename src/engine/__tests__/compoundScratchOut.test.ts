import { describe, it, expect } from 'vitest';
import { typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Compound Word Scratch-Out (双字/词组连带连贯涂改)', () => {
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
    seed: 5555,
    scratchOutProbability: 0.35,
    scratchOutShowCorrection: true,
  };

  const sampleText = '在大学物理实验中，我们认真记录数据，并且分析误差产生的原因。每次重复测量都能得出更加科学严谨的结论。';

  it('generates compound scratch-outs for multi-character words with shared compound metadata', () => {
    const result = typesetText(sampleText, paper, {
      ...baseConfig,
      scratchOutProbability: 0.5,
    });

    const scratched = result.pages[0].chars.filter(c => c.scratchOut);
    expect(scratched.length).toBeGreaterThan(0);

    // Look for compound scratch-outs (linked 2 consecutive chars)
    const compoundChars = scratched.filter(c => c.scratchOut?.compoundTotal && c.scratchOut.compoundTotal > 1);
    expect(compoundChars.length).toBeGreaterThan(0);

    // Compound leaders must have isCompoundLeader = true and compoundWidth spanning > single char size
    const leader = compoundChars.find(c => c.scratchOut?.isCompoundLeader);
    expect(leader).toBeDefined();
    expect(leader!.scratchOut!.compoundWidth).toBeGreaterThan(leader!.fontSize * 1.2);
  });

  it('draws compound scratch-outs across both characters without throwing errors', async () => {
    const { drawScratchOut } = await import('../paper');
    const mockCtx = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      quadraticCurveTo: () => {},
      bezierCurveTo: () => {},
      arc: () => {},
      ellipse: () => {},
      closePath: () => {},
      rect: () => {},
      stroke: () => {},
      fill: () => {},
      translate: () => {},
      rotate: () => {},
      fillText: () => {},
    } as unknown as CanvasRenderingContext2D;

    expect(() => {
      drawScratchOut(mockCtx, {
        char: '实',
        x: 150,
        y: 200,
        fontSize: 36,
        rotation: 0,
        opacity: 1,
        strokeWidth: 0.2,
        color: '#1e293b',
        scratchOut: {
          style: 'double_line',
          color: '#1e293b',
          correctionChar: '实',
          isCompoundLeader: true,
          compoundTotal: 2,
          compoundWidth: 72,
        },
      });
    }).not.toThrow();
  });
});
