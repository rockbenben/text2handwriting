/**
 * 支持的语言列表。语言代码用 BCP 47，顺序即下拉框展示顺序。
 * label 用各语言自称，避免「English(English)」这种冗余。
 *
 * 对齐 web-tools-by-ai 的 18 种语言。
 */
export interface SupportedLanguage {
  code: string;
  /** 语言自称，用于下拉框显示 */
  label: string;
  /** 是否从右向左书写 */
  rtl: boolean;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'zh-CN', label: '简体中文', rtl: false },
  { code: 'zh-TW', label: '繁體中文', rtl: false },
  { code: 'en', label: 'English', rtl: false },
  { code: 'ja', label: '日本語', rtl: false },
  { code: 'ko', label: '한국어', rtl: false },
  { code: 'de', label: 'Deutsch', rtl: false },
  { code: 'es', label: 'Español', rtl: false },
  { code: 'fr', label: 'Français', rtl: false },
  { code: 'it', label: 'Italiano', rtl: false },
  { code: 'pt', label: 'Português', rtl: false },
  { code: 'ru', label: 'Русский', rtl: false },
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'hi', label: 'हिन्दी', rtl: false },
  { code: 'bn', label: 'বাংলা', rtl: false },
  { code: 'id', label: 'Bahasa Indonesia', rtl: false },
  { code: 'th', label: 'ไทย', rtl: false },
  { code: 'vi', label: 'Tiếng Việt', rtl: false },
  { code: 'tr', label: 'Türkçe', rtl: false },
];

export const DEFAULT_LANGUAGE = 'zh-CN';

/**
 * 已完成母语翻译的语言。其余语言可选，但界面会回落到英文。
 * 补全某语言后把其代码加进这里，选择器就不再显示「EN」标记。
 */
export const FULLY_TRANSLATED = new Set([
  'zh-CN', 'zh-TW', 'en', 'ja', 'ko',
  'de', 'es', 'fr', 'it', 'pt', 'ru',
  'ar', 'hi', 'bn', 'id', 'th', 'vi', 'tr',
]);

export const LANGUAGE_STORAGE_KEY = 'text2handwriting_language';

/**
 * 改名前（0.1.0 之前）的语言键。读取时作为回落，写入新键后清除，
 * 否则老用户刷新后语言选择会莫名其妙回到中文。
 */
export const LEGACY_LANGUAGE_STORAGE_KEY = 'autohand_language';

/** 全部语言代码，用于判断某个选择是否有效 */
export const ALL_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(l => l.code);

export function isSupportedLanguage(code: unknown): code is string {
  return typeof code === 'string' && ALL_LANGUAGE_CODES.includes(code);
}

/**
 * 根据 BCP 47 语言标签匹配支持的 18 种语言之一。
 * 规则：
 * 1. 繁体中文变体（zh-TW, zh-HK, zh-MO, zh-Hant* -> zh-TW）
 * 2. 简体中文变体（zh-CN, zh-SG, zh-Hans*, zh -> zh-CN）
 * 3. 历史别名（如印尼语 in / in-ID -> id）
 * 4. 大小写不敏感的完整匹配（如 ja, ko, de, fr）
 * 5. 主语言代码前缀匹配（如 en-US / en-GB -> en, pt-BR -> pt, es-419 -> es）
 */
export function matchLanguageTag(rawTag: string): string | null {
  if (typeof rawTag !== 'string') return null;
  const normalized = rawTag.trim().toLowerCase().replace(/_/g, '-');
  if (!normalized) return null;

  // 1. 中文方言与书写脚本匹配
  if (
    normalized === 'zh-tw' ||
    normalized === 'zh-hk' ||
    normalized === 'zh-mo' ||
    normalized.startsWith('zh-hant')
  ) {
    return 'zh-TW';
  }
  if (
    normalized === 'zh-cn' ||
    normalized === 'zh-sg' ||
    normalized.startsWith('zh-hans') ||
    normalized === 'zh'
  ) {
    return 'zh-CN';
  }

  // 2. 印尼语历史/Android旧代码兼容（in -> id）
  if (normalized === 'in' || normalized.startsWith('in-')) {
    return 'id';
  }

  // 3. 完整精确匹配（大小写不敏感）
  const exact = SUPPORTED_LANGUAGES.find(
    l => l.code.toLowerCase() === normalized
  );
  if (exact) return exact.code;

  // 4. 前缀匹配（主语言代码）
  const prefix = normalized.split('-')[0];
  const byPrefix = SUPPORTED_LANGUAGES.find(
    l => l.code.toLowerCase() === prefix
  );
  if (byPrefix) return byPrefix.code;

  return null;
}

/**
 * 从候选语言列表（默认读取 navigator.languages / navigator.language）
 * 按用户偏好顺序探测首个支持的语言。
 */
export function detectBrowserLanguage(candidates?: readonly string[]): string | null {
  const list: readonly string[] =
    candidates ??
    (typeof navigator !== 'undefined'
      ? (Array.isArray(navigator.languages) && navigator.languages.length > 0
          ? navigator.languages
          : typeof navigator.language === 'string' && navigator.language
            ? [navigator.language]
            : [])
      : []);

  for (const tag of list) {
    const match = matchLanguageTag(tag);
    if (match) return match;
  }
  return null;
}

