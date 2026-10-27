import { useTranslation } from 'react-i18next';
import { Upload, RotateCcw } from 'lucide-react';
import { getPaperDimensions } from '../../engine/paper';
import { SECTION_DEFAULTS, isCustomBackgroundTooLarge } from '../../engine/storage';
import type { PaperType, PaperSize } from '../../engine/types';
import type { RefObject } from 'react';
import type { PaperConfig, HandwritingConfig } from '../../engine/types';

interface PaperTabProps {
  paper: PaperConfig;
  onPaperChange: (paper: PaperConfig) => void;
  handwriting: HandwritingConfig;
  onHandwritingChange: (handwriting: HandwritingConfig) => void;
  bgImageInputRef: RefObject<HTMLInputElement | null>;
  handleBgImageUpload: (file: File) => void;
}

/** 由 EditorPanel 的「paper」tab 逐字抽出，未改行为。 */
export const PaperTab: React.FC<PaperTabProps> = ({
  paper,
  onPaperChange,
  handwriting,
  onHandwritingChange,
  bgImageInputRef,
  handleBgImageUpload,
}) => {
  const { t } = useTranslation();

  return (
    <div className="tab-content">
      <div className="control-group">
        <div className="group-title">
          <span>{t('editor.paperStyleTitle')}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
            onClick={() => onPaperChange({
              ...paper,
              type: SECTION_DEFAULTS.paperStyle.type,
              size: SECTION_DEFAULTS.paperStyle.size,
              width: SECTION_DEFAULTS.paperStyle.width,
              height: SECTION_DEFAULTS.paperStyle.height,
            })}
            title={t('editor.paperStyleResetTitle')}
          >
            <RotateCcw size={11} />
            <span>{t('common.reset')}</span>
          </button>
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.paperTypeLabel')}</span>
          </div>
          <select
            value={paper.type}
            onChange={(e) => onPaperChange({ ...paper, type: e.target.value as PaperType })}
          >
            <option value="ruled">{t('editor.ptype_ruled')}</option>
            <option value="grid">{t('editor.ptype_grid')}</option>
            <option value="blank">{t('editor.ptype_blank')}</option>
            <option value="english">{t('editor.ptype_english')}</option>
            <option value="kraft">{t('editor.ptype_kraft')}</option>
            <option value="dot">{t('editor.ptype_dot')}</option>
            <option value="custom">{t('editor.ptype_custom')}</option>
          </select>
        </div>

        {paper.type === 'custom' && (
          <div className="control-item">
            <button
              className="btn btn-secondary"
              onClick={() => bgImageInputRef.current?.click()}
              style={{ width: '100%' }}
            >
              <Upload size={14} />
              <span>{t('editor.uploadPaperPhoto')}</span>
            </button>
            <input 
              type="file" 
              ref={bgImageInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleBgImageUpload(e.target.files[0]);
                }
                e.target.value = '';
              }}
            />
            {isCustomBackgroundTooLarge(paper) && (
              <div style={{ fontSize: '11px', lineHeight: 1.5, color: '#fbbf24' }}>
                {t('editor.customBgLargeHint')}
              </div>
            )}
          </div>
        )}

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.paperSizeLabel')}</span>
          </div>
          <select 
            value={paper.size} 
            onChange={(e) => {
              const newSize = e.target.value as PaperSize;
              if (newSize === 'custom') {
                onPaperChange({ ...paper, size: 'custom' });
              } else {
                const dims = getPaperDimensions(newSize);
                onPaperChange({
                  ...paper,
                  size: newSize,
                  width: dims.width,
                  height: dims.height,
                });
              }
            }}
          >
            <option value="a4">{t('editor.size_a4')}</option>
            <option value="b5">{t('editor.size_b5')}</option>
            <option value="a5">{t('editor.size_a5')}</option>
            {paper.size === 'custom' && (
              <option value="custom">{t('editor.size_custom')}</option>
            )}
          </select>
        </div>
      </div>

      <div className="control-group">
        <div className="group-title">
          <span>{t('editor.gridLinesTitle')}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
            onClick={() => {
              onPaperChange({
                ...paper,
                lineSpacing: SECTION_DEFAULTS.paperLines.lineSpacing,
                showLineGuide: SECTION_DEFAULTS.paperLines.showLineGuide,
                lineColor: SECTION_DEFAULTS.paperLines.lineColor,
                showMarginLine: SECTION_DEFAULTS.paperLines.showMarginLine,
                marginLineColor: SECTION_DEFAULTS.paperLines.marginLineColor,
              });
              onHandwritingChange({
                ...handwriting,
                alignToLines: true,
              });
            }}
            title={t('editor.gridLinesResetTitle')}
          >
            <RotateCcw size={11} />
            <span>{t('common.reset')}</span>
          </button>
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.paperLineSpacing')}</span>
            <span className="control-value">{paper.lineSpacing} px</span>
          </div>
          <input 
            type="range" 
            min="35" 
            max="85" 
            value={paper.lineSpacing}
            onChange={(e) => onPaperChange({ ...paper, lineSpacing: Number(e.target.value) })}
          />
        </div>

        {paper.type === 'grid' && (
          <div className="control-item">
            <div className="control-label-row">
              <span>{t('editor.gridCols')}</span>
              <span className="control-value">{t('editor.colsUnit', { n: paper.gridCols || 20 })}</span>
            </div>
            <input 
              type="range" 
              min="14" 
              max="28" 
              value={paper.gridCols || 20}
              onChange={(e) => onPaperChange({ ...paper, gridCols: Number(e.target.value) })}
            />
          </div>
        )}

        <div className="control-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px' }}>{t('editor.showLineGuide')}</span>
          <input 
            type="checkbox" 
            checked={paper.showLineGuide !== false}
            onChange={(e) => onPaperChange({ ...paper, showLineGuide: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        <div className="control-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px' }}>{t('editor.alignBaseline')}</span>
          <input 
            type="checkbox" 
            checked={handwriting.alignToLines}
            onChange={(e) => onHandwritingChange({ ...handwriting, alignToLines: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Margins */}
      <div className="control-group">
        <div className="group-title">
          <span>{t('editor.marginsTitle')}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '2px 6px' }}
              onClick={() => onPaperChange({
                ...paper,
                marginLeft: 110,
                marginRight: 90,
                marginTop: 140,
                marginBottom: 130,
              })}
              title={t('editor.marginStandardTitle')}
            >
              {t('editor.marginStandard')}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '2px 6px' }}
              onClick={() => onPaperChange({
                ...paper,
                marginLeft: 160,
                marginRight: 80,
                marginTop: 140,
                marginBottom: 130,
              })}
              title={t('editor.marginWideLeftTitle')}
            >
              {t('editor.marginWideLeft')}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '2px 6px' }}
              onClick={() => onPaperChange({
                ...paper,
                marginLeft: 50,
                marginRight: 50,
                marginTop: 70,
                marginBottom: 70,
              })}
              title={t('editor.marginFullBleedTitle')}
            >
              {t('editor.marginFullBleed')}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '2px 6px' }}
              onClick={() => onPaperChange({
                ...paper,
                marginTop: SECTION_DEFAULTS.paperMargins.marginTop,
                marginBottom: SECTION_DEFAULTS.paperMargins.marginBottom,
                marginLeft: SECTION_DEFAULTS.paperMargins.marginLeft,
                marginRight: SECTION_DEFAULTS.paperMargins.marginRight,
              })}
              title={t('editor.marginsResetTitle')}
            >
              <RotateCcw size={11} />
              <span>{t('common.reset')}</span>
            </button>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(56, 189, 248, 0.08)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.18)', marginBottom: '8px', lineHeight: '1.4' }}>
          {t('editor.marginsInfo')}
        </div>

        {/* Left margin */}
        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.marginLeft')}</span>
            <span className="control-value">{paper.marginLeft} px</span>
          </div>
          <input 
            type="range" 
            min="20" 
            max="350" 
            value={paper.marginLeft}
            onChange={(e) => onPaperChange({ ...paper, marginLeft: Number(e.target.value) })}
          />
        </div>

        {/* Right margin */}
        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.marginRight')}</span>
            <span className="control-value">{paper.marginRight} px</span>
          </div>
          <input 
            type="range" 
            min="20" 
            max="350" 
            value={paper.marginRight}
            onChange={(e) => onPaperChange({ ...paper, marginRight: Number(e.target.value) })}
          />
        </div>

        {/* Top margin */}
        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.marginTop')}</span>
            <span className="control-value">{paper.marginTop} px</span>
          </div>
          <input 
            type="range" 
            min="30" 
            max="350" 
            value={paper.marginTop}
            onChange={(e) => onPaperChange({ ...paper, marginTop: Number(e.target.value) })}
          />
        </div>

        {/* Bottom margin */}
        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.marginBottom')}</span>
            <span className="control-value">{paper.marginBottom} px</span>
          </div>
          <input 
            type="range" 
            min="30" 
            max="350" 
            value={paper.marginBottom}
            onChange={(e) => onPaperChange({ ...paper, marginBottom: Number(e.target.value) })}
          />
        </div>

        {/* Vertical red margin line toggle for ruled paper */}
        {paper.type === 'ruled' && (
          <div className="control-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{t('editor.showMarginLine')}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{t('editor.marginLineHint')}</div>
            </div>
            <input 
              type="checkbox" 
              checked={paper.showMarginLine !== false}
              onChange={(e) => onPaperChange({ ...paper, showMarginLine: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
