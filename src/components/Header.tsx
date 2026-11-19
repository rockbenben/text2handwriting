import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Download,
  Ellipsis,
  ChevronDown,
  FileText,
  Archive,
  Printer,
  LayoutTemplate,
  Image as ImageIcon,
  Languages
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, FULLY_TRANSLATED } from '../i18n/languages';
import { setAppLanguage } from '../i18n';

/** 开源仓库地址，供顶栏 GitHub 入口使用（宽屏内联在操作区，窄屏收进「更多」菜单） */
const REPO_URL = 'https://github.com/rockbenben/text2handwriting';

/**
 * 品牌标识：与 public/favicon.svg 是【同一份图形】。
 *
 * 这里原本用的是通用 lucide 钢笔图标套一个蓝紫渐变方块，跟品牌图形毫无关系 ——
 * 于是「标签页图标」和「界面 logo」是两个不同的东西，改了 favicon 界面不会跟着变。
 * 直接内联同一份 SVG 就不会再漂移。
 *
 * 图形自带米白纸底（#fdf6e9），可与顶栏区分，
 * 所以不要再套背景色或渐变。
 */
const BrandMark: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg
    className="brand-mark"
    width={size}
    height={size}
    viewBox="0 0 48 48"
    aria-hidden="true"
    focusable="false"
  >
    <rect width="48" height="48" rx="11" fill="#fdf6e9" />
    <rect width="48" height="48" rx="11" fill="none" stroke="#e8dcc4" strokeWidth="1" />
    <line x1="10.5" y1="7" x2="10.5" y2="41" stroke="#e2a8a4" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="15" y1="14.5" x2="40" y2="14.5" stroke="#b9cede" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
    <line x1="15" y1="36" x2="40" y2="36" stroke="#b9cede" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
    <path
      d="M12 29 C 15 22, 19.5 20.5, 22.5 23.5 C 25.5 26.5, 23.5 30.5, 27.5 30 C 31.5 29.5, 32.5 24.5, 36.5 23.5 C 38.5 23, 40 23, 41.5 23.6"
      fill="none"
      stroke="#1e3a5f"
      strokeWidth="3.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 32 Q 21 30.5, 23 32 T 27 32 T 31 32"
      fill="none"
      stroke="#c0564e"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * lucide-react 自 v1 起移除了品牌图标（没有 Github 可用），所以内联 GitHub 官方
 * mark 的 path，不为此单独引入图标依赖。
 * 路径逐字符取自 GitHub 自家的图标库 primer/octicons：icons/mark-github-16.svg
 * （注意 GitHub 后来改过这个矢量，网上流传的旧版 path 与本仓库用的不是同一份）。
 * fill="currentColor" 让它跟随 .btn-secondary 的文字色（--text-main），不必写死填充色。
 */
const GithubMark: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656" />
  </svg>
);

