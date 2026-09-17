import { describe, it, expect, beforeEach, vi } from 'vitest';
import zhCN from '../../i18n/locales/zh-CN.json';
import zhTW from '../../i18n/locales/zh-TW.json';
import en from '../../i18n/locales/en.json';
import ja from '../../i18n/locales/ja.json';
import ko from '../../i18n/locales/ko.json';
import de from '../../i18n/locales/de.json';
import es from '../../i18n/locales/es.json';
import fr from '../../i18n/locales/fr.json';
import itLocale from '../../i18n/locales/it.json';
import pt from '../../i18n/locales/pt.json';
import ru from '../../i18n/locales/ru.json';
import ar from '../../i18n/locales/ar.json';
import hi from '../../i18n/locales/hi.json';
import bn from '../../i18n/locales/bn.json';
import idLocale from '../../i18n/locales/id.json';
import th from '../../i18n/locales/th.json';
import viLocale from '../../i18n/locales/vi.json';
import tr from '../../i18n/locales/tr.json';
import { getInitialLanguage } from '../../i18n';
import {
  LANGUAGE_STORAGE_KEY,
  LEGACY_LANGUAGE_STORAGE_KEY,
  matchLanguageTag,
  detectBrowserLanguage,
} from '../../i18n/languages';

type Dict = Record<string, unknown>;

function flatten(obj: Dict, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flatten(value as Dict, full));
    } else {
      out[full] = String(value);
    }
  }
  return out;
}

const placeholders = (s: string): string[] =>
  [...s.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]).sort();

const complete = {
  'zh-CN': flatten(zhCN as Dict),
  'zh-TW': flatten(zhTW as Dict),
  en: flatten(en as Dict),
  ja: flatten(ja as Dict),
  ko: flatten(ko as Dict),
  de: flatten(de as Dict),
  es: flatten(es as Dict),
  fr: flatten(fr as Dict),
  it: flatten(itLocale as Dict),
  pt: flatten(pt as Dict),
  ru: flatten(ru as Dict),
  ar: flatten(ar as Dict),
  hi: flatten(hi as Dict),
  bn: flatten(bn as Dict),
  id: flatten(idLocale as Dict),
  th: flatten(th as Dict),
  vi: flatten(viLocale as Dict),
  tr: flatten(tr as Dict),
};

describe('i18n complete locales', () => {
  const baseKeys = Object.keys(complete['zh-CN']).sort();

  it('all complete locales expose the same key set as zh-CN', () => {
    for (const [lng, dict] of Object.entries(complete)) {
      if (lng === 'zh-CN') continue;
      const keys = Object.keys(dict).sort();
      expect(keys).toEqual(baseKeys);
    }
  });

  it('no value is empty or just the raw key', () => {
    for (const [lng, dict] of Object.entries(complete)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim().length, `${lng}:${key} is empty`).toBeGreaterThan(0);
        expect(value, `${lng}:${key} renders the raw key`).not.toBe(key);
      }
    }
  });

  it('interpolation placeholders match zh-CN in every translation', () => {
    for (const key of baseKeys) {
      const expected = placeholders(complete['zh-CN'][key]);
      for (const lng of Object.keys(complete)) {
        if (lng === 'zh-CN') continue;
        expect(placeholders((complete as Record<string, Record<string, string>>)[lng][key]), `${lng}:${key}`).toEqual(expected);
      }
    }
  });
});

