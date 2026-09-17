export type FontCategory = 'bundled' | 'system';

export interface FontOption {
  id: string;
  name: string;
  family: string;
  isCustom?: boolean;
  category: FontCategory;
  /**
   * 仓库内是否真的自带字体文件 (public/fonts/*.ttf)。
   * true  = 完全离线可用，断网也能渲染
   * 未设置/false = 仅通过 Google Fonts 在线加载，离线时会退化为系统兜底字体
   */
  offline?: boolean;
  /**
   * 可选的 i18n key：界面下拉框优先用 t(nameKey) 显示本地化名称，
   * 缺失时回落到 name。字体家族名本身（family）永不翻译。
   */
  nameKey?: string;
}

// 1. 仓库自带主流开源手写字体
// offline: true 的 4 款在 public/fonts 下有随包的 .ttf，断网也能渲染；
// 其余 4 款只依赖 Google Fonts CDN，离线时会退化为系统兜底字体。
export const BUNDLED_FONTS: FontOption[] = [
  { id: 'zhimang', name: '志莽行书 (潇洒连笔)', nameKey: 'fontName.zhimang', family: 'Zhi Mang Xing', category: 'bundled', offline: true },
  { id: 'mashan', name: '马善政楷书 (经典毛笔)', nameKey: 'fontName.mashan', family: 'Ma Shan Zheng', category: 'bundled', offline: true },
  { id: 'longcang', name: '龙苍手书 (行楷风骨)', nameKey: 'fontName.longcang', family: 'Long Cang', category: 'bundled', offline: true },
  { id: 'zcoolkuaile', name: '站酷快乐体 (随性手绘)', nameKey: 'fontName.zcoolkuaile', family: 'ZCOOL KuaiLe', category: 'bundled', offline: true },
  { id: 'liujianmaocao', name: '刘建毛草体 (狂草飞扬)', nameKey: 'fontName.liujianmaocao', family: 'Liu Jian Mao Cao', category: 'bundled' },
  { id: 'zcoolxiaowei', name: '站酷小薇体 (秀气文艺)', nameKey: 'fontName.zcoolxiaowei', family: 'ZCOOL XiaoWei', category: 'bundled' },
  { id: 'caveat', name: 'Caveat (随性速记·英数专用)', nameKey: 'fontName.caveat', family: 'Caveat', category: 'bundled' },
  { id: 'kalam', name: 'Kalam (钢笔圆润·英数专用)', nameKey: 'fontName.kalam', family: 'Kalam', category: 'bundled' },
];

// 2. 系统扫描与大厂精选预置 (鸿蒙、小米、阿里、华文行楷、系统楷体等)
export const INITIAL_SYSTEM_FONTS: FontOption[] = [
  // 经典硬笔与毛笔名家手写体 (系统/第三方已安装)
  { id: 'tianyingzhang', name: '田英章硬笔楷书 (工整实用硬笔规范)', nameKey: 'fontName.tianyingzhang', family: '"田英章硬笔楷书", "TianYingZhang", "田英章楷书", serif', category: 'system' },
  { id: 'pangzhonghua', name: '庞中华硬笔行书 (经典硬笔行书标杆)', nameKey: 'fontName.pangzhonghua', family: '"庞中华硬笔行书", "PangZhongHua", "庞中华行书", cursive, sans-serif', category: 'system' },
  { id: 'jasonhandwriting', name: '清松手写体 (清秀学生风手写)', nameKey: 'fontName.jasonhandwriting', family: '"JasonHandwriting", "清松手写体", cursive, sans-serif', category: 'system' },
  { id: 'muyao', name: '沐瑶软笔手写体 (温暖治愈软笔手札)', nameKey: 'fontName.muyao', family: '"Muyao-Softbrush", "沐瑶软笔手写体", cursive, sans-serif', category: 'system' },
  { id: 'hyshangwei', name: '汉仪尚巍手书 (苍劲有力连笔手写)', nameKey: 'fontName.hyshangwei', family: '"HYShangWeiShouShuW", "汉仪尚巍手书", cursive, sans-serif', category: 'system' },
  { id: 'yegenyou', name: '叶根友毛笔行书 (飘逸灵动毛笔书法)', nameKey: 'fontName.yegenyou', family: '"YeGenYou", "叶根友毛笔行书", cursive, serif', category: 'system' },
  { id: 'fzhb_xing', name: '方正硬笔行书 (流畅清爽便笺手写)', nameKey: 'fontName.fzhb_xing', family: '"FZZJ-HBYXJW", "方正硬笔行书简体", "方正字迹", cursive, sans-serif', category: 'system' },
  { id: 'fzhb_kai', name: '方正硬笔楷书 (工整规范学生作业)', nameKey: 'fontName.fzhb_kai', family: '"FZZJ-HBKSJW", "方正硬笔楷书简体", cursive, sans-serif', category: 'system' },

  // 华为鸿蒙
  { 
    id: 'harmonyos', 
    name: '华为鸿蒙 (HarmonyOS Sans)', 
    nameKey: 'fontName.harmonyos',
    family: '"HarmonyOS Sans SC", "HarmonyOS Sans", "鸿蒙黑体", sans-serif', 
    category: 'system' 
  },
  // 小米
  { 
    id: 'misans', 
    name: '小米字体 (MiSans)', 
    nameKey: 'fontName.misans',
    family: '"MiSans", "MiSans Normal", "小米兰亭", sans-serif', 
    category: 'system' 
  },
  // 阿里巴巴
  { 
    id: 'alibaba_puhuiti', 
    name: '阿里巴巴普惠体 (Alibaba PuHuiTi)', 
    nameKey: 'fontName.alibaba_puhuiti',
    family: '"Alibaba PuHuiTi 3.0", "Alibaba PuHuiTi 2.0", "Alibaba PuHuiTi", "AlibabaPuHuiTi", "阿里巴巴普惠体", sans-serif', 
    category: 'system' 
  },
  { 
    id: 'alimama_dakai', 
    name: '阿里妈妈东方大楷 (阿里开源楷书)', 
    nameKey: 'fontName.alimama_dakai',
    family: '"Alimama DongFangDaKai", "AlimamaDongFangDaKai", "阿里妈妈东方大楷", cursive, serif', 
    category: 'system' 
  },
  { 
    id: 'alimama_daoli', 
    name: '阿里妈妈刀隶体 (阿里个性隶书)', 
    nameKey: 'fontName.alimama_daoli',
    family: '"Alimama DaoLiTi", "AlimamaDaoLiTi", "阿里妈妈刀隶体", cursive, serif', 
    category: 'system' 
  },
  { 
    id: 'alimama_fangyuan', 
    name: '阿里妈妈方圆体 (温润手写质感)', 
    nameKey: 'fontName.alimama_fangyuan',
    family: '"Alimama FangYuanTi", "AlimamaFangYuanTi", "阿里妈妈方圆体", sans-serif', 
    category: 'system' 
  },
  // OPPO / 荣耀
  { 
    id: 'opposans', 
    name: 'OPPO 字体 (OPPO Sans / OPlus)', 
    nameKey: 'fontName.opposans',
    family: '"OPPO Sans", "OPlusSans", "OPPOSans", sans-serif', 
    category: 'system' 
  },
  { 
    id: 'honorsans', 
    name: '荣耀字体 (Honor Sans)', 
    nameKey: 'fontName.honorsans',
    family: '"Honor Sans", "HONOR Sans", sans-serif', 
    category: 'system' 
  },

  // 经典系统书法与手写体
  { id: 'stxingkai', name: '华文行楷 (系统手写·经典行书)', nameKey: 'fontName.stxingkai', family: 'STXingkai, "华文行楷", cursive', category: 'system' },
  { id: 'kaiti', name: '标准楷体 (系统手写·工整标准)', nameKey: 'fontName.kaiti', family: 'KaiTi, "STKaiti", "楷体", serif', category: 'system' },
  { id: 'fzshuti', name: '方正舒体 (系统手写·流畅舒展)', nameKey: 'fontName.fzshuti', family: 'FZShuTi, "方正舒体", cursive', category: 'system' },
  { id: 'stliti', name: '华文隶书 (系统手写·古雅隶书)', nameKey: 'fontName.stliti', family: 'STLiti, "华文隶书", serif', category: 'system' },
  { id: 'youyuan', name: '幼圆 (系统手写·清秀圆润)', nameKey: 'fontName.youyuan', family: 'YouYuan, "幼圆", sans-serif', category: 'system' },
];

