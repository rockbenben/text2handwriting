import { describe, it, expect } from 'vitest';
import { typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Inking Physics & Human Anatomy Engine (墨迹物理与人体工程仿真)', () => {
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
    seed: 999,
    wristArc: 0,
    fatigueEffect: false,
    inkSplatterProbability: 0,
  };

  const lineText = '这是测试手腕书写圆弧旋转与逐行书写疲劳渐变效果的一整行排版文字。';

  it('induces mid-line vertical arc curve when wristArc is positive', () => {
    const flatResult = typesetText(lineText, paper, { ...baseConfig, wristArc: 0 });
    const arcResult = typesetText(lineText, paper, { ...baseConfig, wristArc: 0.8 });

    const flatChars = flatResult.pages[0].chars;
    const arcChars = arcResult.pages[0].chars;

    // The middle character of line 0
    const midIdx = Math.floor(flatChars.length / 2);
    const flatMidY = flatChars[midIdx].y;
    const arcMidY = arcChars[midIdx].y;

    // Wrist arc should elevate / curve the middle of the line
    expect(arcMidY).not.toBe(flatMidY);
    expect(Math.abs(arcMidY - flatMidY)).toBeGreaterThan(0.5);
  });

  it('generates micro ink splatters on page when inkSplatterProbability is active', () => {
    const multiLineText = `第一行测试墨迹飞白与落墨点。
第二行测试笔尖急速起落产生的自然落墨瑕疵。
第三行模拟更具真实质感的手写草稿纸张。`;

    const result = typesetText(multiLineText, paper, {
      ...baseConfig,
      inkSplatterProbability: 0.2, // high for deterministic testing
    });

    const splatters = result.pages[0].splatters;
    expect(splatters).toBeDefined();
    expect(splatters!.length).toBeGreaterThan(0);
    expect(splatters![0].radius).toBeGreaterThan(0);
    expect(splatters![0].opacity).toBeGreaterThan(0);
  });

  it('renders ink bleed and splatters on Canvas context cleanly', async () => {
    const { renderHandwritingPageToCanvas } = await import('../paper');
    const mockCtx = {
      save: () => {},
      restore: () => {},
      scale: () => {},
      translate: () => {},
      rotate: () => {},
      transform: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      fillText: () => {},
      fillRect: () => {},
    } as unknown as CanvasRenderingContext2D;

    const mockCanvas = {
      getContext: () => mockCtx,
      width: 1200,
      height: 1697,
    } as unknown as HTMLCanvasElement;

    const result = typesetText(lineText, paper, {
      ...baseConfig,
      glyphVariance: 0.5,
      inkBleed: 0.4,
      inkSplatterProbability: 0.1,
    });

    expect(() => {
      renderHandwritingPageToCanvas(mockCanvas, result.pages[0], paper, {
        ...baseConfig,
        glyphVariance: 0.5,
        inkBleed: 0.4,
      });
    }).not.toThrow();
  });
});
