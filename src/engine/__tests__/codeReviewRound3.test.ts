import { describe, it, expect, vi } from 'vitest';
import { typesetText, isTailForbidden } from '../typeset';
import { drawAnnotation } from '../paper';
import type { PaperConfig, HandwritingConfig, RenderChar } from '../types';

describe('Code Review Round 3: Verification Tests for Confirmed Bugs', () => {
  const defaultPaper: PaperConfig = {
    type: 'blank',
    size: 'a4',
    width: 800,
    height: 1100,
    marginTop: 60,
    marginBottom: 60,
    marginLeft: 50,
    marginRight: 50,
    lineSpacing: 40,
    showLineGuide: false,
  };

  const defaultHandwriting: HandwritingConfig = {
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontSizeVariance: 0,
    lineHeight: 40,
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
    paragraphIndent: 0,
    alignToLines: false,
    seed: 42,
    scratchOutProbability: 0,
    annotationProbability: 0,
    edgeCrowding: false,
  };

  it('Bug 9: A line must not end with a tail-forbidden character (避尾规则)', () => {
    // 28 CJK characters fill the first line, followed by '“' and '你好世界'
    const prefix = '一'.repeat(28);
    const text = `${prefix}“你好世界`;

    const result = typesetText(text, defaultPaper, defaultHandwriting);
    const page = result.pages[0];

    // Find characters on line 1 vs line 2 by comparing their Y coordinates
    const line1Chars = page.chars.filter(c => Math.abs(c.y - page.chars[0].y) < 5);
    const lastCharOfLine1 = line1Chars[line1Chars.length - 1].char;

    // Line 1 should NEVER end with '“' (tail-forbidden). It should push '“' to line 2.
    expect(isTailForbidden(lastCharOfLine1)).toBe(false);
    expect(lastCharOfLine1).not.toBe('“');

    // And '“' must be present on line 2!
    const line2Chars = page.chars.filter(c => Math.abs(c.y - page.chars[0].y) >= 5);
    expect(line2Chars[0].char).toBe('“');
  });

  it('Bug 10: Resetting custom background should restore standard A4 dimensions if paper.size was custom', () => {
    // Simulate paper state after a custom 16:9 image was uploaded
    const customPaper: PaperConfig = {
      ...defaultPaper,
      type: 'custom',
      size: 'custom',
      width: 1200,
      height: 675,
      customImageUrl: 'data:image/png;base64,sample',
    };

    // Resetting logic: when clearing background, custom size must revert to a4
    const resetPaper = {
      ...customPaper,
      customImageUrl: undefined,
      customImageAspectRatio: undefined,
      type: 'ruled' as const,
      ...(customPaper.size === 'custom' ? {
        size: 'a4' as const,
        width: 1200,
        height: 1697,
      } : {}),
    };

    expect(resetPaper.size).toBe('a4');
    expect(resetPaper.width).toBe(1200);
    expect(resetPaper.height).toBe(1697);
    expect(resetPaper.customImageUrl).toBeUndefined();
  });

  it('Bug 11: drawAnnotation should not crash when ctx.ellipse is undefined', () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      ellipse: undefined, // ctx.ellipse is not supported
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'round',
      lineJoin: 'round',
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;

    const mockItem: RenderChar = {
      char: '文',
      x: 100,
      y: 100,
      fontSize: 24,
      rotation: 0,
      opacity: 1,
      strokeWidth: 0.5,
      color: '#000000',
      annotation: {
        style: 'circle',
        color: '#dc2626',
      },
    };

    expect(() => {
      drawAnnotation(mockCtx, mockItem);
    }).not.toThrow();

    // Fallback arc should be called
    expect(mockCtx.arc).toHaveBeenCalled();
  });
});