describe('browser language matching (matchLanguageTag & detectBrowserLanguage)', () => {
  it('correctly matches regional variations to supported base languages', () => {
    expect(matchLanguageTag('en-US')).toBe('en');
    expect(matchLanguageTag('en-GB')).toBe('en');
    expect(matchLanguageTag('pt-BR')).toBe('pt');
    expect(matchLanguageTag('pt-PT')).toBe('pt');
    expect(matchLanguageTag('es-ES')).toBe('es');
    expect(matchLanguageTag('es-419')).toBe('es');
    expect(matchLanguageTag('fr-CA')).toBe('fr');
    expect(matchLanguageTag('de-DE')).toBe('de');
    expect(matchLanguageTag('ja-JP')).toBe('ja');
    expect(matchLanguageTag('ko-KR')).toBe('ko');
    expect(matchLanguageTag('ar-EG')).toBe('ar');
    expect(matchLanguageTag('hi-IN')).toBe('hi');
    expect(matchLanguageTag('bn-BD')).toBe('bn');
    expect(matchLanguageTag('id-ID')).toBe('id');
    expect(matchLanguageTag('in-ID')).toBe('id'); // legacy Indonesian
    expect(matchLanguageTag('th-TH')).toBe('th');
    expect(matchLanguageTag('vi-VN')).toBe('vi');
    expect(matchLanguageTag('tr-TR')).toBe('tr');
  });

  it('distinguishes Traditional Chinese from Simplified Chinese dialects and scripts', () => {
    expect(matchLanguageTag('zh-TW')).toBe('zh-TW');
    expect(matchLanguageTag('zh-HK')).toBe('zh-TW');
    expect(matchLanguageTag('zh-MO')).toBe('zh-TW');
    expect(matchLanguageTag('zh-Hant')).toBe('zh-TW');
    expect(matchLanguageTag('zh-Hant-HK')).toBe('zh-TW');

    expect(matchLanguageTag('zh-CN')).toBe('zh-CN');
    expect(matchLanguageTag('zh-SG')).toBe('zh-CN');
    expect(matchLanguageTag('zh-Hans')).toBe('zh-CN');
    expect(matchLanguageTag('zh-Hans-CN')).toBe('zh-CN');
    expect(matchLanguageTag('zh')).toBe('zh-CN');
  });

  it('returns null for unsupported language codes', () => {
    expect(matchLanguageTag('nl-NL')).toBeNull();
    expect(matchLanguageTag('sv-SE')).toBeNull();
    expect(matchLanguageTag('pl')).toBeNull();
    expect(matchLanguageTag('')).toBeNull();
  });

  it('detectBrowserLanguage returns first supported match according to user preference priority', () => {
    expect(detectBrowserLanguage(['pl-PL', 'fr-FR', 'en-US'])).toBe('fr');
    expect(detectBrowserLanguage(['zh-HK', 'en-US'])).toBe('zh-TW');
    expect(detectBrowserLanguage(['unknown-XX', 'ja'])).toBe('ja');
    expect(detectBrowserLanguage(['fi-FI', 'sv-SE'])).toBeNull();
  });
});

describe('language storage key migration and initial language resolution', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => (mockStorage[key] !== undefined ? mockStorage[key] : null),
      setItem: (key: string, val: string) => {
        mockStorage[key] = String(val);
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
    });
  });

  it('still honours a language saved under the legacy key', () => {
    mockStorage[LEGACY_LANGUAGE_STORAGE_KEY] = 'ja';
    expect(getInitialLanguage(['en-US'])).toBe('ja');
  });

  it('prefers the new key when both exist', () => {
    mockStorage[LANGUAGE_STORAGE_KEY] = 'de';
    mockStorage[LEGACY_LANGUAGE_STORAGE_KEY] = 'ja';
    expect(getInitialLanguage(['en-US'])).toBe('de');
  });

  it('user explicit selection in localStorage overrides browser language preference', () => {
    mockStorage[LANGUAGE_STORAGE_KEY] = 'ko';
    // Even if browser prefers French, user manual choice wins
    expect(getInitialLanguage(['fr-FR', 'en'])).toBe('ko');
  });

  it('auto-detects browser language on first visit when localStorage is empty', () => {
    expect(getInitialLanguage(['ja-JP', 'en'])).toBe('ja');
    expect(getInitialLanguage(['en-US', 'zh-CN'])).toBe('en');
    expect(getInitialLanguage(['zh-HK'])).toBe('zh-TW');
    expect(getInitialLanguage(['de-AT'])).toBe('de');
  });

  it('falls back to zh-CN when no stored value and browser language is unsupported', () => {
    expect(getInitialLanguage(['fi-FI', 'sv-SE'])).toBe('zh-CN');
    expect(getInitialLanguage([])).toBe('zh-CN');
  });

  it('falls back to zh-CN when stored value is invalid and browser is unsupported', () => {
    mockStorage[LEGACY_LANGUAGE_STORAGE_KEY] = 'not-a-locale';
    expect(getInitialLanguage(['fi-FI'])).toBe('zh-CN');
  });
});

