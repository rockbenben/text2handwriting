import type { PaperConfig, HandwritingConfig, RenderChar, PageLayout, TypesetResult, ScratchOutConcreteStyle } from './types';
import { SeededRandom } from './random';
import { getTypoForChar } from './typoEngine';

// Chinese typography punctuation rules (避头尾规则)
const HEAD_FORBIDDEN_CHARS = new Set([
  '，', '、', '。', '！', '？', '；', '：', '”', '’', '）', '》', '〉', '】', '｝', '〕', '…', '—', '～', '·',
  ',', '.', '!', '?', ';', ':', ')', ']', '}', '>', '\'', '"', '%',
]);

const TAIL_FORBIDDEN_CHARS = new Set([
  '“', '‘', '（', '《', '〈', '【', '｛', '〔',
  '(', '[', '{', '<',
]);

export function isHeadForbidden(char: string): boolean {
  return HEAD_FORBIDDEN_CHARS.has(char);
}

export function isTailForbidden(char: string): boolean {
  return TAIL_FORBIDDEN_CHARS.has(char);
}

/**
 * 西文单词字符：字母、数字，以及词内撇号（Planck's）。
 * 刻意不含 CJK —— 中文是逐字断行，若把汉字也算作单词字符，
 * 带空格的中文段落会误触发下面的按词换行。
 * 也不含连字符：英文在连字符后断行是合规排版。
 */
const WORD_CHAR_RE = /[0-9A-Za-z\u00C0-\u024F\u0386-\u03FF\u0400-\u04FF']/;

export function isWordChar(char: string): boolean {
  return char.length === 1 && WORD_CHAR_RE.test(char);
}

export const HIGH_FREQ_FLUID_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就',
  '不', '人', '都', '一', '个', '上', '也', '为', '到',
]);

/**
 * Returns estimated width of a character based on font size.
 */
