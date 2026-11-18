import { describe, it, expect } from 'vitest';
import { getGridCells, renderPaperBackground } from '../paper';
import { PRESET_TEMPLATES } from '../presets';
import { SeededRandom } from '../random';
import { isHeadForbidden, isTailForbidden, isWordChar, typesetText } from '../typeset';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('SeededRandom', () => {
  it('should generate deterministic sequence for identical seed', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);
    const val1 = [rng1.next(), rng1.next(), rng1.range(-5, 5)];
    const val2 = [rng2.next(), rng2.next(), rng2.range(-5, 5)];
    expect(val1).toEqual(val2);
  });

  it('should generate Gaussian numbers centered near mean', () => {
    const rng = new SeededRandom(42);
    let sum = 0;
    const n = 1000;
    for (let i = 0; i < n; i++) {
      sum += rng.gaussian(0, 2);
    }
    const mean = sum / n;
    expect(Math.abs(mean)).toBeLessThan(0.3);
  });
});

describe('Chinese Punctuation Rules (避头尾)', () => {
  it('identifies head-forbidden characters', () => {
    expect(isHeadForbidden('，')).toBe(true);
    expect(isHeadForbidden('。')).toBe(true);
    expect(isHeadForbidden('！')).toBe(true);
    expect(isHeadForbidden('？')).toBe(true);
    expect(isHeadForbidden('”')).toBe(true);
    expect(isHeadForbidden('）')).toBe(true);
    expect(isHeadForbidden('你')).toBe(false);
  });

  it('identifies tail-forbidden characters', () => {
    expect(isTailForbidden('“')).toBe(true);
    expect(isTailForbidden('（')).toBe(true);
    expect(isTailForbidden('《')).toBe(true);
    expect(isTailForbidden('好')).toBe(false);
  });
});

