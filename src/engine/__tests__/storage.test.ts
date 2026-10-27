import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  STORAGE_KEYS,
  LEGACY_STORAGE_KEYS,
  DEFAULT_PAPER_CONFIG,
  DEFAULT_HANDWRITING_CONFIG,
  loadStoredSettings,
  saveStoredSettings,
  loadStoredCustomFonts,
  saveStoredCustomFonts,
  clearStoredSettings,
  migrateLegacyStorage,
  isCustomBackgroundTooLarge,
  CUSTOM_BG_PERSIST_MAX_CHARS,
  SECTION_DEFAULTS,
} from '../storage';
import { CUSTOM_FONT_FAMILY_PREFIX } from '../fontLoader';
import type { PaperConfig, HandwritingConfig } from '../types';

describe('Local Storage Persistence and Section Resets', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] !== undefined ? mockStorage[key] : null),
      setItem: vi.fn((key: string, val: string) => {
        mockStorage[key] = String(val);
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    });
  });

  it('loads default settings when localStorage is empty', () => {
    const loaded = loadStoredSettings();
    expect(loaded.paper.type).toBe(DEFAULT_PAPER_CONFIG.type);
    expect(loaded.handwriting.fontFamily).toBe(DEFAULT_HANDWRITING_CONFIG.fontFamily);
    expect(loaded.text).toBeDefined();
    expect(loaded.exportScale).toBe(2);
  });

  it('saves and reloads full settings correctly', () => {
    const customPaper: PaperConfig = {
      ...DEFAULT_PAPER_CONFIG,
      lineSpacing: 70,
      marginTop: 200,
    };
    const customHandwriting: HandwritingConfig = {
      ...DEFAULT_HANDWRITING_CONFIG,
      fontSize: 45,
      inkColor: '#dc2626',
      glyphVariance: 0.5,
    };

    saveStoredSettings({
      text: '测试保存文本内容',
      paper: customPaper,
      handwriting: customHandwriting,
      exportScale: 3,
      activePresetId: 'custom-preset',
    });

    const loaded = loadStoredSettings();
    expect(loaded.text).toBe('测试保存文本内容');
    expect(loaded.paper.lineSpacing).toBe(70);
    expect(loaded.paper.marginTop).toBe(200);
    expect(loaded.handwriting.fontSize).toBe(45);
    expect(loaded.handwriting.inkColor).toBe('#dc2626');
    expect(loaded.handwriting.glyphVariance).toBe(0.5);
    expect(loaded.exportScale).toBe(3);
    expect(loaded.activePresetId).toBe('custom-preset');
  });

  it('safely handles corrupt or partial JSON in localStorage by merging defaults', () => {
    mockStorage[STORAGE_KEYS.SETTINGS] = '{ invalid json !!';
    mockStorage[STORAGE_KEYS.PAPER] = JSON.stringify({ lineSpacing: 66 }); // partial paper
    mockStorage[STORAGE_KEYS.HANDWRITING] = JSON.stringify({ fontSize: 50 }); // partial handwriting

    const loaded = loadStoredSettings();
    // Corrupt root settings handled gracefully
    expect(loaded.paper.lineSpacing).toBe(66);
    expect(loaded.paper.marginTop).toBe(DEFAULT_PAPER_CONFIG.marginTop); // fallback preserved
    expect(loaded.handwriting.fontSize).toBe(50);
    expect(loaded.handwriting.fontFamily).toBe(DEFAULT_HANDWRITING_CONFIG.fontFamily); // fallback preserved
  });

  it('provides precise defaults for all section resets', () => {
    expect(SECTION_DEFAULTS.font.fontFamily).toBe(DEFAULT_HANDWRITING_CONFIG.fontFamily);
    expect(SECTION_DEFAULTS.ink.inkColor).toBe('#1e293b');
    expect(SECTION_DEFAULTS.typography.fontSize).toBe(38);
    expect(SECTION_DEFAULTS.typography.lineHeight).toBe(56);
    expect(SECTION_DEFAULTS.disarray.xVariance).toBe(0.8);
    expect(SECTION_DEFAULTS.realism.glyphVariance).toBe(0.35);
    expect(SECTION_DEFAULTS.realism.inkBleed).toBe(0.4);
    expect(SECTION_DEFAULTS.realism.wristArc).toBe(0.15);
    expect(SECTION_DEFAULTS.scratch.scratchOutProbability).toBe(0.008);
    expect(SECTION_DEFAULTS.annotation.annotationProbability).toBe(0);
    expect(SECTION_DEFAULTS.paperMargins.marginTop).toBe(140);
    expect(SECTION_DEFAULTS.paperLines.lineSpacing).toBe(56);
    expect(SECTION_DEFAULTS.photoEffects.paperTexture).toBe('clean');
  });

  it('resets a specific section without mutating unrelated configurations', () => {
    // Start with a heavily customized handwriting config
    const modified: HandwritingConfig = {
      ...DEFAULT_HANDWRITING_CONFIG,
      fontFamily: 'Zhi Mang Xing',
      inkColor: '#dc2626',
      fontSize: 48,
      glyphVariance: 0.9,
      inkBleed: 0.8,
      wristArc: 0.4,
      scratchOutProbability: 0.2,
    };

    // Reset only realism section
    const resetRealism = {
      ...modified,
      ...SECTION_DEFAULTS.realism,
    };

    // Realism fields restored
    expect(resetRealism.glyphVariance).toBe(SECTION_DEFAULTS.realism.glyphVariance);
    expect(resetRealism.inkBleed).toBe(SECTION_DEFAULTS.realism.inkBleed);
    expect(resetRealism.wristArc).toBe(SECTION_DEFAULTS.realism.wristArc);
    // Other fields untouched
    expect(resetRealism.fontFamily).toBe('Zhi Mang Xing');
    expect(resetRealism.inkColor).toBe('#dc2626');
    expect(resetRealism.fontSize).toBe(48);
    expect(resetRealism.scratchOutProbability).toBe(0.2);
  });

  it('resets paper sections accurately without mutating other paper settings', () => {
    const customPaper: PaperConfig = {
      ...DEFAULT_PAPER_CONFIG,
      marginTop: 250,
      marginBottom: 200,
      lineSpacing: 80,
      customImageUrl: 'data:image/png;base64,123',
    };

    // Reset only margins
    const resetMargins = {
      ...customPaper,
      ...SECTION_DEFAULTS.paperMargins,
    };
    expect(resetMargins.marginTop).toBe(140);
    expect(resetMargins.marginBottom).toBe(130);
    expect(resetMargins.lineSpacing).toBe(80); // intact
    expect(resetMargins.customImageUrl).toBe('data:image/png;base64,123'); // intact
  });

  it('clears stored settings on reset', () => {
    saveStoredSettings({
      text: 'temp',
      paper: DEFAULT_PAPER_CONFIG,
      handwriting: DEFAULT_HANDWRITING_CONFIG,
    });
    expect(mockStorage[STORAGE_KEYS.SETTINGS]).toBeDefined();

    clearStoredSettings();
    expect(mockStorage[STORAGE_KEYS.SETTINGS]).toBeUndefined();
  });

  it('never persists file-imported fonts, including stale entries from older versions', () => {
    const imported = {
      id: `${CUSTOM_FONT_FAMILY_PREFIX}mine_1`,
      name: '文件导入: mine.ttf',
      family: `${CUSTOM_FONT_FAMILY_PREFIX}mine_1`,
      isCustom: true,
      category: 'system' as const,
      sessionOnly: true,
    };
    const manual = {
      id: 'custom_system_x',
      name: '本机输入: X',
      family: '"X", sans-serif',
      isCustom: true,
      category: 'system' as const,
    };

    saveStoredCustomFonts([imported, manual]);
    expect(JSON.parse(mockStorage[STORAGE_KEYS.FONTS]).map((f: { id: string }) => f.id))
      .toEqual(['custom_system_x']);

    mockStorage[STORAGE_KEYS.FONTS] = JSON.stringify([
      { ...imported, sessionOnly: undefined },
      manual,
    ]);
    expect(loadStoredCustomFonts().map(f => f.id)).toEqual(['custom_system_x']);
  });

  it('resets a stale imported-font selection to the default font on load', () => {
    mockStorage[STORAGE_KEYS.HANDWRITING] = JSON.stringify({
      fontFamily: `${CUSTOM_FONT_FAMILY_PREFIX}mine_1`,
      fontSize: 50,
    });

    const loaded = loadStoredSettings();
    expect(loaded.handwriting.fontFamily).toBe(DEFAULT_HANDWRITING_CONFIG.fontFamily);
    expect(loaded.handwriting.fontSize).toBe(50);
  });

  it('only drops oversized backgrounds from persistence, not from the live config', () => {
    const oversized = {
      ...DEFAULT_PAPER_CONFIG,
      customImageUrl: `data:image/png;base64,${'x'.repeat(CUSTOM_BG_PERSIST_MAX_CHARS)}`,
    };
    const small = {
      ...DEFAULT_PAPER_CONFIG,
      customImageUrl: 'data:image/png;base64,abc',
    };

    expect(isCustomBackgroundTooLarge(oversized)).toBe(true);
    expect(isCustomBackgroundTooLarge(small)).toBe(false);

    saveStoredSettings({ paper: oversized });
    expect(JSON.parse(mockStorage[STORAGE_KEYS.PAPER]).customImageUrl).toBeUndefined();

    saveStoredSettings({ paper: small });
    expect(JSON.parse(mockStorage[STORAGE_KEYS.PAPER]).customImageUrl).toBe('data:image/png;base64,abc');
  });
});