interface HeaderProps {
  onOpenPresets: () => void;
  exportScale: number;
  onSetExportScale: (scale: number) => void;
  onExportCurrentPage: (format: 'png' | 'jpeg') => void;
  onExportAllZip: () => void;
  onExportAllPdf: () => void;
  onPrint: () => void;
  isExporting: boolean;
  totalChars: number;
  totalPages: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPresets,
  exportScale,
  onSetExportScale,
  onExportCurrentPage,
  onExportAllZip,
  onExportAllPdf,
  onPrint,
  isExporting,
  totalChars,
  totalPages,
}) => {
  const { t, i18n } = useTranslation();
  const [pendingLanguage, setPendingLanguage] = useState<{ code: string } | null>(null);
  const [openPanel, setOpenPanel] = useState<'utilities' | 'export' | null>(null);
  const showExportMenu = openPanel === 'export';
  const showUtilities = openPanel === 'utilities';
  const utilitiesButtonRef = useRef<HTMLButtonElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = async (code: string) => {
    // 语言包是异步取回的：先记下用户点选的项顶住受控 select 的 value，
    // 否则 await 期间 select 会回弹到旧语言，看起来像没生效，也没法立刻改选另一种。
    const selection = { code };
    setPendingLanguage(selection);
    try {
      await setAppLanguage(code);
    } catch (error) {
      console.error('Could not change language:', error);
    } finally {
      setPendingLanguage(current => current === selection ? null : current);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <div className="header-brand">
        <BrandMark size={34} />
        <div className="brand-copy">
          <h1 className="brand-title">{t('app.brand')}</h1>
          <span className="brand-local"><ShieldCheck size={12} aria-hidden="true" />{t('app.badge')}</span>
        </div>
        <span className="brand-stats">{t('app.stats', { chars: totalChars, pages: totalPages })}</span>
      </div>

      <div
        className="header-actions"
        ref={actionsRef}
        onKeyDown={(event) => {
          if (event.key !== 'Escape' || !openPanel) return;
          setOpenPanel(null);
          (showExportMenu ? exportButtonRef : utilitiesButtonRef).current?.focus();
        }}
      >
        <div className="header-utilities-wrap">
          <button
            type="button"
            ref={utilitiesButtonRef}
            className="btn btn-secondary btn-icon header-more"
            aria-label={t('common.more')}
            aria-expanded={showUtilities}
            aria-controls="header-utilities"
            onClick={() => setOpenPanel(showUtilities ? null : 'utilities')}
          >
            <Ellipsis size={18} aria-hidden="true" />
          </button>
          <div id="header-utilities" className="header-utilities" data-open={showUtilities}>
            {/* 语言切换：记住选择，刷新保持 */}
            <label className="header-language">
              <Languages size={16} aria-hidden="true" />
              <span className="header-language-label">{t('header.languageTitle')}</span>
              <select
                value={pendingLanguage?.code ?? i18n.language}
                onChange={(e) => void handleLanguageChange(e.target.value)}
                title={t('header.languageTitle')}
                aria-label={t('header.languageTitle')}
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.label}{FULLY_TRANSLATED.has(l.code) ? '' : ' (EN)'}
                  </option>
                ))}
              </select>
            </label>

            {/* Preset Templates */}
            <button className="btn btn-secondary" onClick={() => {
              if (showUtilities) utilitiesButtonRef.current?.focus();
              setOpenPanel(null);
              onOpenPresets();
            }} title={t('header.presetsTitle')}>
              <LayoutTemplate size={15} />
              <span>{t('header.presets')}</span>
            </button>

            {/* 开源仓库入口：宽屏纯图标、窄屏带文字；新标签打开，不打断用户正在编辑的文稿 */}
            <a
              className="btn btn-secondary header-source"
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              title={t('header.githubTitle')}
              aria-label={t('header.githubTitle')}
            >
              <GithubMark size={16} />
              <span>{t('header.githubTitle')}</span>
            </a>
          </div>
        </div>

        {/* Export Dropdown */}
        <div className="header-output">
          <button
            ref={exportButtonRef}
            className="btn btn-primary"
            aria-expanded={showExportMenu}
            aria-controls="export-options"
            onClick={() => setOpenPanel(showExportMenu ? null : 'export')}
            disabled={isExporting}
            title={isExporting ? t('header.exporting') : t('header.export')}
            aria-label={isExporting ? t('header.exporting') : t('header.export')}
          >
            <Download size={15} />
            <span>{isExporting ? t('header.exporting') : t('header.export')}</span>
            <ChevronDown size={14} />
          </button>

          <div id="export-options" className="dropdown-menu" hidden={!showExportMenu}>
            <label className="export-quality">
              <span>{t('header.quality')}</span>
              <select value={exportScale} onChange={(e) => onSetExportScale(Number(e.target.value))}>
                <option value="1">{t('header.qualityStandard')}</option>
                <option value="2">{t('header.qualityHigh')}</option>
                <option value="3">{t('header.qualityUltra')}</option>
              </select>
            </label>
            <button
              className="dropdown-item"
              onClick={() => { setOpenPanel(null); onExportCurrentPage('png'); }}
            >
              <ImageIcon size={14} />
              <span>{t('header.exportPng')}</span>
            </button>
            <button
              className="dropdown-item"
              onClick={() => { setOpenPanel(null); onExportCurrentPage('jpeg'); }}
            >
              <ImageIcon size={14} />
              <span>{t('header.exportJpg')}</span>
            </button>
            <hr className="dropdown-divider" />
            <button
              className="dropdown-item"
              onClick={() => { setOpenPanel(null); onExportAllPdf(); }}
            >
              <FileText size={14} />
              <span>{t('header.exportPdf')}</span>
            </button>
            <button
              className="dropdown-item"
              onClick={() => { setOpenPanel(null); onExportAllZip(); }}
            >
              <Archive size={14} />
              <span>{t('header.exportZip')}</span>
            </button>
            <hr className="dropdown-divider" />
            <button
              className="dropdown-item"
              onClick={() => { setOpenPanel(null); onPrint(); }}
            >
              <Printer size={14} />
              <span>{t('header.printPage')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
