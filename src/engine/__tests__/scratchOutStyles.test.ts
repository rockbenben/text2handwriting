import { describe, it, expect } from 'vitest';
import { typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig, ScratchOutConcreteStyle } from '../types';

describe('Multi-Style Scratch-Out Simulation Engine', () => {
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
    fontSizeVariance: 0.5,
    lineHeight: 56,
    lineHeightVariance: 0.2,
    letterSpacing: 2,
    letterSpacingVariance: 0.2,
    rotationVariance: 0.5,
    xVariance: 0.4,
    yVariance: 0.3,
    strokeWidthVariance: 0.1,
    opacityVariance: 0.02,
    lineTiltVariance: 0.05,
    inkColor: '#1e293b',
    paragraphIndent: 0,
    alignToLines: true,
    seed: 8888,
    scratchOutProbability: 0.25, // Higher probability for deterministic test sample size
  };

  // Long text to generate ample scratch-outs
  const longText = `在日常手写书写与公文批注过程中，由于笔误或思路修正，经常会出现不同形式的错字涂改。
有时候用简单的一条斜杠划掉，有时候用工整的双横线划除，有时候随手画一个叉号，有时候用密集的墨团抹掉。
真实的文档手稿绝对不是单一机械的同一种划线，而是多种涂改风格自然交织混合在一起。`;

  it('generates multiple distinct scratch-out styles when scratchOutStyle is "all" or default', () => {
    const result = typesetText(longText, paper, {
      ...baseConfig,
      scratchOutStyle: 'all',
    });

    const scratchedChars = result.pages.flatMap(p => p.chars).filter(c => c.scratchOut);
    expect(scratchedChars.length).toBeGreaterThan(5);

    const usedStyles = new Set(scratchedChars.map(c => c.scratchOut!.style));
    // Must contain multiple distinct styles across the document, not just 1
    expect(usedStyles.size).toBeGreaterThanOrEqual(3);
  });

  it('supports each concrete scratch-out style deterministically', () => {
    const allConcreteStyles: ScratchOutConcreteStyle[] = [
      'slash',
      'backslash',
      'cross_x',
      'single_line',
      'double_line',
      'triple_line',
      'boxed_slash',
      'circled_slash',
      'spiral_coil',
      'scribble',
      'heavy_blot',
      'wavy',
      'mesh_patch',
    ];

    for (const style of allConcreteStyles) {
      const result = typesetText(longText, paper, {
        ...baseConfig,
        scratchOutStyle: style,
      });

      const scratchedChars = result.pages.flatMap(p => p.chars).filter(c => c.scratchOut);
      expect(scratchedChars.length).toBeGreaterThan(0);
      for (const char of scratchedChars) {
        expect(char.scratchOut?.style).toBe(style);
      }
    }
  });

  it('draws all scratch-out styles to Canvas context without error', async () => {
    const { drawScratchOut } = await import('../paper');

    const allConcreteStyles: ScratchOutConcreteStyle[] = [
      'slash',
      'backslash',
      'cross_x',
      'single_line',
      'double_line',
      'triple_line',
      'boxed_slash',
      'circled_slash',
      'spiral_coil',
      'scribble',
      'heavy_blot',
      'wavy',
      'mesh_patch',
    ];

    for (const style of allConcreteStyles) {
      let strokeOrFillCalled = false;
      const tracingCtx = {
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
        stroke: () => { strokeOrFillCalled = true; },
        fill: () => { strokeOrFillCalled = true; },
        translate: () => {},
        rotate: () => {},
        fillText: () => {},
      } as unknown as CanvasRenderingContext2D;

      expect(() => {
        drawScratchOut(tracingCtx, {
          char: '错',
          x: 150,
          y: 200,
          fontSize: 36,
          rotation: 0,
          opacity: 1,
          strokeWidth: 0.2,
          color: '#1e293b',
          scratchOut: { style, color: '#1e293b' },
        });
      }).not.toThrow();

      expect(strokeOrFillCalled, `Style ${style} must execute canvas stroke or fill`).toBe(true);
    }
  });
});