describe('Legacy storage key migration (autohand_* -> text2handwriting_*)', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] !== undefined ? mockStorage[key] : null),
      setItem: vi.fn((key: string, val: string) => {
        mockStorage[key] = String(val);
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    });
  });

  it('moves legacy values onto the new keys and drops the old ones', () => {
    mockStorage[LEGACY_STORAGE_KEYS.TEXT] = '老用户写的正文';
    mockStorage[LEGACY_STORAGE_KEYS.PAPER] = JSON.stringify({ lineSpacing: 88 });

    expect(migrateLegacyStorage()).toBe(true);

    expect(mockStorage[STORAGE_KEYS.TEXT]).toBe('老用户写的正文');
    expect(mockStorage[LEGACY_STORAGE_KEYS.TEXT]).toBeUndefined();
    expect(JSON.parse(mockStorage[STORAGE_KEYS.PAPER]).lineSpacing).toBe(88);
    expect(mockStorage[LEGACY_STORAGE_KEYS.PAPER]).toBeUndefined();
  });

  it('lets a legacy-only user keep their text through loadStoredSettings', () => {
    // 关键回归：迁移若没接在读取入口上，老用户刷新后正文会被默认示例覆盖
    mockStorage[LEGACY_STORAGE_KEYS.TEXT] = '迁移前的正文';
    mockStorage[LEGACY_STORAGE_KEYS.HANDWRITING] = JSON.stringify({ fontSize: 52 });

    const loaded = loadStoredSettings();
    expect(loaded.text).toBe('迁移前的正文');
    expect(loaded.handwriting.fontSize).toBe(52);
  });

  it('never overwrites a value already written under the new key', () => {
    mockStorage[STORAGE_KEYS.TEXT] = '新键里的正文';
    mockStorage[LEGACY_STORAGE_KEYS.TEXT] = '旧键里的旧正文';

    migrateLegacyStorage();

    expect(mockStorage[STORAGE_KEYS.TEXT]).toBe('新键里的正文');
  });

  it('is idempotent and reports false when there is nothing to migrate', () => {
    expect(migrateLegacyStorage()).toBe(false);
    mockStorage[LEGACY_STORAGE_KEYS.FONTS] = '[]';
    expect(migrateLegacyStorage()).toBe(true);
    expect(migrateLegacyStorage()).toBe(false);
  });

  it('clears legacy keys on reset so reset data cannot come back', () => {
    mockStorage[LEGACY_STORAGE_KEYS.TEXT] = '应当被一起清掉';
    mockStorage[LEGACY_STORAGE_KEYS.SETTINGS] = '{}';

    clearStoredSettings();

    expect(mockStorage[LEGACY_STORAGE_KEYS.TEXT]).toBeUndefined();
    expect(mockStorage[LEGACY_STORAGE_KEYS.SETTINGS]).toBeUndefined();
    expect(migrateLegacyStorage()).toBe(false);
  });
});
