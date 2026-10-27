import type { PaperConfig, HandwritingConfig } from './types';
import { PRESET_TEMPLATES } from './presets';
import { CUSTOM_FONT_FAMILY_PREFIX, type FontOption } from './fontLoader';

export const STORAGE_KEYS = {
  SETTINGS: 'text2handwriting_settings_v1',
  PAPER: 'text2handwriting_paper_v1',
  HANDWRITING: 'text2handwriting_handwriting_v1',
  TEXT: 'text2handwriting_text_v1',
  FONTS: 'text2handwriting_fonts_v1',
} as const;

/**
 * 改名前（0.1.0 之前）的键名，前缀来自项目早期的内部代号。
 * 这些键在生产环境已有真实用户数据，只能迁移、不能直接弃用，
 * 否则老用户刷新后正文、纸张、笔迹设置会全部回落到默认值。
 */
export const LEGACY_STORAGE_KEYS = {
  SETTINGS: 'autohand_settings_v1',
  PAPER: 'autohand_paper_v1',
  HANDWRITING: 'autohand_handwriting_v1',
  TEXT: 'autohand_text_v1',
  FONTS: 'autohand_fonts_v1',
} as const;

/** 最多持久化的自定义字体条数。字体只存元数据，但一次扫描可能识别上百款。 */
const MAX_PERSISTED_FONTS = 120;

/**
 * 文件导入的字体只在内存里，刷新后不可用。它的元数据不能落盘，
 * 否则重开页面时下拉框会显示一个「已选中但实际不存在」的字体。
 * 旧版本已经把这类条目写进过用户存储，读取时同样要过滤掉。
 */
function isSessionOnlyFont(font: Pick<FontOption, 'family' | 'sessionOnly'>): boolean {
  return (
    font.sessionOnly === true ||
    (typeof font.family === 'string' && font.family.startsWith(CUSTOM_FONT_FAMILY_PREFIX))
  );
}

/**
 * 超过这个长度的底图（data URL 字符数）不会写入 localStorage，仅本次会话可用。
 * 阈值与 saveStoredSettings 的兜底保持一致，UI 也用它提前告知用户。
 */
export const CUSTOM_BG_PERSIST_MAX_CHARS = 2_000_000;

export function isCustomBackgroundTooLarge(
  paper: Pick<PaperConfig, 'customImageUrl'>
): boolean {
  const url = paper.customImageUrl;
  return typeof url === 'string' && url.startsWith('data:') && url.length > CUSTOM_BG_PERSIST_MAX_CHARS;
}

/**
 * 用户是否真的存过正文。首次访问时 TEXT 与 SETTINGS.text 都不存在，
 * 此时首屏应跟随界面语言放对应语言的示例，而不是写死的中文默认示例。
 */
export function hasStoredText(storage: Storage = localStorage): boolean {
  migrateLegacyStorage(storage);
  try {
    if (storage.getItem(STORAGE_KEYS.TEXT) !== null) return true;
    const rawSettings = storage.getItem(STORAGE_KEYS.SETTINGS);
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      return typeof parsed?.text === 'string';
    }
  } catch {
    // 存储不可读时按「没有存过」处理，回落到本地化示例
  }
  return false;
}

export const DEFAULT_PAPER_CONFIG: PaperConfig = { ...PRESET_TEMPLATES[0].paper };

export const DEFAULT_HANDWRITING_CONFIG: HandwritingConfig = {
  ...PRESET_TEMPLATES[0].handwriting,
  glyphVariance: 0.35,
  inkBleed: 0.4,
  wristArc: 0.15,
  fatigueEffect: false,
  inkSplatterProbability: 0,
  scratchOutProbability: 0.008,
  scratchOutShowCorrection: true,
  scratchOutUseCaret: true,
  scratchOutStyle: 'all',
  scratchOutCorrectionPosition: 'top_right',
  scratchOutSmartAvoidance: true,
  smartSignatureAlign: true,
  penType: 'gel',
  annotationProbability: 0,
  annotationStyle: 'all',
};

