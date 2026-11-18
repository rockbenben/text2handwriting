import type { TextDirection } from './types';

/**
 * 带有文字排版方向（LTR / RTL）的整行文本宽度测量函数接口。
 */
export type MeasureShapedText = (text: string, direction: TextDirection) => number;

/**
 * Unicode 属性转义正则：
 * - ARABIC_LETTER: 匹配属于阿拉伯文字系统（含波斯语、乌尔都语等扩展）的字母字符。
 * - FIRST_STRONG: 寻找段落中第一个具有强方向性的字符（字母、阿拉伯字母标记、LTR/RTL 控制符）。
 * - RTL_STRONG: 判断强字符是否属于阿拉伯文、希伯来文或 RTL 强控制符。
 */
const ARABIC_LETTER = /(?=\p{Script_Extensions=Arabic})\p{Letter}/u;
const FIRST_STRONG = /[\p{Letter}\u061c\u200e\u200f]/u;
const RTL_STRONG = /[\p{Script_Extensions=Arabic}\p{Script=Hebrew}\u061c\u200f]/u;

/**
 * 检测一段文本是否包含阿拉伯字母。
 * 用于触发整行文字整形（Text Shaping）与字体载入事件监听。
 */
export function hasArabicLetters(text: string): boolean {
  return ARABIC_LETTER.test(text);
}

/**
 * 基于 Unicode 双向算法（UAX #9）首个强字符规则，判断段落的基础方向（'rtl' 或 'ltr'）。
 */
export function paragraphDirection(text: string): TextDirection {
  const first = text.match(FIRST_STRONG)?.[0];
  return first && RTL_STRONG.test(first) ? 'rtl' : 'ltr';
}

interface LineSpan {
  start: number;
  end: number;
  maxWidth: number;
}

/**
 * 阿拉伯语段落双向折行生成器。
 *
 * 核心考量：
 * 1. 括号与成对标点保护：将较短的括号短语（如 (ABC)、[123] 等）尽可能保持在同一分块内，
 *    使浏览器 Canvas 能在单次 drawText 调用中正确解析双向镜像与成对标点朝向。
 * 2. 词级拆分：若括号短语本身超出页面整行可用宽度，则允许在短语内部按词换行。
 * 3. 首行缩进与后续行宽：首行宽度为 initialWidth，后续折行宽度为 fullWidth。
 */
export function* wrapArabicParagraph(
  text: string,
  initialWidth: number,
  fullWidth: number,
  measure: (text: string) => number,
): Generator<LineSpan> {
  // 保持成对括号与短语在一起，方便浏览器在单次 Canvas 文本绘制中计算双向布局
  const chunks = text.matchAll(/(?:\([^()]*\)|\[[^[\]]*\]|\{[^{}]*\}|[^\s()[\]{}]+|[()[\]{}])+/gu);
  let start = -1;
  let end = 0;
  let maxWidth = initialWidth;
  for (const chunk of chunks) {
    // 当带括号的短语本身宽度超过整行宽度时，允许在内部按词折行；超长单词保持连接并自适应行宽
    const words = measure(chunk[0]) > fullWidth ? chunk[0].matchAll(/\S+/gu) : null;
    const spans = words
      ? Array.from(words, word => ({ start: chunk.index + word.index, end: chunk.index + word.index + word[0].length }))
      : [{ start: chunk.index, end: chunk.index + chunk[0].length }];
    for (const span of spans) {
      if (start >= 0 && measure(text.slice(start, span.end)) > maxWidth) {
        yield { start, end, maxWidth };
        maxWidth = fullWidth;
        start = -1;
      }
      if (start < 0) start = span.start;
      end = span.end;
    }
  }
  if (start >= 0) yield { start, end, maxWidth };
}

