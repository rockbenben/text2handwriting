import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { EAGER_LOCALE_BUNDLES, hasLazyLoader, loadLazyBundle } from './loaders';
import {
  ALL_LANGUAGE_CODES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LEGACY_LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  detectBrowserLanguage,
  isSupportedLanguage,
} from './languages';

/**
 * 获取应用初始语言：
 * 1. 优先读取 localStorage 持久化的用户手动选择（含旧版键名兼容）。
 * 2. 若用户从未手动选择过（首次访问），则根据浏览器首选语言（navigator.languages）自动匹配 18 种支持语言之一。
 * 3. 若均未匹配，最终回落到默认语言（zh-CN）。
 */
export function getInitialLanguage(browserLanguages?: readonly string[]): string {
  try {
    const saved =
      localStorage.getItem(LANGUAGE_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
    if (saved && isSupportedLanguage(saved)) return saved;
  } catch {
    // localStorage 被禁（隐私模式 / 存储满）时静默跳过
  }

  const detected = detectBrowserLanguage(browserLanguages);
  if (detected && isSupportedLanguage(detected)) {
    return detected;
  }

  return DEFAULT_LANGUAGE;
}

/** RTL 语言需要翻转整个文档方向 */
function applyLanguageDocumentAttributes(code: string): void {
  const meta = SUPPORTED_LANGUAGES.find(l => l.code === code);
  document.documentElement.lang = code;
  document.documentElement.dir = meta?.rtl ? 'rtl' : 'ltr';
}

/**
 * 切换语言：先按需取回语言包（默认语言已内联，无需请求），
 * 注册后再切换，避免界面先闪一下 key 再出译文。
 * 返回最终生效的语言代码。
 */
export async function setAppLanguage(code: string): Promise<string> {
  const next = isSupportedLanguage(code) ? code : DEFAULT_LANGUAGE;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    // 新键已落盘，旧键留着只会让后续读取产生歧义
    localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
  } catch {
    // 存储失败不影响本次会话内的切换
  }
  applyLanguageDocumentAttributes(next);

  // en/zh-CN 已内联；其余语言先按需取回语言包（可能是空占位 {} ，
  // 此时缺 key 会自动回落到英文，而不是露出 key）
  if (hasLazyLoader(next) && !i18next.hasResourceBundle(next, 'translation')) {
    const bundle = await loadLazyBundle(next);
    if (bundle) {
      i18next.addResourceBundle(next, 'translation', bundle, true, true);
    }
  }
  await i18next.changeLanguage(next);
  syncDocumentMeta();
  return next;
}

/**
 * 把 <title>、description、keywords、OG/Twitter 卡同步到当前语言。
 * 缺翻译时 t() 回落到英文，因此所有语言切换后 head 都不会残留中文。
 */
function syncDocumentMeta(): void {
  const t = i18next.t.bind(i18next);
  const title = t('documentMeta.title');
  const description = t('documentMeta.description');

  document.title = title;
  const setContent = (id: string, value: string) => {
    document.getElementById(id)?.setAttribute('content', value);
  };
  setContent('meta-description', description);
  setContent('meta-keywords', t('documentMeta.keywords'));
  setContent('og-title', title);
  setContent('og-description', description);
  setContent('og-locale', t('documentMeta.ogLocale'));
  setContent('twitter-title', title);
  setContent('twitter-description', description);

  // apple 安装名也跟随
  document.querySelector('meta[name="apple-mobile-web-app-title"]')
    ?.setAttribute('content', t('app.brand'));
}

/**
 * 启动时初始化。若持久化语言是按需语言，先取回它的语言包再初始化，
 * 避免首屏先显示回落语言、再闪切到目标语言。
 * 在 main.tsx 里 await 后再挂载 React。
 */
export async function initI18n(): Promise<typeof i18next> {
  const initial = getInitialLanguage();
  applyLanguageDocumentAttributes(initial);

  const resources: Record<string, { translation: Record<string, unknown> }> = {
    ...EAGER_LOCALE_BUNDLES,
  };

  if (hasLazyLoader(initial) && !(initial in EAGER_LOCALE_BUNDLES)) {
    const bundle = await loadLazyBundle(initial);
    if (bundle) resources[initial] = { translation: bundle };
  }

  await i18next.use(initReactI18next).init({
    resources,
    lng: initial,
    // 缺翻译一律回落到英文（en 已内联）
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  // 让老用户刷新后 <head> 也立刻是其持久化语言（初始 HTML 默认中文给爬虫/首访）
  syncDocumentMeta();

  return i18next;
}

export { i18next };
export const SUPPORTED_LANGUAGE_CODES = ALL_LANGUAGE_CODES;
