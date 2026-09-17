import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

/**
 * 语言包按需加载。
 *
 * 18 个语言包全量内联会让首屏多出不少体积，而绝大多数用户只会用一种语言。
 * 所以：
 *   - zh-CN 是默认语言、en 是所有未翻译语言的回落语言，两者都 eager
 *     （en 仅 ~2KB，必须随主包就绪，否则未翻译语言会回落到一串 key）
 *   - 其余 16 种走 import.meta.glob 动态 import，切语言时才下载
 *
 * Vite 会把每个 .json 拆成独立 chunk，只有真正被切换到的语言才会被拉取。
 *
 * 本模块只负责「取数据」，不涉及 i18next 实例，避免与 index.ts 形成循环依赖。
 */
export const EAGER_LOCALE_CODES = ['zh-CN', 'en'] as const;

/** 随主 bundle 内联的语言包：默认语言 + 国际回落语言 */
export const EAGER_LOCALE_BUNDLES: Record<string, { translation: Record<string, unknown> }> = {
  'zh-CN': { translation: zhCN as Record<string, unknown> },
  en: { translation: en as Record<string, unknown> },
};

type LazyBundle = Record<string, unknown>;
type LocaleLoader = () => Promise<{ default: LazyBundle }>;

const EAGER_FILES = new Set(EAGER_LOCALE_CODES.map(c => `${c}.json`));

const ALL_LOCALES = import.meta.glob<unknown>(
  ['./locales/*.json', '!./locales/zh-CN.json', '!./locales/en.json'],
  { eager: false }
) as Record<string, LocaleLoader>;

const lazyByCode: Record<string, LocaleLoader> = {};
for (const [path, loader] of Object.entries(ALL_LOCALES)) {
  const file = path.split('/').pop();
  if (!file || EAGER_FILES.has(file)) continue;
  lazyByCode[file.replace(/\.json$/, '')] = loader;
}

/** 该语言是否有按需加载器（不含已内联的默认语言） */
export function hasLazyLoader(code: string): boolean {
  return code in lazyByCode;
}

/**
 * 按需取回某个语言包。取不到返回 null（调用方负责回落）。
 *
 * 这里的 try/catch 不是防御性摆设：动态 import() 会因网络中断、离线、
 * 或部署换 hash 后旧 chunk 404 而 reject。异常若继续外抛，会一路穿透
 * initI18n()，让 main.tsx 里的 .then 永不执行 —— 表现是整个应用白屏、
 * 连报错都没有。吞掉后返回 null，i18next 会按 fallbackLng 回落到英文，
 * 用户看到的是「语言没生效」而不是「页面打不开」。
 */
export async function loadLazyBundle(code: string): Promise<LazyBundle | null> {
  const loader = lazyByCode[code];
  if (!loader) return null;
  try {
    const mod = await loader();
    return mod.default ?? null;
  } catch (e) {
    console.warn(`语言包「${code}」加载失败，回落到默认语言:`, e);
    return null;
  }
}