export function estimateCharWidth(char: string, fontSize: number): number {
  if (char === ' ') return fontSize * 0.35;
  if (char === '\t') return fontSize * 1.5;
  if (char === '\u3000') return fontSize;

  const code = char.charCodeAt(0);
  // ASCII printable
  if (code >= 0x20 && code <= 0x7e) {
    if (/[ijlI1.,;:'!]/.test(char)) return fontSize * 0.32;
    if (/[mwMW@#%&]/.test(char)) return fontSize * 0.85;
    return fontSize * 0.55;
  }
  // Full-width punctuation
  if (HEAD_FORBIDDEN_CHARS.has(char) || TAIL_FORBIDDEN_CHARS.has(char)) {
    return fontSize * 0.75;
  }
  // Standard CJK full-width
  return fontSize;
}

export interface CharToken {
  char: string;
  explicitScratchOut?: {
    correctionChar?: string;
    style?: ScratchOutConcreteStyle;
  };
  explicitAnnotation?: {
    style: 'underline_wavy' | 'circle' | 'caret_insert' | 'box';
  };
}

/**
 * Parses inline tags for targeted handwriting markings:
 * - ~~text~~ or [del]text[/del] -> manual strike-through
 * - [del:correct]typo[/del] -> manual strike-through with correction written above
 * - [u]text[/u] -> manual wavy underline
 * - [circle]text[/circle] or [圈]text[/圈] -> manual circle
 * - [box]text[/box] or [框]text[/框] -> manual box
 */
export function parseParagraphTokens(text: string): CharToken[] {
  const tokens: CharToken[] = [];
  // 捕获组: 1=~~del~~ 2=[del] 3=[del:修正]的修正词 4=[del:修正]的错字
  //         5=[u] 6=circle/圈 7=circle内容 8=box/框 9=box内容
  // \6 / \8 反向引用确保闭标签与开标签严格同名，避免 [circle]x[/圈] 这类错配被误认
  const regex = /(?:~~(.*?)~~|\[del\](.*?)\[\/del\]|\[del:([^\]]+)\](.*?)\[\/del\]|\[u\](.*?)\[\/u\]|\[(circle|圈)\](.*?)\[\/\6\]|\[(box|框)\](.*?)\[\/\8\])/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index);
      for (const char of Array.from(plain)) {
        tokens.push({ char });
      }
    }

    if (match[1] !== undefined || match[2] !== undefined) {
      // ~~text~~ or [del]text[/del]
      const content = match[1] ?? match[2] ?? '';
      for (const char of Array.from(content)) {
        tokens.push({
          char,
          explicitScratchOut: {},
        });
      }
    } else if (match[3] !== undefined && match[4] !== undefined) {
      // [del:correct]typo[/del]
      const corr = match[3];
      const typo = match[4];
      const typoChars = Array.from(typo);
      const corrChars = Array.from(corr);
      for (let i = 0; i < typoChars.length; i++) {
        tokens.push({
          char: typoChars[i],
          explicitScratchOut: {
            correctionChar: corrChars[i] ?? (i === 0 ? corr : undefined),
          },
        });
      }
    } else if (match[5] !== undefined) {
      // [u]text[/u]
      const content = match[5];
      for (const char of Array.from(content)) {
        tokens.push({
          char,
          explicitAnnotation: { style: 'underline_wavy' },
        });
      }
    } else if (match[7] !== undefined) {
      // [circle]text[/circle] or [圈]text[/圈]
      const content = match[7];
      for (const char of Array.from(content)) {
        tokens.push({
          char,
          explicitAnnotation: { style: 'circle' },
        });
      }
    } else if (match[9] !== undefined) {
      // [box]text[/box] or [框]text[/框]
      const content = match[9];
      for (const char of Array.from(content)) {
        tokens.push({
          char,
          explicitAnnotation: { style: 'box' },
        });
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    for (const char of Array.from(remaining)) {
      tokens.push({ char });
    }
  }

  return tokens;
}

const RIGHT_TAG_RE = /^\[(?:right|靠右)\]([\s\S]*?)\[\/(?:right|靠右)\]$/i;

function stripRightTag(text: string): string {
  const match = text.match(RIGHT_TAG_RE);
  return (match ? match[1] : text).trim();
}

function isDateOnlyLine(text: string): boolean {
  return (
    /^\d{4}年\d{1,2}月\d{1,2}日$/.test(text) ||
    /^\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}$/.test(text)
  );
}

/**
 * Typesets input text into pages with handwriting perturbation
 */
export function typesetText(
  text: string,
  paper: PaperConfig,
  config: HandwritingConfig
): TypesetResult {
  const rng = new SeededRandom(config.seed);

  // Default page bounds
  const contentWidth = Math.max(100, paper.width - paper.marginLeft - paper.marginRight);
  const contentHeight = Math.max(100, paper.height - paper.marginTop - paper.marginBottom);

  // Line spacing
  const lineSpacing = config.alignToLines && paper.lineSpacing > 0
    ? paper.lineSpacing
    : config.lineHeight;

  // Maximum lines per page
  const maxLinesPerPage = Math.max(1, Math.floor(contentHeight / lineSpacing));

  // If grid mode (作文稿纸 / 方格纸)
  const isGrid = paper.type === 'grid' && (paper.gridCols || 0) > 0;
  const gridCols = isGrid ? paper.gridCols! : Math.floor(contentWidth / (config.fontSize + config.letterSpacing));
  const cellWidth = isGrid ? contentWidth / gridCols : config.fontSize + config.letterSpacing;

  const pages: PageLayout[] = [];
  let currentPageChars: RenderChar[] = [];
  let currentPageSplatters: { x: number; y: number; radius: number; opacity: number }[] = [];
  let currentPageIndex = 0;
  let currentLineIndex = 0;

  function flushPage() {
    pages.push({
      pageIndex: currentPageIndex,
      chars: currentPageChars,
      lineCount: currentLineIndex,
      splatters: currentPageSplatters,
    });
    currentPageIndex++;
    currentPageChars = [];
    currentPageSplatters = [];
    currentLineIndex = 0;
  }

  // If text is empty, return 1 blank page
  if (!text.trim() && text.length === 0) {
    flushPage();
    return { pages, totalChars: 0, totalPages: 1 };
  }

  const paragraphs = text.split(/\r?\n/);
  let totalCharsCount = 0;
  const charOccurrenceMap = new Map<string, number>();

  // 落款常见写法是「姓名/班级 + 日期」两行，而姓名行通常没有任何前缀。
  // 只看正则会把姓名留在左边、日期贴到右边。这里在「最后一行是日期」时，
  // 把紧邻的短行也视为落款（排除正文句子，避免把普通短句也拉到右边）。
  const signatureLineIndices = new Set<number>();
  if (config.smartSignatureAlign !== false) {
    const nonEmpty = paragraphs
      .map((paragraph, index) => ({ text: stripRightTag(paragraph), index }))
      .filter((entry) => entry.text.length > 0);
    const last = nonEmpty[nonEmpty.length - 1];
    const prev = nonEmpty[nonEmpty.length - 2];
    if (last && prev && isDateOnlyLine(last.text)) {
      if (prev.text.length <= 24 && !/[。！？!?；;]$/.test(prev.text)) {
        signatureLineIndices.add(prev.index);
      }
    }
  }

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const rawParagraph = paragraphs[pIdx];

    // Empty paragraph line
    if (rawParagraph.length === 0) {
      currentLineIndex++;
      if (currentLineIndex >= maxLinesPerPage) {
        flushPage();
      }
      continue;
    }

    let cleanedParagraph = rawParagraph;
    let isExplicitRight = false;
    const rightTagMatch = cleanedParagraph.match(RIGHT_TAG_RE);
    if (rightTagMatch) {
      isExplicitRight = true;
      cleanedParagraph = rightTagMatch[1].trim();
    }

    const trimmed = cleanedParagraph.trim();
    const isSignaturePattern = 
      /^(?:申请人|报告人|汇报人|写信人|致敬人|签名|学生|署名|日期|落款|班级|指导老师)[：:]/i.test(trimmed) ||
      isDateOnlyLine(trimmed) ||
      /^(?:此致|敬礼|顺祝商祺)$/.test(trimmed);

    const shouldRightAlign =
      isExplicitRight ||
      (config.smartSignatureAlign !== false &&
        (isSignaturePattern || signatureLineIndices.has(pIdx)));

    // Prepare line buffer
    let lineChars: (CharToken & { width: number })[] = [];
    let currentLineWidth = 0;

    // Apply paragraph indent (signatures have 0 indent)
    const indentWidth = shouldRightAlign ? 0 : config.paragraphIndent * (isGrid ? cellWidth : (config.fontSize + config.letterSpacing));
    let isFirstLineOfParagraph = true;
    let availableWidth = contentWidth - (isFirstLineOfParagraph ? indentWidth : 0);

    const tokens = parseParagraphTokens(cleanedParagraph);

    for (let cIdx = 0; cIdx < tokens.length; cIdx++) {
      const token = tokens[cIdx];
      const char = token.char;
      const prevChar = cIdx > 0 ? tokens[cIdx - 1].char : '';
      const nextChar = cIdx + 1 < tokens.length ? tokens[cIdx + 1].char : '';
      let charWidth = isGrid ? cellWidth : estimateCharWidth(char, config.fontSize) + config.letterSpacing;

      // Organic kerning for consecutive punctuation marks (e.g. 。”, ，”, ？！, ！）
      const isPrecedingClosingQuote = !isGrid &&
        (HEAD_FORBIDDEN_CHARS.has(char) || TAIL_FORBIDDEN_CHARS.has(char)) &&
        (nextChar === '”' || nextChar === '’' || nextChar === '）' || nextChar === '》' || nextChar === '】');

      const isConsecutivePunctuation = !isGrid &&
        HEAD_FORBIDDEN_CHARS.has(char) &&
        (HEAD_FORBIDDEN_CHARS.has(prevChar) || TAIL_FORBIDDEN_CHARS.has(prevChar));

      if (isPrecedingClosingQuote || isConsecutivePunctuation) {
        charWidth = Math.max(8, charWidth * 0.45);
      }

      // Hanging punctuation: if char is a head-forbidden punctuation and slightly extends past margin,
      // allow it to hang at line end naturally instead of forcing the preceding character onto the next line
      const canHangPunctuation = !isGrid && isHeadForbidden(char) && (currentLineWidth + charWidth <= availableWidth + charWidth * 0.95);

      // Smart line-end squeeze (行末挤字避免孤字成行):
      // If this is the last character of a paragraph and only slightly exceeds line edge,
      // squeeze it into the current line naturally rather than stranding 1 lone character on a new line.
      const isLastCharOfPara = cIdx === tokens.length - 1;
      const canSqueezeLastChar = !isGrid && isLastCharOfPara && (currentLineWidth + charWidth <= availableWidth + charWidth * 0.7);
      if (canSqueezeLastChar) {
        charWidth = Math.max(12, charWidth * 0.82);
      }

      // Check if adding char exceeds line width
      if (!canHangPunctuation && !canSqueezeLastChar && currentLineWidth + charWidth > availableWidth && lineChars.length > 0) {
        // Check 避头尾: if char cannot start line, or previous char cannot end line
        let breakIndex = lineChars.length;

        while (
          breakIndex > 1 &&
          (
            (breakIndex === lineChars.length && isHeadForbidden(char)) ||
            isTailForbidden(lineChars[breakIndex - 1].char)
          )
        ) {
          breakIndex--;
        }

        // 西文按词换行：英文等以空格分词的语言不能从单词中间断开
        // （否则会出现 "el|ectric"、"lig|ht" 这类残词行首）。
        // 仅当断点两侧都是西文单词字符时，才回退到本行最后一个空格之后；
        // 纯中文段落没有空格 → 找不到断点 → 保持原有逐字硬断，中文排版零影响。
        if (
          !isGrid &&
          breakIndex === lineChars.length &&
          lineChars.length > 0 &&
          isWordChar(char) &&
          isWordChar(lineChars[lineChars.length - 1].char)
        ) {
          for (let k = lineChars.length - 1; k > 0; k--) {
            const c = lineChars[k].char;
            if (c === ' ' || c === '\t') {
              // 空格留在上一行行末（渲染时跳过、仅推进 X），
              // 若断在空格本身，下一行会以一个前导空格起排。
              breakIndex = k + 1;
              break;
            }
          }
        }

        const toEmit = lineChars.slice(0, breakIndex);
        const toCarryOver = lineChars.slice(breakIndex);

        // Layout the line toEmit
        const emitWidth = toEmit.reduce((sum, item) => sum + item.width, 0);
        const startX = shouldRightAlign ? Math.max(0, contentWidth - emitWidth - 20) : (isFirstLineOfParagraph ? indentWidth : 0);
        layoutLine(toEmit, startX);

        // Reset line buffer
        lineChars = toCarryOver;
        currentLineWidth = lineChars.reduce((sum, item) => sum + item.width, 0);

        // Advance to next line
        currentLineIndex++;
        if (currentLineIndex >= maxLinesPerPage) {
          flushPage();
        }

        isFirstLineOfParagraph = false;
        availableWidth = contentWidth;
      }

      lineChars.push({ ...token, width: charWidth });
      currentLineWidth += charWidth;
    }

    // Flush remaining chars in paragraph
    if (lineChars.length > 0) {
      const startX = shouldRightAlign ? Math.max(0, contentWidth - currentLineWidth - 20) : (isFirstLineOfParagraph ? indentWidth : 0);
      layoutLine(lineChars, startX);
      currentLineIndex++;
      if (currentLineIndex >= maxLinesPerPage) {
        flushPage();
      }
    }
  }

  // Flush last page if it has content or if no pages emitted yet
  if (currentPageChars.length > 0 || pages.length === 0) {
    flushPage();
  }

  function layoutLine(items: (CharToken & { width: number })[], startXOffset: number) {
    if (items.length === 0) return;

    // Baseline Y calculation
    // Text baseline sits roughly 75% down the line height
    const baseLineY = paper.marginTop + currentLineIndex * lineSpacing + lineSpacing * 0.72;

    // Line level perturbations
    const lineTiltRad = (rng.gaussian(0, config.lineTiltVariance) * Math.PI) / 180;
    const maxLineDY = config.alignToLines ? 0.8 : 1.5;
    const lineDY = Math.max(-maxLineDY, Math.min(maxLineDY, rng.gaussian(0, config.lineHeightVariance)));

    const halfWidth = contentWidth / 2;
    const maxTiltShift = config.alignToLines ? 1.0 : 2.0;

    let currentX = paper.marginLeft + startXOffset;
    let pendingCompoundFollower: {
      style: ScratchOutConcreteStyle;
      color: string;
      position?: 'top_right' | 'top';
      compoundWidth: number;
    } | null = null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const char = item.char;

      // Skip whitespace chars from rendering, but advance X
      if (char === ' ' || char === '\t' || char === '\u3000') {
        currentX += item.width;
        continue;
      }

      // Character level perturbations with safety clamps
      const maxX = 2.0;
      const dX = Math.max(-maxX, Math.min(maxX, rng.gaussian(0, config.xVariance)));

      const maxY = config.alignToLines ? 1.2 : 2.2;
      const dY = Math.max(-maxY, Math.min(maxY, rng.gaussian(0, config.yVariance)));

      const dSize = Math.max(-2.5, Math.min(2.5, rng.gaussian(0, config.fontSizeVariance)));
      const maxRot = (Math.min(config.rotationVariance, 5) * 1.5 * Math.PI) / 180;
      const rawRot = (rng.gaussian(0, config.rotationVariance) * Math.PI) / 180;
      const dRot = Math.max(-maxRot, Math.min(maxRot, rawRot));

      const dOpacity = Math.max(0.72, Math.min(1.0, 1.0 - Math.abs(rng.gaussian(0, config.opacityVariance))));
      const dStroke = Math.max(0.1, rng.gaussian(0, config.strokeWidthVariance));

      // Stroke roughness simulation (natural ink flow unevenness and pen tip pressure spikes)
      let finalStroke = dStroke;
      if (config.strokeRoughness && config.strokeRoughness > 0) {
        const roughnessFactor = config.strokeRoughness;
        const inkFluctuation = rng.gaussian(0, roughnessFactor * 0.35);
        finalStroke = Math.max(0.05, finalStroke + inkFluctuation + (rng.next() - 0.5) * roughnessFactor * 0.2);
      }

      // Extra tilt from line angle (centered at middle of line, avoiding runaway right-edge drop)
      const rawTiltShift = Math.sin(lineTiltRad) * (currentX - paper.marginLeft - halfWidth);
      const tiltYShift = Math.max(-maxTiltShift, Math.min(maxTiltShift, rawTiltShift));

      // Position disarray: natural baseline wandering, wave drift along line, and character jitter
      let disarrayY = 0;
      let disarrayX = 0;
      let disarrayRot = 0;
      if (config.positionDisarray && config.positionDisarray > 0) {
        const lineProg = Math.min(1, Math.max(0, (currentX - paper.marginLeft) / contentWidth));
        const waveY = Math.sin(lineProg * Math.PI * 2.5 + currentLineIndex * 0.7) * (config.positionDisarray * 1.5);
        const jitterY = rng.gaussian(0, config.positionDisarray * 0.9);
        disarrayY = waveY + jitterY;
        disarrayX = rng.gaussian(0, config.positionDisarray * 0.6);
        disarrayRot = (rng.gaussian(0, config.positionDisarray * 1.5) * Math.PI) / 180;
      }

      // Edge crowding effect: characters squeeze and slightly shrink as hand approaches right edge
      let edgeCrowdScale = 1.0;
      let edgeSpacingReduction = 0;
      if (config.edgeCrowding) {
        const rightEdgeDist = (paper.width - paper.marginRight) - currentX;
        if (rightEdgeDist < 220) {
          const crowdRatio = Math.max(0, Math.min(1, 1 - (rightEdgeDist / 220)));
          edgeCrowdScale = Math.max(0.85, 1 - crowdRatio * 0.15);
          edgeSpacingReduction = crowdRatio * 3.5;
        }
      }

      // Total vertical offset clamped strictly to avoid exaggerated floating
      const totalVOffset = lineDY + dY + tiltYShift;
      const maxTotalVOffset = config.alignToLines ? 2.5 : 4.0;
      const clampedVOffset = Math.max(-maxTotalVOffset, Math.min(maxTotalVOffset, totalVOffset));

      // Occurrence counter to distinguish duplicate characters across the document
      const occ = charOccurrenceMap.get(char) || 0;
      charOccurrenceMap.set(char, occ + 1);

      // 1. Glyph Deformation & Duplicate Character Differentiation (同字异构与多态变异)
      let scaleX = 1.0;
      let scaleY = 1.0;
      let skewX = 0.0;
      let occRot = 0;
      let occDY = 0;
      let occStroke = 0;
      const glyphVar = config.glyphVariance ?? 0;
      if (glyphVar > 0) {
        // Biometric polymorphism profiles: successive occurrences of identical characters
        // cycle through distinct aspect ratios, shears, tilts and baseline micro-offsets,
        // preventing repeated characters (e.g. 的, 一, 是, 了) from looking 100% identical.
        const OCC_PROFILES = [
          { sx: 0.00,  sy: 0.00,  skew:  0.000, rot:  0.0, dy:  0.0, stroke:  0.00 },
          { sx: -0.05, sy: 0.06,  skew:  0.035, rot:  0.8, dy: -1.0, stroke:  0.09 },
          { sx: 0.06,  sy: -0.05, skew: -0.035, rot: -0.9, dy:  0.8, stroke: -0.07 },
          { sx: -0.04, sy: -0.03, skew:  0.020, rot:  0.5, dy: -0.5, stroke:  0.05 },
          { sx: 0.05,  sy: 0.04,  skew: -0.025, rot: -0.6, dy:  0.6, stroke: -0.04 },
          { sx: 0.02,  sy: -0.06, skew:  0.040, rot:  1.0, dy: -0.8, stroke:  0.11 },
          { sx: -0.06, sy: 0.03,  skew: -0.030, rot: -1.0, dy:  0.9, stroke: -0.09 },
        ];

        const prof = OCC_PROFILES[occ % OCC_PROFILES.length];

        const dScaleX = prof.sx * glyphVar + rng.gaussian(0, glyphVar * 0.035);
        const dScaleY = prof.sy * glyphVar + rng.gaussian(0, glyphVar * 0.035);
        scaleX = Math.max(0.88, Math.min(1.12, 1.0 + dScaleX));
        scaleY = Math.max(0.88, Math.min(1.12, 1.0 + dScaleY));

        const rawSkew = prof.skew * glyphVar + rng.gaussian(0, glyphVar * 0.025);
        skewX = Math.max(-0.08, Math.min(0.08, rawSkew));

        occRot = (prof.rot * glyphVar * Math.PI) / 180;
        occDY = prof.dy * glyphVar;
        occStroke = prof.stroke * glyphVar;
      }

      // Writing rhythm dynamics: muscle-memory high-frequency words written faster with slight forward flow
      if (HIGH_FREQ_FLUID_WORDS.has(char)) {
        skewX = Math.max(-0.08, Math.min(0.08, skewX + (glyphVar > 0 ? 0.018 * glyphVar : 0.01)));
        finalStroke = Math.max(0.05, finalStroke - 0.03);
      }

      finalStroke = Math.max(0.05, finalStroke + occStroke);

      // 2. Wrist Pivot Arc (手腕生理支点弧度: 每行中间由于手腕旋转产生自然起伏)
      let wristArcY = 0;
      const wristArcFactor = config.wristArc ?? 0;
      if (wristArcFactor > 0) {
        const lineProg = Math.min(1, Math.max(0, (currentX - paper.marginLeft) / contentWidth));
        wristArcY = Math.sin(lineProg * Math.PI) * (wristArcFactor * 2.2);
      }

      // 3. Fatigue Effect (下行书写疲劳效应: 随页面下移运笔微舒展)
      let fatigueDY = 0;
      let fatigueSpacing = 0;
      if (config.fatigueEffect) {
        const pageProg = Math.min(1, currentLineIndex / maxLinesPerPage);
        fatigueDY = rng.gaussian(0, pageProg * 0.35);
        fatigueSpacing = pageProg * 0.35;
      }

      // 4. Inking pressure density (下笔重则墨浓，轻则微淡)
      const inkDensity = Math.max(0.85, Math.min(1.15, 1.0 + rng.gaussian(0, 0.06)));

      // Baseline placement
      let charY = baseLineY + clampedVOffset + disarrayY + wristArcY + fatigueDY + occDY;
      let finalFontSize = Math.max(10, config.fontSize + dSize) * edgeCrowdScale;

      if (isHeadForbidden(char)) {
        // Punctuation sits nicely on the baseline or slightly lowered
        finalFontSize *= 0.9;
        charY += config.fontSize * 0.04;
      }

      // Character center anchor for rotation
      const charX = currentX + dX + disarrayX;

      let charToRender = char;

      // Check for handwritten scratch-out (错字涂改: 划除错字并在上方补写正确字)
      let scratchOut: RenderChar['scratchOut'] | undefined;
      const isExplicitScratch = item.explicitScratchOut !== undefined;
      const scratchProb = config.scratchOutProbability ?? 0;
      const isEligibleForScratch = 
        char !== ' ' &&
        char !== '\t' &&
        char !== '\u3000' &&
        (isExplicitScratch || (
          scratchProb > 0 &&
          !isHeadForbidden(char) &&
          !isTailForbidden(char)
        ));

      if (isEligibleForScratch) {
        const isFollower = pendingCompoundFollower !== null;
        const willTrigger = isExplicitScratch || isFollower || (rng.random() < scratchProb);

        if (willTrigger) {
          let chosenStyle: ScratchOutConcreteStyle;
          let compoundTotal = 1;
          let compoundIndex = 0;
          let isCompoundLeader = true;
          let compoundWidth = item.width;
          let inheritedPos: 'top_right' | 'top' | undefined;

          if (isFollower && pendingCompoundFollower) {
            chosenStyle = pendingCompoundFollower.style;
            compoundTotal = 2;
            compoundIndex = 1;
            isCompoundLeader = false;
            compoundWidth = pendingCompoundFollower.compoundWidth;
            inheritedPos = pendingCompoundFollower.position;
            pendingCompoundFollower = null;
          } else {
            const availStyles: ScratchOutConcreteStyle[] = [
              'slash',
              'slash',
              'backslash',
              'double_line',
              'double_line',
              'single_line',
              'spiral_coil',
              'spiral_coil',
              'boxed_slash',
              'circled_slash',
              'cross_x',
              'scribble',
              'heavy_blot',
              'triple_line',
              'wavy',
              'mesh_patch',
            ];
            chosenStyle =
              !config.scratchOutStyle || config.scratchOutStyle === 'all'
                ? availStyles[Math.floor(rng.next() * availStyles.length)]
                : config.scratchOutStyle;

            // Check if can form compound word scratch-out with next character (35% probability)
            const nextItem = i + 1 < items.length ? items[i + 1] : undefined;
            const nextChar = nextItem?.char;
            const canFormCompound = nextChar &&
              nextChar !== ' ' && nextChar !== '\t' && nextChar !== '\u3000' &&
              (isExplicitScratch
                ? nextItem?.explicitScratchOut !== undefined
                : (!nextItem?.explicitScratchOut && !isHeadForbidden(nextChar) && !isTailForbidden(nextChar)));

            if (canFormCompound && rng.next() < 0.35) {
              compoundTotal = 2;
              compoundIndex = 0;
              isCompoundLeader = true;
              compoundWidth = item.width + nextItem.width;
            }
          }

          const hasExplicitCorrection = item.explicitScratchOut?.correctionChar !== undefined;
          const showCorrection = hasExplicitCorrection || (!isExplicitScratch && config.scratchOutShowCorrection !== false);
          let correctionChar: string | undefined;
          let correctionColor: string | undefined;
          let showCaret: boolean | undefined;
          let resolvedPos: 'top_right' | 'top' | undefined;
          let offsetDX: number | undefined;
          let offsetDY: number | undefined;
          let tiltAngle: number | undefined;
          let caretX: number | undefined;
          let caretY: number | undefined;
          const isFirstLine = currentLineIndex === 0;
          const isNearRightMargin = currentX + item.width * 1.5 >= paper.width - paper.marginRight;

          if (showCorrection) {
            if (hasExplicitCorrection) {
              correctionChar = item.explicitScratchOut!.correctionChar;
              charToRender = char; // Keep original typo char on baseline
            } else {
              correctionChar = char; // The intended correct character to write above
              // Pick a genuine slip / typo character to be struck through on the baseline (never strike out a correct word)
              const typo = getTypoForChar(char, () => rng.next());
              if (typo) {
                charToRender = typo;
              } else if (/[a-zA-Z]/.test(char)) {
                const isUpper = char === char.toUpperCase() && char !== char.toLowerCase();
                charToRender = isUpper ? (char === 'A' ? 'O' : 'A') : (char === 'e' ? 'c' : 'e');
              } else if (/\d/.test(char)) {
                charToRender = char === '0' ? '8' : '0';
              } else {
                charToRender = '之';
              }
            }

            correctionColor = config.scratchOutCorrectionColor || config.inkColor;
            showCaret = config.scratchOutUseCaret !== false;

            // Calculate correction character positioning & smart avoidance
            const posOption = config.scratchOutCorrectionPosition || 'top_right';
            const smartAvoidance = config.scratchOutSmartAvoidance !== false;

            if (inheritedPos) {
              resolvedPos = inheritedPos;
            } else if (posOption === 'random') {
              // Real-life handwritten mixture: ~65% top-right slant, ~35% centered top
              resolvedPos = rng.next() < 0.65 ? 'top_right' : 'top';
            } else {
              resolvedPos = posOption;
            }

            // Smart avoidance for line-end margin: if at edge, fallback to top to avoid clipping
            if (smartAvoidance && isNearRightMargin && resolvedPos === 'top_right') {
              resolvedPos = 'top';
            }

            if (resolvedPos === 'top_right') {
              const dxJitter = rng.gaussian(0, 0.04);
              const dyJitter = rng.gaussian(0, 0.03);

              offsetDX = Math.max(0.35, Math.min(0.75, 0.52 + dxJitter));
              offsetDY = isFirstLine && smartAvoidance
                ? Math.max(-0.72, Math.min(-0.55, -0.63 + dyJitter))
                : Math.max(-0.95, Math.min(-0.75, -0.85 + dyJitter));

              // Right-handed pen slant: subtle clockwise tilt (+1.5° ~ +3.5°)
              tiltAngle = Math.max(0.01, Math.min(0.08, (rng.gaussian(2.2, 0.6) * Math.PI) / 180));
              caretX = Math.max(0.40, Math.min(0.65, 0.52 + rng.gaussian(0, 0.03)));
              caretY = isFirstLine && smartAvoidance ? -0.52 : -0.68;
            } else {
              const dxJitter = rng.gaussian(0, 0.03);
              const dyJitter = rng.gaussian(0, 0.03);

              offsetDX = Math.max(0.0, Math.min(0.22, 0.08 + dxJitter));
              offsetDY = isFirstLine && smartAvoidance
                ? Math.max(-0.72, Math.min(-0.55, -0.62 + dyJitter))
                : Math.max(-0.92, Math.min(-0.74, -0.82 + dyJitter));

              tiltAngle = Math.max(-0.03, Math.min(0.03, (rng.gaussian(0, 0.6) * Math.PI) / 180));
              caretX = 0.46;
              caretY = isFirstLine && smartAvoidance ? -0.52 : -0.68;
            }
          }

          // If leader of a compound word, record follower info regardless of showCorrection
          if (compoundTotal > 1 && isCompoundLeader) {
            pendingCompoundFollower = {
              style: chosenStyle,
              color: config.inkColor,
              position: resolvedPos,
              compoundWidth,
            };
          }

          scratchOut = {
            style: chosenStyle,
            color: config.inkColor,
            correctionChar,
            correctionColor,
            showCaret,
            position: resolvedPos,
            offsetDX,
            offsetDY,
            tiltAngle,
            caretX,
            caretY,
            isFirstLine,
            isNearRightMargin,
            compoundTotal,
            compoundIndex,
            compoundWidth,
            isCompoundLeader,
          };
        }
      } else {
        pendingCompoundFollower = null;
      }

      // Check for document annotation (文件手写重点勾画: 重点波浪下划线、圈画、插入符、划框)
      let annotation: RenderChar['annotation'] | undefined;
      const isExplicitAnnot = item.explicitAnnotation !== undefined;
      const annotProb = config.annotationProbability ?? 0;
      if (
        (isExplicitAnnot || annotProb > 0) &&
        !scratchOut &&
        char !== ' ' &&
        char !== '\t' &&
        char !== '\u3000' &&
        (isExplicitAnnot || (!isHeadForbidden(char) && !isTailForbidden(char)))
      ) {
        if (isExplicitAnnot || rng.next() < annotProb) {
          const availStyles: Array<'underline_wavy' | 'circle' | 'caret_insert' | 'box'> = [
            'underline_wavy',
            'circle',
            'caret_insert',
            'box',
          ];
          const chosenStyle = isExplicitAnnot
            ? item.explicitAnnotation!.style
            : (!config.annotationStyle || config.annotationStyle === 'all'
                ? availStyles[Math.floor(rng.next() * availStyles.length)]
                : config.annotationStyle);

          annotation = {
            style: chosenStyle,
            color: config.annotationColor || config.inkColor,
          };
        }
      }

      // Micro ink splatters / flecks on paper (偶发极微落墨点)
      if (config.inkSplatterProbability && rng.next() < config.inkSplatterProbability) {
        currentPageSplatters.push({
          x: charX + item.width * (0.8 + rng.next() * 0.3),
          y: charY + rng.gaussian(0, 5),
          radius: 0.4 + rng.next() * 0.6,
          opacity: 0.25 + rng.next() * 0.35,
        });
      }

      currentPageChars.push({
        char: charToRender,
        x: charX,
        y: charY,
        fontSize: finalFontSize,
        rotation: dRot + lineTiltRad * 0.3 + disarrayRot + occRot,
        opacity: Math.min(1.0, dOpacity * inkDensity),
        strokeWidth: finalStroke,
        color: config.inkColor,
        scaleX,
        scaleY,
        skewX,
        inkDensity,
        scratchOut,
        annotation,
      });

      totalCharsCount++;
      const dSpacing = Math.max(-1.5, Math.min(1.5, rng.gaussian(0, config.letterSpacingVariance)));
      currentX += Math.max(item.width * 0.65, item.width - edgeSpacingReduction) + dSpacing + fatigueSpacing;
    }
  }

  return {
    pages,
    totalChars: totalCharsCount,
    totalPages: pages.length,
  };
}
