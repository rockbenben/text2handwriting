import { describe, it, expect } from 'vitest';
import { typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Smart Signature & Date Alignment (落款与日期智能右对齐)', () => {
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
    seed: 9999,
  };

  const sampleDoc = `尊敬的老师：
您好！因身体不适需要请假一天，望批准。
申请人：李华
2026年9月11日`;

  it('automatically detects and right-aligns signature and date lines', () => {
    const result = typesetText(sampleDoc, paper, {
      ...baseConfig,
      smartSignatureAlign: true,
    });

    const chars = result.pages[0].chars;
    // Find characters of "申请人：李华" and "2026年9月11日"
    const applyChar = chars.find(c => c.char === '申');
    const dateChar = chars.find(c => c.char === '2');

    expect(applyChar).toBeDefined();
    expect(dateChar).toBeDefined();

    const writingRightBound = paper.width - paper.marginRight;

    // Both signature lines should be positioned towards the right half of the page
    expect(applyChar!.x).toBeGreaterThan(paper.marginLeft + (writingRightBound - paper.marginLeft) * 0.45);
    expect(dateChar!.x).toBeGreaterThan(paper.marginLeft + (writingRightBound - paper.marginLeft) * 0.45);

    // And neither should overflow beyond the right margin
    const lastDateChar = chars.find(c => c.char === '日');
    expect(lastDateChar!.x).toBeLessThanOrEqual(writingRightBound);
  });

  it('right-aligns a plain name line that sits directly above the date', () => {
    const doc = `老师您好：
今天的作业已经补交。
三年级二班 王小明
2026年10月27日`;

    const result = typesetText(doc, paper, {
      ...baseConfig,
      smartSignatureAlign: true,
    });

    const chars = result.pages[0].chars;
    const nameChar = chars.find(c => c.char === '王');
    const dateChar = chars.find(c => c.char === '2');

    expect(nameChar).toBeDefined();
    expect(dateChar).toBeDefined();

    const writingRightBound = paper.width - paper.marginRight;
    const midpoint = paper.marginLeft + (writingRightBound - paper.marginLeft) * 0.45;
    expect(nameChar!.x).toBeGreaterThan(midpoint);
    expect(dateChar!.x).toBeGreaterThan(midpoint);
  });

  it('does not pull a normal short sentence to the right just because a date follows', () => {
    const doc = `正文最后一句。
谢谢大家。
2026年10月27日`;

    const result = typesetText(doc, paper, {
      ...baseConfig,
      smartSignatureAlign: true,
    });

    const chars = result.pages[0].chars;
    const sentenceChar = chars.find(c => c.char === '谢');
    const dateChar = chars.find(c => c.char === '2');

    expect(sentenceChar).toBeDefined();
    expect(dateChar).toBeDefined();

    const writingRightBound = paper.width - paper.marginRight;
    const midpoint = paper.marginLeft + (writingRightBound - paper.marginLeft) * 0.45;
    expect(sentenceChar!.x).toBeLessThan(midpoint);
    expect(dateChar!.x).toBeGreaterThan(midpoint);
  });

  it('supports explicit [right]...[/right] markup tags for custom right-alignment', () => {
    const textWithTag = `正文第一段。
[right]班级：高三(1)班  组长：王明[/right]`;

    const result = typesetText(textWithTag, paper, {
      ...baseConfig,
      smartSignatureAlign: true,
    });

    const chars = result.pages[0].chars;
    // '[right]' tag should be stripped from rendered text
    expect(chars.some(c => c.char === '[' || c.char === ']')).toBe(false);

    // "班" should start in the right half
    const banChar = chars.find(c => c.char === '班');
    expect(banChar).toBeDefined();
    expect(banChar!.x).toBeGreaterThan(paper.width * 0.4);
  });
});