export const DEFAULT_SAMPLE_TEXT = PRESET_TEMPLATES[0].sampleText;

/**
 * Section-level defaults for modular "重置为默认" actions
 */
export const SECTION_DEFAULTS = {
  // 文本与排版自由度
  text: DEFAULT_SAMPLE_TEXT,
  freeform: {
    paragraphIndent: 2,
    alignToLines: true,
    smartSignatureAlign: true,
  },
  // 笔迹扰动 Tab 各区块
  font: {
    fontFamily: DEFAULT_HANDWRITING_CONFIG.fontFamily,
  },
  ink: {
    inkColor: '#1e293b',
    penType: 'gel' as const,
  },
  typography: {
    fontSize: 38,
    lineHeight: 56,
    letterSpacing: 3,
  },
  disarray: {
    xVariance: 0.8,
    yVariance: 0.5,
    rotationVariance: 1.2,
    fontSizeVariance: 1.0,
    lineHeightVariance: 0.3,
    letterSpacingVariance: 0.5,
    lineTiltVariance: 0.1,
    strokeWidthVariance: 0.15,
  },
  realism: {
    glyphVariance: 0.35,
    inkBleed: 0.4,
    wristArc: 0.15,
    fatigueEffect: false,
    inkSplatterProbability: 0,
  },
  scratch: {
    scratchOutProbability: 0.008,
    scratchOutStyle: 'all' as const,
    scratchOutShowCorrection: true,
    scratchOutUseCaret: true,
    scratchOutCorrectionColor: undefined,
    scratchOutCorrectionPosition: 'top_right' as const,
    scratchOutSmartAvoidance: true,
  },
  annotation: {
    annotationProbability: 0,
    annotationStyle: 'all' as const,
    annotationColor: undefined,
  },
  roughness: {
    positionDisarray: 0,
    strokeRoughness: 0,
    edgeCrowding: false,
  },
  // 纸张排版 Tab 各区块
  paperStyle: {
    type: 'ruled' as const,
    size: 'a4' as const,
    width: 1200,
    height: 1697,
  },
  paperLines: {
    lineSpacing: 56,
    showLineGuide: true,
    lineColor: 'rgba(176, 196, 222, 0.6)',
    showMarginLine: true,
    marginLineColor: 'rgba(248, 113, 113, 0.55)',
  },
  paperMargins: {
    marginTop: 140,
    marginBottom: 130,
    marginLeft: 110,
    marginRight: 90,
  },
  // 实拍与背景 Tab 各区块
  customBg: {
    customImageUrl: undefined,
    customImageAspectRatio: undefined,
  },
  photoEffects: {
    paperTexture: 'clean' as const,
    shadowIntensity: 0.15,
    vignette: false,
  },
};

export interface StoredSettings {
  text?: string;
  paper?: PaperConfig;
  handwriting?: HandwritingConfig;
  exportScale?: number;
  activePresetId?: string;
}

export interface LoadedSettings {
  text: string;
  paper: PaperConfig;
  handwriting: HandwritingConfig;
  exportScale: number;
  activePresetId: string;
}

function getSafeStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Storage access may be denied
  }
  return null;
}

/**
 * 把旧键（autohand_*）的数据搬到新键（text2handwriting_*），并删掉旧键。
 *
 * 幂等：新键已存在就跳过，不会覆盖用户在新版本里改过的值；
 * 单项失败不影响其它项，旧键保留待下次重试。
 * 在读取入口（loadStoredSettings / hasStoredText）调用，因此不依赖调用时序。
 * 返回是否真的搬动过数据。
 */
