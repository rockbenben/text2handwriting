import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dice5,
  Download,
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

/** 开源仓库地址，供顶栏 GitHub 图标使用 */
const REPO_URL = 'https://github.com/rockbenben/text2handwriting';

/**
 * 品牌标识：与 public/favicon.svg 是【同一份图形】。
 *
 * 这里原本用的是通用 lucide 钢笔图标套一个蓝紫渐变方块，跟品牌图形毫无关系 ——
 * 于是「标签页图标」和「界面 logo」是两个不同的东西，改了 favicon 界面不会跟着变。
 * 直接内联同一份 SVG 就不会再漂移。
 *
 * 图形自带米白纸底（#fdf6e9），在深色顶栏上正好提供对比度，
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
 * fill="currentColor" 让它跟随 .btn-secondary 的文字色，hover 时一起变亮。
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
  onShuffleSeed: () => void;
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
  onShuffleSeed,
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
  // i18n.language 变化时 react-i18next 会让本组件重渲，所以语言下拉不需要本地状态
  const { t, i18n } = useTranslation();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <div className="header-brand">
        <BrandMark size={34} />
        <div className="brand-title">
          {t('app.brand')}
          <span className="brand-badge">{t('app.badge')}</span>
        </div>
        {/* 窄屏由 CSS 隐藏（.brand-stats），给操作按钮让位 */}
        <div className="brand-stats" style={{ fontSize: '12px', color: 'var(--text-subtle)', marginLeft: '8px' }}>
          {t('app.stats', { chars: totalChars, pages: totalPages })}
        </div>
      </div>

      <div className="header-actions">
        {/* 语言切换：记住选择，刷新保持 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-input)', padding: '3px 6px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <Languages size={13} style={{ color: 'var(--text-subtle)' }} />
          <select
            value={i18n.language}
            onChange={(e) => setAppLanguage(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '12px', padding: '2px 2px', cursor: 'pointer', outline: 'none', maxWidth: '110px' }}
            title={t('header.languageTitle')}
            aria-label={t('header.languageTitle')}
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>
                {l.label}{FULLY_TRANSLATED.has(l.code) ? '' : ' (EN)'}
              </option>
            ))}
          </select>
        </div>

        {/* Preset Templates */}
        <button className="btn btn-secondary" onClick={onOpenPresets} title={t('header.presetsTitle')}>
          <LayoutTemplate size={15} />
          <span>{t('header.presets')}</span>
        </button>

        {/* Shuffle Random Seed */}
        <button className="btn btn-secondary" onClick={onShuffleSeed} title={t('header.shuffleTitle')}>
          <Dice5 size={15} />
          <span>{t('header.shuffle')}</span>
        </button>

        {/* DPI Scale Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-input)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span className="quality-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('header.quality')}</span>
          <select
            value={exportScale}
            onChange={(e) => onSetExportScale(Number(e.target.value))}
            style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '12px', padding: '2px 4px', cursor: 'pointer', outline: 'none' }}
          >
            <option value="1">{t('header.qualityStandard')}</option>
            <option value="2">{t('header.qualityHigh')}</option>
            <option value="3">{t('header.qualityUltra')}</option>
          </select>
        </div>

        {/* Export Dropdown */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            className="btn btn-primary"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            title={isExporting ? t('header.exporting') : t('header.export')}
            aria-label={isExporting ? t('header.exporting') : t('header.export')}
          >
            <Download size={15} />
            <span>{isExporting ? t('header.exporting') : t('header.export')}</span>
            <ChevronDown size={14} />
          </button>

          {showExportMenu && (
            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => { setShowExportMenu(false); onExportCurrentPage('png'); }}
              >
                <ImageIcon size={14} />
                <span>{t('header.exportPng')}</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => { setShowExportMenu(false); onExportCurrentPage('jpeg'); }}
              >
                <ImageIcon size={14} />
                <span>{t('header.exportJpg')}</span>
              </button>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
              <button
                className="dropdown-item"
                onClick={() => { setShowExportMenu(false); onExportAllPdf(); }}
              >
                <FileText size={14} />
                <span>{t('header.exportPdf')}</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => { setShowExportMenu(false); onExportAllZip(); }}
              >
                <Archive size={14} />
                <span>{t('header.exportZip')}</span>
              </button>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
              <button
                className="dropdown-item"
                onClick={() => { setShowExportMenu(false); onPrint(); }}
              >
                <Printer size={14} />
                <span>{t('header.printPage')}</span>
              </button>
            </div>
          )}
        </div>

        {/* 开源仓库入口：纯图标，新标签打开，不打断用户正在编辑的文稿 */}
        <a
          className="btn btn-secondary btn-icon"
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={t('header.githubTitle')}
          aria-label={t('header.githubTitle')}
        >
          <GithubMark size={16} />
        </a>
      </div>
    </header>
  );
};
