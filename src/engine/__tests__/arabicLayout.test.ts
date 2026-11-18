import { describe, expect, it } from 'vitest';
import { PRESET_TEMPLATES } from '../presets';
import { typesetText } from '../typeset';

const { paper, handwriting } = PRESET_TEMPLATES[0];
const config = { ...handwriting, paragraphIndent: 0 };

describe('Arabic paragraph layout', () => {
  it('keeps mixed Arabic, Arabic-Indic digits and English in logical order in a single line', () => {
    const text = 'النتيجة (CPU 123) هي ٤٥٫٦';
    const result = typesetText(text, paper, config);
    expect(result.pages[0]).toMatchObject({
      chars: [],
      shapedLines: [{ text, direction: 'rtl', x: paper.width - paper.marginRight }],
    });
    expect(result.totalChars).toBe(Array.from(text.replace(/ /g, '')).length);
  });

  it('uses the paragraph’s first strong letter for direction', () => {
    const text = 'CPU 123 (اختبار المعالج)';
    expect(typesetText(text, paper, config).pages[0]).toMatchObject({
      shapedLines: [{ text, direction: 'ltr', x: paper.marginLeft }],
    });
  });

  it('wraps by words, keeps short bracketed groups together, and continues onto the next page', () => {
    const text = 'مرحبا بكم (CPU 123) اختبار الكتابة العربية';
    const narrowPaper = { ...paper, width: 350, height: paper.marginTop + paper.marginBottom + paper.lineSpacing * 2 };
    const result = typesetText(text, narrowPaper, { ...config, fontSize: 20 }, value => Array.from(value).length * 10);
    expect(result.pages.map(page => page.lineCount)).toEqual([2, 2]);
    expect(result.pages).toMatchObject([
      { shapedLines: [
        { text: 'مرحبا بكم', direction: 'rtl' },
        { text: '(CPU 123)', direction: 'rtl' },
      ] },
      { shapedLines: [
        { text: 'اختبار الكتابة', direction: 'rtl' },
        { text: 'العربية', direction: 'rtl' },
      ] },
    ]);
  });

  it('keeps explicit marks on logical spans without breaking a shaped line into glyphs', () => {
    const result = typesetText('[u]كتابة عربية[/u] [del:صحيح]خطأ[/del]', paper, config);
    expect(result.pages[0].shapedLines).toMatchObject([{
      text: 'كتابة عربية خطأ',
      marks: [
        { start: 0, end: 11, style: 'underline_wavy' },
        { start: 12, end: 15, style: 'scratch', correction: 'صحيح' },
      ],
    }]);
  });

  it('keeps an overlong word joined and caps its display width', () => {
    const word = 'الاختبار';
    const narrowPaper = { ...paper, width: 350 };
    const result = typesetText(word, narrowPaper, config, () => 180);
    expect(result.pages[0]).toMatchObject({
      lineCount: 1,
      shapedLines: [{ text: word, maxWidth: 150, direction: 'rtl' }],
    });
  });
});
