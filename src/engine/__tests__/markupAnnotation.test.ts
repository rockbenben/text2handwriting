import { describe, it, expect } from 'vitest';
import { typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Document Markup & Random Annotations (文件手写随机勾画)', () => {
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
    paragraphIndent: 2,
    alignToLines: true,
    seed: 888,
    scratchOutProbability: 0,
    annotationProbability: 0,
  };

  const longText = `关于加强新时代科技创新与产业发展融合的若干指导意见：
一、总体要求与战略目标。坚持以国家战略需求为导向，优化创新资源配置，深化产学研深度融合。
二、重点突破核心关键技术。在集成电路、人工智能、生命科学等关键领域取得突破性进展。
三、培育高素质创新型人才队伍。建立健全多元化科技成果转化评价机制，激发广大科研人员创造活力。
各部门各单位要深刻领会文件精神，抓好任务分解，明确责任分工，确保各项改革举措落到实处。`;

  it('generates zero annotations when annotationProbability is 0', () => {
    const result = typesetText(longText, paper, { ...baseConfig, annotationProbability: 0 });
    const allChars = result.pages.flatMap(p => p.chars);
    const annotated = allChars.filter(c => c.annotation);
    expect(annotated.length).toBe(0);
  });

  it('generates hand-drawn document annotations when probability is enabled', () => {
    const result = typesetText(longText, paper, {
      ...baseConfig,
      annotationProbability: 0.05,
      annotationStyle: 'circle',
      annotationColor: '#dc2626',
    });
    const allChars = result.pages.flatMap(p => p.chars);
    const annotated = allChars.filter(c => c.annotation);

    expect(annotated.length).toBeGreaterThan(0);
    for (const c of annotated) {
      expect(c.annotation?.style).toBe('circle');
      expect(c.annotation?.color).toBe('#dc2626');
      expect(['，', '。', '、', ' ']).not.toContain(c.char);
    }
  });

  it('supports multiple annotation styles (underline_wavy, circle, caret_insert, box)', () => {
    const result = typesetText(longText, paper, {
      ...baseConfig,
      annotationProbability: 0.08,
      annotationStyle: 'all',
      seed: 9999,
    });
    const allChars = result.pages.flatMap(p => p.chars);
    const annotated = allChars.filter(c => c.annotation);

    expect(annotated.length).toBeGreaterThan(0);
    const stylesFound = new Set(annotated.map(c => c.annotation?.style));
    // When style is 'all', it should produce varied styles
    expect(stylesFound.size).toBeGreaterThanOrEqual(2);
  });
});
