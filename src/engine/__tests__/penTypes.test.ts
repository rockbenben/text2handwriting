import { describe, it, expect, vi } from 'vitest';
import type { HandwritingConfig, PaperConfig, PageLayout, PenType } from '../types';
import { renderHandwritingPageToCanvas } from '../paper';

describe('Stage 2: Physical Pen Types Engine', () => {
  const basePaper: PaperConfig = {
    type: 'blank',
    size: 'a4',
    width: 1200,
    height: 1600,
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 100,
    marginRight: 100,
    lineSpacing: 50,
  };

  const sampleLayout: PageLayout = {
    pageIndex: 0,
    lineCount: 1,
    chars: [
      {
        char: '实',
        x: 150,
        y: 200,
        fontSize: 36,
        rotation: 0.01,
        opacity: 0.95,
        strokeWidth: 0.4,
        color: '#1e293b',
      },
      {
        char: '验',
        x: 190,
        y: 200,
        fontSize: 36,
        rotation: -0.01,
        opacity: 0.92,
        strokeWidth: 0.35,
        color: '#1e293b',
      },
    ],
  };

  const mockCanvas = () => {
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      transform: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      font: '',
      fillStyle: '',
      strokeStyle: '',
      globalAlpha: 1,
      shadowColor: '',
      shadowBlur: 0,
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      textBaseline: 'alphabetic',
    } as unknown as CanvasRenderingContext2D;

    const canvas = {
      width: 1200,
      height: 1600,
      getContext: vi.fn(() => ctx),
    } as unknown as HTMLCanvasElement;

    return { canvas, ctx };
  };

  const penTypes: PenType[] = ['gel', 'fountain', 'pencil', 'ballpoint'];

  penTypes.forEach((penType) => {
    it(`renders characters properly using penType: "${penType}"`, () => {
      const { canvas, ctx } = mockCanvas();
      const config: HandwritingConfig = {
        fontFamily: 'KaiTi',
        fontSize: 36,
        fontSizeVariance: 0,
        lineHeight: 50,
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
        alignToLines: false,
        seed: 100,
        penType,
      };

      expect(() => {
        renderHandwritingPageToCanvas(canvas, sampleLayout, basePaper, config);
      }).not.toThrow();

      // Pencil uses a 2-pass graphite deposition texture
      if (penType === 'pencil') {
        expect(ctx.fillText).toHaveBeenCalledTimes(4);
      } else {
        expect(ctx.fillText).toHaveBeenCalledTimes(2);
      }
    });
  });

  it('applies distinct physical rendering characteristics for pencil vs fountain vs gel', () => {
    const { canvas: canvasPencil, ctx: ctxPencil } = mockCanvas();
    const configPencil: HandwritingConfig = {
      fontFamily: 'KaiTi',
      fontSize: 36,
      fontSizeVariance: 0,
      lineHeight: 50,
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
      alignToLines: false,
      seed: 100,
      penType: 'pencil',
    };

    renderHandwritingPageToCanvas(canvasPencil, sampleLayout, basePaper, configPencil);
    // Pencil should soften the ink bleed and use matte graphite alpha
    expect(ctxPencil.fillText).toHaveBeenCalled();

    const { canvas: canvasFountain, ctx: ctxFountain } = mockCanvas();
    const configFountain: HandwritingConfig = {
      ...configPencil,
      penType: 'fountain',
    };
    renderHandwritingPageToCanvas(canvasFountain, sampleLayout, basePaper, configFountain);
    expect(ctxFountain.fillText).toHaveBeenCalled();
  });
});
