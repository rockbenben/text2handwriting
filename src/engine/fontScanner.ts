import { INITIAL_SYSTEM_FONTS, type FontOption } from './fontLoader';

export const POPULAR_LOCAL_FONTS_PROBE: string[] = [
  // 大厂品牌开源/系统字体
  'HarmonyOS Sans SC',
  'HarmonyOS Sans',
  'MiSans',
  'Alibaba PuHuiTi',
  'Alibaba PuHuiTi 2.0',
  'Alibaba PuHuiTi 3.0',
  'Alimama DongFangDaKai',
  'Alimama DaoLiTi',
  'Alimama FangYuanTi',
  'Alimama ShuHeiTi',
  'OPPO Sans',
  'OPlusSans',
  'Honor Sans',

  // 经典书法与手写体 (Windows/macOS/Office常见)
  '华文行楷',
  'STXingkai',
  '华文楷体',
  'STKaiti',
  '楷体',
  'KaiTi',
  '方正舒体',
  'FZShuTi',
  '方正姚体',
  'FZYaoTi',
  '华文隶书',
  'STLiti',
  '华文新魏',
  'STXinwei',
  '幼圆',
  'YouYuan',
  '隶书',
  'LiSu',
  '微软雅黑',
  'Microsoft YaHei',

  // 常见第三方手写/书法字体
  '田英章硬笔楷书',
  '庞中华硬笔行书',
  '汉仪尚巍手书',
  '汉仪行楷简',
  '汉仪字体',
  '方正字迹',
  '方正喵呜体',
  '方正行楷简体',
  '方正硬笔行书简体',
  '方正硬笔楷书简体',
  '叶根友毛笔行书',
  '叶根友手写体',
  '站酷快乐体',
  '站酷小薇体',
  '站酷高端黑',
  '清松手写体',
  '沐瑶软笔手写体',
  '演示佛系体',
  '演示悠然楷体',
  '思源黑体',
  'Source Han Sans CN',
  '思源宋体',
  'Source Han Serif CN',
  '苹方-简',
  'PingFang SC',
];

const HANDWRITING_KEYWORDS = [
  '行', '楷', '草', '书', '笔', '手', '墨', '帖', '隶', '篆', '舒', '圆', '魏', '潇洒', '手写', '手迹', '毛笔', '硬笔', '可爱',
  'xing', 'kai', 'cao', 'shu', 'script', 'hand', 'pen', 'brush', 'calligraphy', 'casual'
];

export function isHandwritingOrCalligraphyFont(fontName: string): boolean {
  const lower = fontName.toLowerCase();
  return HANDWRITING_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

/**
 * Filter out symbols, vertical variants (@), and deduplicate fonts
 */
export function filterAndDeduplicateFonts(
  raw: Array<{ family: string; fullName?: string }>
): Array<{ family: string; name: string }> {
  const seen = new Set<string>();
  const result: Array<{ family: string; name: string; isHandwriting: boolean; isChinese: boolean }> = [];

  for (const item of raw) {
    let family = item.family.trim();
    if (!family) continue;

    // Filter out vertical orient font variants starting with @
    if (family.startsWith('@')) continue;

    // Filter out obscure symbol / system icon fonts
    if (/^(marlett|segoe mdl2|webdings|wingdings|hololens|symbol)/i.test(family)) continue;

    if (seen.has(family)) continue;
    seen.add(family);

    const isHw = isHandwritingOrCalligraphyFont(family) || (item.fullName ? isHandwritingOrCalligraphyFont(item.fullName) : false);
    const isCn = /[\u4e00-\u9fa5]/.test(family) || /^(harmonyos|misans|alibaba|alimama|oppo|honor|pingfang|st|fz|hy)/i.test(family);

    result.push({
      family,
      name: item.fullName && item.fullName !== family ? `${family} (${item.fullName})` : family,
      isHandwriting: isHw,
      isChinese: isCn,
    });
  }

  // Sort: Handwriting first, then other Chinese/Brand fonts, then alphabetical
  result.sort((a, b) => {
    if (a.isHandwriting && !b.isHandwriting) return -1;
    if (!a.isHandwriting && b.isHandwriting) return 1;
    if (a.isChinese && !b.isChinese) return -1;
    if (!a.isChinese && b.isChinese) return 1;
    return a.family.localeCompare(b.family, 'zh-CN');
  });

  return result.map(({ family, name }) => ({ family, name }));
}

/**
 * Canvas probe fallback to detect if a font is installed in the system
 */
export function detectInstalledFontViaCanvas(fontName: string): boolean {
  if (typeof document === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 40;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  const testString = '国ABCwm!@#一二三';
  const fontSize = '48px';

  // Measure baseline fonts
  ctx.font = `${fontSize} monospace`;
  const monoWidth = ctx.measureText(testString).width;

  ctx.font = `${fontSize} sans-serif`;
  const sansWidth = ctx.measureText(testString).width;

  // Measure with candidate font with fallbacks
  ctx.font = `${fontSize} "${fontName}", monospace`;
  const candidateMonoWidth = ctx.measureText(testString).width;

  ctx.font = `${fontSize} "${fontName}", sans-serif`;
  const candidateSansWidth = ctx.measureText(testString).width;

  // If font is installed, it overrides fallback, producing distinct measurements
  return candidateMonoWidth !== monoWidth || candidateSansWidth !== sansWidth;
}

/**
 * Automatically scans local system fonts using Local Font Access API or Canvas probe
 */
export async function scanLocalSystemFonts(): Promise<{
  fonts: FontOption[];
  method: 'api' | 'probe';
  totalFound: number;
}> {
  // Method 1: Modern W3C Local Font Access API (Chrome/Edge 103+)
  if (typeof window !== 'undefined' && 'queryLocalFonts' in window) {
    try {
      const queryLocal = (window as unknown as { queryLocalFonts: () => Promise<Array<{ family: string; fullName?: string }>> }).queryLocalFonts;
      const localFontsRaw = await queryLocal();
      const deduped = filterAndDeduplicateFonts(localFontsRaw);

      const scannedOptions: FontOption[] = deduped.map((f) => ({
        id: `scanned_${f.family.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_')}`,
        name: f.name,
        family: `"${f.family}", sans-serif`,
        isCustom: true,
        category: 'system',
      }));

      return {
        fonts: scannedOptions,
        method: 'api',
        totalFound: scannedOptions.length,
      };
    } catch (e) {
      console.warn('Local Font Access API denied or failed, using probe fallback:', e);
    }
  }

  // Method 2: High-speed Canvas Probe fallback for popular Chinese fonts
  const detected: Array<{ family: string; name: string }> = [];
  for (const fontName of POPULAR_LOCAL_FONTS_PROBE) {
    if (detectInstalledFontViaCanvas(fontName)) {
      detected.push({ family: fontName, name: fontName });
    }
  }

  const deduped = filterAndDeduplicateFonts(detected);
  const scannedOptions: FontOption[] = deduped.map((f) => {
    const matched = INITIAL_SYSTEM_FONTS.find(s => s.family.includes(f.family) || s.name.includes(f.name));
    return {
      id: `probe_${f.family.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_')}`,
      name: f.name,
      family: `"${f.family}", sans-serif`,
      isCustom: true,
      category: 'system',
      nameKey: matched?.nameKey,
    };
  });

  return {
    fonts: scannedOptions,
    method: 'probe',
    totalFound: scannedOptions.length,
  };
}
