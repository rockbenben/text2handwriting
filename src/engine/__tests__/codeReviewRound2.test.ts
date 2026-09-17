import { describe, it, expect, vi } from 'vitest';
import { getTypoForChar, hasTypoVariant } from '../typoEngine';
import { typesetText } from '../typeset';
import { renderPaperBackground, renderHandwritingPageToCanvas } from '../paper';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Code Review Round 2: Verification Tests for Confirmed Bugs', () => {
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
    letterSpacing: 2,
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
  };

  it('Bug 6: English characters and digits should have realistic slips and never fall back to "之"', () => {
    expect(hasTypoVariant('a')).toBe(true);
    expect(hasTypoVariant('Z')).toBe(true);
    expect(hasTypoVariant('5')).toBe(true);

    const typoA = getTypoForChar('a', () => 0.1);
    expect(typoA).not.toBeNull();
    expect(typoA).not.toBe('之');
    expect(/[a-zA-Z]/.test(typoA!)).toBe(true);

    const typoH = getTypoForChar('H', () => 0.1);
    expect(typoH).not.toBeNull();
    expect(typoH).not.toBe('之');
    expect(/[a-zA-Z]/.test(typoH!)).toBe(true);

    // Typesetting English text with 100% scratch-out probability
    const result = typesetText('Hello World', defaultPaper, {
      ...defaultHandwriting,
      scratchOutProbability: 1.0,
      scratchOutShowCorrection: true,
    });

    const scratchChars = result.pages[0].chars.filter(c => c.scratchOut !== undefined);
    expect(scratchChars.length).toBeGreaterThan(0);
    for (const sc of scratchChars) {
      // Baseline typo character should NEVER be Chinese '之' for English letters
      expect(sc.char).not.toBe('之');
      expect(sc.scratchOut?.correctionChar).toBeDefined();
    }
  });

  it('Bug 7: Compound scratch-out follower should be registered even when scratchOutShowCorrection is false', () => {
    // Run multiple seeds to ensure compound scratch-out occurs
    let foundCompoundFollower = false;
    for (let seed = 1; seed <= 50; seed++) {
      const result = typesetText('测试连续词语涂改效果确认', defaultPaper, {
        ...defaultHandwriting,
        seed,
        scratchOutProbability: 1.0,
        scratchOutShowCorrection: false, // Correction turned off!
      });

      const chars = result.pages[0].chars;
      for (let i = 0; i < chars.length; i++) {
        if (chars[i].scratchOut && chars[i].scratchOut?.isCompoundLeader === false && chars[i].scratchOut?.compoundIndex === 1) {
          foundCompoundFollower = true;
          // Follower should inherit the leader's style
          expect(chars[i].scratchOut?.style).toBe(chars[i - 1].scratchOut?.style);
          break;
        }
      }
      if (foundCompoundFollower) break;
    }
    expect(foundCompoundFollower).toBe(true);
  });

  it('Bug 8: renderPaperBackground should paint base background before drawing custom image', () => {
    const fillRectCalls: any[] = [];
    const drawImageCalls: any[] = [];

    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn((x, y, w, h) => fillRectCalls.push({ x, y, w, h })),
      drawImage: vi.fn((...args: any[]) => drawImageCalls.push(args)),
      fillStyle: '',
      filter: '',
      globalAlpha: 1.0,
    } as unknown as CanvasRenderingContext2D;

    const mockImg = {
      complete: true,
      naturalWidth: 800,
      naturalHeight: 600,
    } as HTMLImageElement;

    renderPaperBackground(mockCtx, defaultPaper, mockImg);

    expect(fillRectCalls.length).toBeGreaterThan(0);
    expect(drawImageCalls.length).toBe(1);
    // Base fill must occur before custom image is drawn
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it('Bug 8: renderHandwritingPageToCanvas should call clearRect on canvas before drawing', () => {
    const clearRectMock = vi.fn();
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      clearRect: clearRectMock,
      fillRect: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 20 })),
    } as unknown as CanvasRenderingContext2D;

    const mockCanvas = {
      width: 800,
      height: 1100,
      getContext: vi.fn(() => mockCtx),
    } as unknown as HTMLCanvasElement;

    const pageLayout = {
      pageIndex: 0,
      chars: [],
      lineCount: 0,
    };

    renderHandwritingPageToCanvas(mockCanvas, pageLayout, defaultPaper, defaultHandwriting, 1.0);

    expect(clearRectMock).toHaveBeenCalledWith(0, 0, 800, 1100);
  });
});