export const BRAND_FONTS = INITIAL_SYSTEM_FONTS;

export function normalizeFontKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/["',（）()]/g, '')
    .replace(/\s+/g, '')
    .replace(/sans-serif|serif|cursive|monospace|fantasy|system-ui/g, '');
}

export function getFontTokens(font: FontOption): string[] {
  const tokens = new Set<string>();

  // 1. Family tokens (split by comma)
  for (const part of font.family.split(',')) {
    const clean = normalizeFontKey(part);
    if (clean) tokens.add(clean);
  }

  // 2. Name tokens
  const cleanName = normalizeFontKey(font.name);
  if (cleanName) {
    tokens.add(cleanName);
    const match = font.name.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      const inside = normalizeFontKey(match[1]);
      if (inside) tokens.add(inside);
    }
  }

  return Array.from(tokens);
}

/**
 * Deduplicate font list strictly across family aliases and names
 */
export function deduplicateFontList(fonts: FontOption[]): FontOption[] {
  const seen = new Set<string>();
  const result: FontOption[] = [];

  for (const font of fonts) {
    const tokens = getFontTokens(font);
    const isDuplicate = tokens.some(t => seen.has(t));
    if (isDuplicate) continue;

    for (const t of tokens) {
      seen.add(t);
    }
    result.push(font);
  }

  return result;
}

// Master builtin font options, strictly two categories: bundled and system
export const BUILTIN_FONTS: FontOption[] = deduplicateFontList([
  ...BUNDLED_FONTS,
  ...INITIAL_SYSTEM_FONTS,
]);

/**
 * Creates a custom font option directly from a system font name
 */
export function createCustomFontOption(fontName: string): FontOption {
  const cleanName = fontName.trim();
  return {
    id: `custom_system_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: `本机输入: ${cleanName}`,
    family: `"${cleanName}", sans-serif`,
    isCustom: true,
    category: 'system',
  };
}

/**
 * Loads a user uploaded font file (.ttf / .otf / .woff / .woff2)
 */
export async function loadCustomFontFromFile(file: File): Promise<FontOption> {
  const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
  const familyName = `CustomFont_${cleanName}_${Date.now()}`;

  const arrayBuffer = await file.arrayBuffer();
  const fontFace = new FontFace(familyName, arrayBuffer);

  const loadedFace = await fontFace.load();
  document.fonts.add(loadedFace);

  return {
    id: familyName,
    name: `文件导入: ${file.name.slice(0, 16)}`,
    family: familyName,
    isCustom: true,
    category: 'system',
    // 字体二进制来自用户本机文件，加载后即驻留内存，无需联网
    offline: true,
  };
}
