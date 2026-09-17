import { describe, it, expect } from 'vitest';
import { parseParagraphTokens, typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Stage 3: Explicit Inline Tags for Handwriting Markings', () => {
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
    scratchOutProbability: 0, // Probabilistic random scratch disabled
    annotationProbability: 0, // Probabilistic random annotation disabled
  };

  it('parseParagraphTokens correctly extracts markdown ~~del~~ and bbcode tags', () => {
    const text = '开始~~错字~~接着[del:真]假[/del]以及[u]重要[/u]与[circle]圈画[/circle]结束';
    const tokens = parseParagraphTokens(text);

    const chars = tokens.map(t => t.char).join('');
    expect(chars).toBe('开始错字接着假以及重要与圈画结束');

    // ~~错字~~
    expect(tokens[2].explicitScratchOut).toBeDefined();
    expect(tokens[3].explicitScratchOut).toBeDefined();

    // [del:真]假[/del]
    expect(tokens[6].char).toBe('假');
    expect(tokens[6].explicitScratchOut?.correctionChar).toBe('真');

    // [u]重要[/u]
    expect(tokens[9].char).toBe('重');
    expect(tokens[9].explicitAnnotation?.style).toBe('underline_wavy');

    // [circle]圈画[/circle]
    expect(tokens[12].char).toBe('圈');
    expect(tokens[12].explicitAnnotation?.style).toBe('circle');
  });

  it('typesetText triggers scratchOut for ~~word~~ even with 0% random probability', () => {
    const text = '今天天气~~阴沉~~明媚';
    const result = typesetText(text, defaultPaper, defaultHandwriting);
    const chars = result.pages[0].chars;

    // '阴' and '沉' should have scratchOut
    const yinChar = chars.find(c => c.char === '阴');
    const chenChar = chars.find(c => c.char === '沉');
    expect(yinChar?.scratchOut).toBeDefined();
    expect(chenChar?.scratchOut).toBeDefined();

    // '今', '天', '明', '媚' should NOT have scratchOut
    const jinChar = chars.find(c => c.char === '今');
    expect(jinChar?.scratchOut).toBeUndefined();
  });

  it('typesetText triggers correctionChar above targeted typo with [del:正]误[/del]', () => {
    const text = '我们必须[del:纠正]笔吴[/del]错误';
    const result = typesetText(text, defaultPaper, defaultHandwriting);
    const chars = result.pages[0].chars;

    const biChar = chars.find(c => c.char === '笔');
    const wuChar = chars.find(c => c.char === '吴');

    expect(biChar?.scratchOut).toBeDefined();
    expect(biChar?.scratchOut?.correctionChar).toBe('纠');

    expect(wuChar?.scratchOut).toBeDefined();
    expect(wuChar?.scratchOut?.correctionChar).toBe('正');
  });

  it('typesetText triggers underline and circle annotations via inline tags', () => {
    const text = '这是[u]划线[/u]和[circle]圈圈[/circle]';
    const result = typesetText(text, defaultPaper, defaultHandwriting);
    const chars = result.pages[0].chars;

    const huaChar = chars.find(c => c.char === '划');
    expect(huaChar?.annotation?.style).toBe('underline_wavy');

    const quanChar = chars.find(c => c.char === '圈');
    expect(quanChar?.annotation?.style).toBe('circle');
  });

  it('accepts the Chinese aliases [圈]…[/圈] and [框]…[/框]', () => {
    const tokens = parseParagraphTokens('前面[圈]重点[/圈]中间[框]范围[/框]后面');
    // 标记内的文字要保留（被划掉/被圈出的字本身仍需显示），只剥掉标记本身
    const chars = tokens.map(t => t.char).join('');
    expect(chars).toBe('前面重点中间范围后面');

    // 前(0) 面(1) 重(2) 点(3) 中(4) 间(5) 范(6) 围(7) 后(8) 面(9)
    expect(tokens[2].explicitAnnotation?.style).toBe('circle');
    expect(tokens[3].explicitAnnotation?.style).toBe('circle');
    expect(tokens[6].explicitAnnotation?.style).toBe('box');
    expect(tokens[7].explicitAnnotation?.style).toBe('box');
    // 未标记的字不应带上任何批注
    expect(tokens[0].explicitAnnotation).toBeUndefined();
    expect(tokens[4].explicitAnnotation).toBeUndefined();
    expect(tokens[8].explicitAnnotation).toBeUndefined();
  });

  it('rejects mismatched opening/closing tag pairs and leaves them as literal text', () => {
    // 旧实现允许 [circle]x[/圈] 这种错配，会被误判为有效标记
    for (const text of ['[circle]文字[/圈]', '[框]文字[/box]', '[圈]文字[/box]', '[box]文字[/圈]']) {
      const tokens = parseParagraphTokens(text);
      expect(tokens.every(t => t.explicitAnnotation === undefined)).toBe(true);
    }
  });

  it('does not treat an unmatched tag name as a valid annotation', () => {
    const tokens = parseParagraphTokens('[circle]文字[/underline]');
    expect(tokens.every(t => t.explicitAnnotation === undefined)).toBe(true);
  });
});