describe('typesetText engine', () => {
  const defaultPaper: PaperConfig = {
    type: 'ruled',
    size: 'a4',
    width: 800,
    height: 1100,
    marginTop: 80,
    marginBottom: 80,
    marginLeft: 60,
    marginRight: 60,
    lineSpacing: 45,
    showLineGuide: true,
  };

  const defaultConfig: HandwritingConfig = {
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontSizeVariance: 2,
    lineHeight: 45,
    lineHeightVariance: 1,
    letterSpacing: 2,
    letterSpacingVariance: 1,
    rotationVariance: 2,
    xVariance: 2,
    yVariance: 2,
    strokeWidthVariance: 0.2,
    opacityVariance: 0.05,
    lineTiltVariance: 0.5,
    inkColor: '#1a1a1a',
    paragraphIndent: 2,
    alignToLines: true,
    seed: 42,
  };

  it('handles empty text gracefully', () => {
    const result = typesetText('', defaultPaper, defaultConfig);
    expect(result.pages.length).toBe(1);
    expect(result.pages[0].chars.length).toBe(0);
    expect(result.totalChars).toBe(0);
  });

  it('typesets a short sentence on one page with perturbations', () => {
    const text = '你好，世界！这是一段手写测试文字。';
    const result = typesetText(text, defaultPaper, defaultConfig);
    expect(result.pages.length).toBe(1);
    expect(result.pages[0].chars.length).toBe(text.length);

    // Verify all chars have position, font size, rotation, opacity
    for (const char of result.pages[0].chars) {
      expect(char.x).toBeGreaterThan(defaultPaper.marginLeft - 10);
      expect(char.y).toBeGreaterThan(defaultPaper.marginTop - 10);
      expect(char.fontSize).toBeGreaterThanOrEqual(defaultConfig.fontSize - defaultConfig.fontSizeVariance * 3);
      expect(char.opacity).toBeGreaterThan(0.7);
      expect(char.opacity).toBeLessThanOrEqual(1.0);
    }
  });

  it('paginates long text across multiple pages', () => {
    // Generate text with 80 lines
    const paragraphs = Array.from({ length: 40 }, (_, i) => `第${i + 1}段：这是一篇很长的模拟手写文稿，用于测试自动分页算法是否正常运作。`);
    const longText = paragraphs.join('\n');

    const result = typesetText(longText, defaultPaper, defaultConfig);
    expect(result.pages.length).toBeGreaterThan(1);
    expect(result.totalPages).toBe(result.pages.length);

    // Check characters are distributed
    const totalChars = result.pages.reduce((acc, p) => acc + p.chars.length, 0);
    expect(totalChars).toBeGreaterThan(0);
  });

  it('keeps the original pagination and seeded layout for an unmarked Chinese draft', async () => {
    const { paper, handwriting } = PRESET_TEMPLATES[0];
    const paragraph = '今天我们记录春雨来临后的校园变化。树叶上的水珠沿着叶脉滑落，操场边的积水映出灰白色的天空。';
    const result = typesetText(Array(30).fill(paragraph).join('\n'), paper, handwriting);
    expect(result.pages.map(page => [page.lineCount, page.chars.length])).toEqual([
      [25, 562], [25, 563], [10, 225],
    ]);
    // Include positions, ink effects and random corrections; ignore platform-level float noise.
    const json = JSON.stringify(result, (_key, value) =>
      typeof value === 'number' ? Number(value.toFixed(8)) : value);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json));
    const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    expect(fingerprint).toBe(
      '1c7b97c074ebaa9a0ad4e0c6605a671421777f9380556fafb37bf4f71ec56c3a',
    );
  });

  it('starts line 27 on the next page of the 26-row composition preset', () => {
    const { paper, handwriting } = PRESET_TEMPLATES.find(preset => preset.id === 'composition')!;
    const lastGridLine = paper.marginTop + 26 * 50;
    const result = typesetText(Array(28).fill('田').join('\n'), paper, handwriting);
    expect(result.pages.map(page => page.lineCount)).toEqual([26, 2]);
    expect(result.pages[0].chars.at(-1)!.y).toBeLessThan(lastGridLine);
    expect(result.pages[1].chars[0].y).toBeCloseTo(result.pages[0].chars[0].y, -1);
  });

  it('uses the rendered default 20-column grid after switching from ruled paper', () => {
    const paper: PaperConfig = { ...defaultPaper, type: 'grid' };
    const grid = getGridCells(paper);
    expect(grid.cols).toBe(20);
    const result = typesetText('田'.repeat(20), paper, {
      ...defaultConfig,
      xVariance: 0,
      edgeCrowding: true,
      alignToLines: false,
    });
    expect(result.pages[0].lineCount).toBe(2);
    const chars = result.pages[0].chars;
    const firstLine = chars.slice(0, 18);
    for (const [column, char] of firstLine.entries()) {
      expect(char.x).toBeCloseTo(paper.marginLeft + (column + 2) * grid.cellWidth);
      expect(char.y).toBeGreaterThan(paper.marginTop);
      expect(char.y).toBeLessThan(paper.marginTop + grid.cellHeight);
    }
    expect(chars[18].x).toBeCloseTo(paper.marginLeft);
    expect(chars[18].y).toBeGreaterThan(paper.marginTop + grid.cellHeight);
  });

  it('uses full square cells within the margins when widening the preset columns', () => {
    const { paper, handwriting } = PRESET_TEMPLATES.find(preset => preset.id === 'composition')!;
    const wider = { ...paper, gridCols: 14 };
    const bottom = wider.height - wider.marginBottom;
    const drawnLineEnds: number[] = [];
    const ctx = {
      save() {},
      restore() {},
      fillRect() {},
      beginPath() {},
      moveTo() {},
      lineTo(_x: number, y: number) { drawnLineEnds.push(y); },
      stroke() {},
    } as unknown as CanvasRenderingContext2D;
    renderPaperBackground(ctx, wider);

    const result = typesetText('田'.repeat(14 * 20), wider, {
      ...handwriting, paragraphIndent: 0, lineHeight: 90, alignToLines: false,
    });
    expect(Math.max(...drawnLineEnds)).toBeLessThanOrEqual(bottom);
    expect(result.pages.map(page => page.lineCount)).toEqual([19, 1]);
    expect(result.pages.map(page => page.chars.length)).toEqual([19 * 14, 14]);
    expect(result.pages[0].chars.at(-1)!.y).toBeLessThan(Math.max(...drawnLineEnds));
  });

  it('applies paragraph indentation', () => {
    const text = '第一段文字。\n第二段文字。';
    const result = typesetText(text, defaultPaper, { ...defaultConfig, paragraphIndent: 2, xVariance: 0 });
    const firstCharP1 = result.pages[0].chars[0];
    const firstCharP2 = result.pages[0].chars.find(c => c.char === '第' && c !== firstCharP1)!;

    // Both paragraphs should be indented relative to margin
    const charWidth = defaultConfig.fontSize + defaultConfig.letterSpacing;
    const expectedIndent = defaultPaper.marginLeft + 2 * charWidth;
    expect(firstCharP1.x).toBeCloseTo(expectedIndent, -1);
    expect(firstCharP2.x).toBeCloseTo(expectedIndent, -1);
  });

  it('reproduces identical output given the same seed', () => {
    const text = '自然手写真实感测试。每一笔每一划都有自然的轻微抖动与倾斜。';
    const result1 = typesetText(text, defaultPaper, { ...defaultConfig, seed: 999 });
    const result2 = typesetText(text, defaultPaper, { ...defaultConfig, seed: 999 });

    expect(result1.pages[0].chars).toEqual(result2.pages[0].chars);
  });

  it('produces different perturbations with different seed', () => {
    const text = '自然手写真实感测试。';
    const result1 = typesetText(text, defaultPaper, { ...defaultConfig, seed: 101 });
    const result2 = typesetText(text, defaultPaper, { ...defaultConfig, seed: 202 });

    expect(result1.pages[0].chars[0].rotation).not.toEqual(result2.pages[0].chars[0].rotation);
  });

  it('keeps vertical jitter strictly bounded and natural on ruled lines', () => {
    const text = '这是一行用于测试基线稳定性的长文本，所有文字应该端正地落在横线上，不应出现夸张的上下跳跃或整行巨大倾斜。';
    const result = typesetText(text, defaultPaper, { 
      ...defaultConfig, 
      yVariance: 0.8,
      lineTiltVariance: 0.15,
      lineHeightVariance: 0.3,
      alignToLines: true 
    });

    const chars = result.pages[0].chars;
    for (const char of chars) {
      const lineIndex = Math.round((char.y - defaultPaper.marginTop - defaultPaper.lineSpacing * 0.72) / defaultPaper.lineSpacing);
      const lineExpectedBaseY = defaultPaper.marginTop + lineIndex * defaultPaper.lineSpacing + defaultPaper.lineSpacing * 0.72;
      const deviation = Math.abs(char.y - lineExpectedBaseY);
      // Deviation from baseline should never exceed 3.5px
      expect(deviation).toBeLessThanOrEqual(3.5);
    }
  });

  // 把渲染结果按行还原成字符串。空格不参与渲染（layoutLine 里 continue），
  // 所以还原出的行文本是「去掉空格」的形态，不能按空白切分。
  function renderLines(chars: { char: string; y: number }[], paper: PaperConfig, lineSpacing: number): string[] {
    const lines: string[] = [];
    let lastIdx = Number.NaN;
    for (const c of chars) {
      const idx = Math.round((c.y - paper.marginTop - lineSpacing * 0.72) / lineSpacing);
      if (idx !== lastIdx) {
        lines.push('');
        lastIdx = idx;
      }
      lines[lines.length - 1] += c.char;
    }
    return lines;
  }

  it('breaks English at word boundaries instead of mid-word', () => {
    const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima'];
    const text = Array.from({ length: 40 }, (_, i) => words[i % words.length]).join(' ');
    const result = typesetText(text, defaultPaper, { ...defaultConfig, paragraphIndent: 0 });

    const lines = renderLines(result.pages[0].chars, defaultPaper, defaultPaper.lineSpacing);
    // 用例本身要够长，否则「没有词内断行」可能只是因为压根没换行
    expect(lines.length).toBeGreaterThan(3);

    // 每个单词在「去空格字符流」中的结束偏移，行尾必须落在其中之一
    const wordBoundaries = new Set<number>();
    let offset = 0;
    for (const w of text.split(' ')) {
      offset += w.length;
      wordBoundaries.add(offset);
    }

    let consumed = 0;
    for (const line of lines) {
      consumed += line.length;
      expect(wordBoundaries.has(consumed)).toBe(true);
    }
    // 全部字符都参与排版，没有丢字
    expect(consumed).toBe(text.replace(/ /g, '').length);
  });

  it('keeps CJK out of the Latin word-breaking rule', () => {
    // 汉字/中文标点不能算作单词字符，否则带空格的中文段落会被按词换行
    expect(isWordChar('中')).toBe(false);
    expect(isWordChar('，')).toBe(false);
    expect(isWordChar('。')).toBe(false);
    expect(isWordChar('　')).toBe(false); // 全角空格
    // 西文单词字符
    expect(isWordChar('A')).toBe(true);
    expect(isWordChar('z')).toBe(true);
    expect(isWordChar('9')).toBe(true);
    expect(isWordChar("'")).toBe(true); // Planck's 不能断成 Planck' / s
    // 连字符是合规断行点，故不算单词字符
    expect(isWordChar('-')).toBe(false);
    expect(isWordChar(' ')).toBe(false);
  });
});

