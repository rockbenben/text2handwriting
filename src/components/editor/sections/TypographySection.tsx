import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { getRecommendedFontSize } from '../../../engine/paper';
import { SECTION_DEFAULTS } from '../../../engine/storage';
import type { HandwritingConfig, PaperConfig } from '../../../engine/types';

interface TypographySectionProps {
  handwriting: HandwritingConfig;
  onHandwritingChange: (handwriting: HandwritingConfig) => void;
  paper: PaperConfig;
}

/** HandwritingTab 的「排版」区块，逐字抽出，未改行为。 */
export const TypographySection: React.FC<TypographySectionProps> = ({
  handwriting,
  onHandwritingChange,
  paper,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="control-group">
        <div className="group-title">
          <span>{t('editor.typographyTitle')}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
            onClick={() => onHandwritingChange({
              ...handwriting,
              fontSize: SECTION_DEFAULTS.typography.fontSize,
              lineHeight: SECTION_DEFAULTS.typography.lineHeight,
              letterSpacing: SECTION_DEFAULTS.typography.letterSpacing,
            })}
            title={t('editor.typographyResetTitle')}
          >
            <RotateCcw size={11} />
            <span>{t('common.reset')}</span>
          </button>
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{t('editor.fontSizeLabel')}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '10px', padding: '1px 6px', height: '20px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                onClick={() => {
                  const recommended = getRecommendedFontSize(paper);
                  onHandwritingChange({ ...handwriting, fontSize: recommended });
                }}
                title={t('editor.fontSizeRecommendTitle', {
                  paperKind: paper.type === 'grid' ? t('editor.paperKindGrid') : t('editor.paperKindRuled'),
                  px: getRecommendedFontSize(paper),
                })}
              >
                {t('editor.fontSizeRecommend', { px: getRecommendedFontSize(paper) })}
              </button>
            </span>
            <span className="control-value">{handwriting.fontSize} px</span>
          </div>
          <input
            type="range"
            min="18"
            max="64"
            value={handwriting.fontSize}
            onChange={(e) => onHandwritingChange({ ...handwriting, fontSize: Number(e.target.value) })}
          />
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.letterSpacingLabel')}</span>
            <span className="control-value">{handwriting.letterSpacing} px</span>
          </div>
          <input 
            type="range" 
            min="-2" 
            max="16" 
            value={handwriting.letterSpacing}
            onChange={(e) => onHandwritingChange({ ...handwriting, letterSpacing: Number(e.target.value) })}
          />
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.lineHeightLabel')}</span>
            <span className="control-value">{handwriting.lineHeight} px</span>
          </div>
          <input 
            type="range" 
            min="35" 
            max="100" 
            value={handwriting.lineHeight}
            onChange={(e) => onHandwritingChange({ ...handwriting, lineHeight: Number(e.target.value) })}
          />
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.indentSpacesLabel')}</span>
            <span className="control-value">{t('editor.cellsUnit', { n: handwriting.paragraphIndent })}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="4" 
            value={handwriting.paragraphIndent}
            onChange={(e) => onHandwritingChange({ ...handwriting, paragraphIndent: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* AI Perturbation Controls (手写真实感扰动) */}
    </>
  );
};
