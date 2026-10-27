import { useTranslation } from 'react-i18next';
import { Upload, RotateCcw, Plus, Search, RefreshCw, CheckCircle2, Edit3 } from 'lucide-react';
import { SECTION_DEFAULTS } from '../../../engine/storage';
import type { HandwritingConfig } from '../../../engine/types';
import type { FontOption } from '../../../engine/fontLoader';
import type { RefObject } from 'react';

interface FontSectionProps {
  handwriting: HandwritingConfig;
  onHandwritingChange: (handwriting: HandwritingConfig) => void;
  customFontName: string;
  setCustomFontName: (v: string) => void;
  fontSearch: string;
  setFontSearch: (v: string) => void;
  isScanningFonts: boolean;
  scanNotice: string | null;
  fontInputRef: RefObject<HTMLInputElement | null>;
  handleScanFonts: () => void;
  handleAddCustomFontName: () => void;
  handleFontFileUpload: (file: File) => void;
  filteredFonts: FontOption[];
}

/** HandwritingTab 的「字体」区块，逐字抽出，未改行为。 */
export const FontSection: React.FC<FontSectionProps> = ({
  handwriting,
  onHandwritingChange,
  customFontName,
  setCustomFontName,
  fontSearch,
  setFontSearch,
  isScanningFonts,
  scanNotice,
  fontInputRef,
  handleScanFonts,
  handleAddCustomFontName,
  handleFontFileUpload,
  filteredFonts,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="control-group">
        <div className="group-title">
          <span>{t('editor.fontTitle')}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleScanFonts}
              disabled={isScanningFonts}
              title={t('editor.scanFontsTitle')}
            >
              <RefreshCw size={12} className={isScanningFonts ? 'animate-spin' : ''} />
              <span>{isScanningFonts ? t('editor.scanning') : t('editor.scanFonts')}</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => fontInputRef.current?.click()}
              title={t('editor.importFontTitle')}
            >
              <Upload size={12} />
              <span>{t('editor.importFile')}</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onHandwritingChange({ ...handwriting, fontFamily: SECTION_DEFAULTS.font.fontFamily })}
              title={t('editor.resetFontTitle')}
            >
              <RotateCcw size={12} />
              <span>{t('common.reset')}</span>
            </button>
          </div>
          <input 
            type="file" 
            ref={fontInputRef} 
            style={{ display: 'none' }} 
            accept=".ttf,.otf,.woff,.woff2"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFontFileUpload(e.target.files[0]);
              }
              e.target.value = '';
            }}
          />
        </div>

        {/* Scan Feedback Banner */}
        {scanNotice && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            background: 'rgba(16, 185, 129, 0.12)', 
            border: '1px solid rgba(16, 185, 129, 0.3)', 
            borderRadius: '6px', 
            padding: '6px 10px', 
            fontSize: '12px', 
            color: '#34d399' 
          }}>
            <CheckCircle2 size={14} />
            <span>{scanNotice}</span>
          </div>
        )}

        {/* Font Search Filter Input */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'var(--bg-input)', 
          borderRadius: '6px', 
          border: '1px solid var(--border-color)', 
          padding: '2px 8px', 
          gap: '6px' 
        }}>
          <Search size={13} color="#94a3b8" />
          <input 
            type="text" 
            placeholder={t('editor.fontSearchPlaceholder')}
            value={fontSearch}
            onChange={(e) => setFontSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '5px 0', fontSize: '12px' }}
          />
          {fontSearch && (
            <button 
              onClick={() => setFontSearch('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Font dropdown grouped by category */}
        <div className="control-item">
          {filteredFonts.find(f => f.family === handwriting.fontFamily)?.sessionOnly && (
            <div style={{ fontSize: '11px', lineHeight: 1.4, color: '#fbbf24' }}>
              {t('editor.importedFontSessionHint')}
            </div>
          )}
          {(() => {
            const getFontLabel = (f: FontOption) => {
              const cleanName = f.name.replace(/^本机:\s*/, '');
              const translated = f.nameKey ? t(f.nameKey, { defaultValue: cleanName }) : cleanName;
              if (f.id.startsWith('probe_')) {
                return t('editor.localFontPrefix', { name: translated });
              }
              return translated;
            };

            const bundledOffline = filteredFonts.filter(f => f.category === 'bundled' && f.offline);
            const bundledOnline = filteredFonts.filter(f => f.category === 'bundled' && !f.offline);
            const systemFonts = filteredFonts.filter(f => f.category === 'system');

            return (
              <select 
                value={handwriting.fontFamily} 
                onChange={(e) => onHandwritingChange({ ...handwriting, fontFamily: e.target.value })}
              >
                {bundledOffline.length > 0 && (
                  <optgroup label={t('editor.groupBundledOffline', { count: bundledOffline.length })}>
                    {bundledOffline.map(f => (
                      <option key={f.id} value={f.family}>{getFontLabel(f)}</option>
                    ))}
                  </optgroup>
                )}
                {bundledOnline.length > 0 && (
                  <optgroup label={t('editor.groupBundledOnline', { count: bundledOnline.length })}>
                    {bundledOnline.map(f => (
                      <option key={f.id} value={f.family}>{getFontLabel(f)}</option>
                    ))}
                  </optgroup>
                )}
                {systemFonts.length > 0 && (
                  <optgroup label={t('editor.groupSystem', { count: systemFonts.length })}>
                    {systemFonts.map(f => (
                      <option key={f.id} value={f.family}>{getFontLabel(f)}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            );
          })()}
        </div>

        {/* Custom System Font Name Input */}
        <div className="control-item" style={{ marginTop: '2px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input 
              type="text"
              placeholder={t('editor.customFontPlaceholder')}
              value={customFontName}
              onChange={(e) => setCustomFontName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustomFontName();
              }}
              style={{ fontSize: '12px', padding: '6px 8px' }}
            />
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleAddCustomFontName}
              disabled={!customFontName.trim()}
              title={t('editor.applyFontTitle')}
              style={{ whiteSpace: 'nowrap', padding: '6px 10px' }}
            >
              <Plus size={13} />
              <span>{t('common.apply')}</span>
            </button>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
            {t('editor.customFontHint')}
          </div>
        </div>

        {/* 用本人真实笔迹生成专属字体的引导（对标 Calligraphr 工作流） */}
        <div style={{
          marginTop: '8px',
          padding: '8px 10px',
          borderRadius: '6px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          background: 'rgba(56, 189, 248, 0.07)',
          fontSize: '11px',
          lineHeight: 1.5,
          color: 'var(--text-muted)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7dd3fc', fontWeight: 600, marginBottom: '3px' }}>
            <Edit3 size={12} />
            {t('editor.fontGuideTitle')}
          </div>
          {t('editor.fontGuideBody')}
          {' '}
          <a
            href="https://www.calligraphr.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#60a5fa', whiteSpace: 'nowrap' }}
          >
            {t('editor.fontGuideLink')}
          </a>
        </div>
      </div>

      {/* Pen Type & Ink */}
    </>
  );
};