export function migrateLegacyStorage(storage?: Storage | null): boolean {
  const s = storage ?? getSafeStorage();
  if (!s) return false;

  let migrated = false;
  for (const key of Object.keys(STORAGE_KEYS) as (keyof typeof STORAGE_KEYS)[]) {
    try {
      if (s.getItem(STORAGE_KEYS[key]) !== null) continue;
      const legacyValue = s.getItem(LEGACY_STORAGE_KEYS[key]);
      if (legacyValue === null) continue;
      s.setItem(STORAGE_KEYS[key], legacyValue);
      s.removeItem(LEGACY_STORAGE_KEYS[key]);
      migrated = true;
    } catch (e) {
      console.warn(`迁移旧存储键「${LEGACY_STORAGE_KEYS[key]}」失败:`, e);
    }
  }
  return migrated;
}

/**
 * Load settings from localStorage with deep defaults fallback
 */
export function loadStoredSettings(): LoadedSettings {
  const storage = getSafeStorage();
  if (!storage) {
    return {
      text: DEFAULT_SAMPLE_TEXT,
      paper: { ...DEFAULT_PAPER_CONFIG },
      handwriting: { ...DEFAULT_HANDWRITING_CONFIG },
      exportScale: 2,
      activePresetId: PRESET_TEMPLATES[0].id,
    };
  }

  // 老版本（0.1.0 之前）存的是 autohand_* 键，先搬过来再读
  migrateLegacyStorage(storage);

  let text = DEFAULT_SAMPLE_TEXT;
  let exportScale = 2;
  let activePresetId = PRESET_TEMPLATES[0].id;
  let paper = { ...DEFAULT_PAPER_CONFIG };
  let handwriting = { ...DEFAULT_HANDWRITING_CONFIG };

  // Load general settings
  try {
    const rawSettings = storage.getItem(STORAGE_KEYS.SETTINGS);
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (typeof parsed.exportScale === 'number') exportScale = parsed.exportScale;
      if (typeof parsed.activePresetId === 'string') activePresetId = parsed.activePresetId;
    }
  } catch (e) {
    console.warn('Failed to parse stored general settings:', e);
  }

  // Load text
  try {
    const rawText = storage.getItem(STORAGE_KEYS.TEXT);
    if (rawText !== null && rawText !== undefined) {
      text = rawText;
    }
  } catch (e) {
    console.warn('Failed to parse stored text:', e);
  }

  // Load paper config
  try {
    const rawPaper = storage.getItem(STORAGE_KEYS.PAPER);
    if (rawPaper) {
      const parsed = JSON.parse(rawPaper);
      paper = { ...DEFAULT_PAPER_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse stored paper config:', e);
  }

  // Load handwriting config
  try {
    const rawHandwriting = storage.getItem(STORAGE_KEYS.HANDWRITING);
    if (rawHandwriting) {
      const parsed = JSON.parse(rawHandwriting);
      handwriting = { ...DEFAULT_HANDWRITING_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse stored handwriting config:', e);
  }

  // 文件导入的字体刷新后已不存在，选中项必须回落到可用字体，
  // 否则下拉框会空着一个不存在的 family，预览悄悄换成系统兜底字体。
  if (
    typeof handwriting.fontFamily === 'string' &&
    handwriting.fontFamily.startsWith(CUSTOM_FONT_FAMILY_PREFIX)
  ) {
    handwriting = { ...handwriting, fontFamily: DEFAULT_HANDWRITING_CONFIG.fontFamily };
  }

  return {
    text,
    paper,
    handwriting,
    exportScale,
    activePresetId,
  };
}

/**
 * 写入单个 localStorage 键并返回是否成功。
 * 独立 try/catch：某一项写不进去不能连带丢掉其它设置。
 */
function safeSetItem(storage: Storage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch (e) {
    const isQuota = e instanceof DOMException && (
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
    console.warn(
      isQuota
        ? `localStorage 配额已满，「${key}」未能保存（浏览器一般给 5MB 左右）`
        : `保存「${key}」失败`,
      e
    );
    return false;
  }
}

/**
 * Save current settings to localStorage with quota protection
 */
export function saveStoredSettings(settings: StoredSettings): void {
  const storage = getSafeStorage();
  if (!storage) return;

  // 文字最重要，先写
  if (settings.text !== undefined) {
    safeSetItem(storage, STORAGE_KEYS.TEXT, settings.text);
  }

  if (settings.paper !== undefined) {
    let paperToSave = settings.paper;

    // 底图是 base64 data URL，一张手机照片就能把 5MB 配额吃光。
    // 预先兜底：超过阈值就不持久化底图（当前会话仍然可用）。
    if (isCustomBackgroundTooLarge(paperToSave)) {
      paperToSave = { ...paperToSave, customImageUrl: undefined };
    }

    if (!safeSetItem(storage, STORAGE_KEYS.PAPER, JSON.stringify(paperToSave))) {
      // 仍然写不进：最后再退一次，彻底丢弃底图，保住纸张尺寸与排版参数
      safeSetItem(
        storage,
        STORAGE_KEYS.PAPER,
        JSON.stringify({ ...settings.paper, customImageUrl: undefined })
      );
    }
  }

  if (settings.handwriting !== undefined) {
    safeSetItem(storage, STORAGE_KEYS.HANDWRITING, JSON.stringify(settings.handwriting));
  }

  let currentMeta: Record<string, unknown> = {
    exportScale: 2,
    activePresetId: PRESET_TEMPLATES[0].id,
  };
  const existingRaw = storage.getItem(STORAGE_KEYS.SETTINGS);
  if (existingRaw) {
    try {
      const parsed = JSON.parse(existingRaw);
      if (parsed && typeof parsed === 'object') {
        currentMeta = { ...currentMeta, ...parsed };
      }
    } catch {}
  }

  if (settings.exportScale !== undefined) currentMeta.exportScale = settings.exportScale;
  if (settings.activePresetId !== undefined) currentMeta.activePresetId = settings.activePresetId;

  safeSetItem(storage, STORAGE_KEYS.SETTINGS, JSON.stringify(currentMeta));
}

/**
 * Load stored custom fonts metadata
 */
export function loadStoredCustomFonts(): FontOption[] {
  const storage = getSafeStorage();
  if (!storage) return [];
  migrateLegacyStorage(storage);
  try {
    const raw = storage.getItem(STORAGE_KEYS.FONTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(f => f && f.id && f.name && f.family && !isSessionOnlyFont(f));
      }
    }
  } catch (e) {
    console.warn('Failed to load stored custom fonts:', e);
  }
  return [];
}

/**
 * Save custom fonts metadata to localStorage
 */
export function saveStoredCustomFonts(fonts: FontOption[]): void {
  const storage = getSafeStorage();
  if (!storage) return;
  // 一次本机扫描可能识别出上百款字体，全量持久化会挤占给底图和正文用的配额
  const serializable = fonts
    .filter(f => (f.isCustom || f.category === 'system') && !isSessionOnlyFont(f))
    .slice(0, MAX_PERSISTED_FONTS)
    .map(f => ({
      id: f.id,
      name: f.name,
      family: f.family,
      category: f.category,
      isCustom: f.isCustom,
    }));
  safeSetItem(storage, STORAGE_KEYS.FONTS, JSON.stringify(serializable));
}

/**
 * Clear all stored settings from localStorage
 */
export function clearStoredSettings(): void {
  const storage = getSafeStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEYS.SETTINGS);
    storage.removeItem(STORAGE_KEYS.PAPER);
    storage.removeItem(STORAGE_KEYS.HANDWRITING);
    storage.removeItem(STORAGE_KEYS.TEXT);
    storage.removeItem(STORAGE_KEYS.FONTS);
    // 旧键也一并清掉，否则下次读取会把刚被重置掉的数据又迁移回来
    storage.removeItem(LEGACY_STORAGE_KEYS.SETTINGS);
    storage.removeItem(LEGACY_STORAGE_KEYS.PAPER);
    storage.removeItem(LEGACY_STORAGE_KEYS.HANDWRITING);
    storage.removeItem(LEGACY_STORAGE_KEYS.TEXT);
    storage.removeItem(LEGACY_STORAGE_KEYS.FONTS);
  } catch (e) {
    console.warn('Failed to clear stored settings:', e);
  }
}
