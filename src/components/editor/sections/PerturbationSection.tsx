import { useTranslation } from 'react-i18next';
import { RotateCcw, Sparkles } from 'lucide-react';
import { SECTION_DEFAULTS } from '../../../engine/storage';
import type { HandwritingConfig } from '../../../engine/types';

interface PerturbationSectionProps {
  handwriting: HandwritingConfig;
  onHandwritingChange: (handwriting: HandwritingConfig) => void;
}

/** HandwritingTab 的「笔迹扰动」区块，逐字抽出，未改行为。 */
export const PerturbationSection: React.FC<PerturbationSectionProps> = ({
  handwriting,
  onHandwritingChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="control-group">
        <div className="group-title">
          <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} />
            {t('editor.perturbationTitle')}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
            onClick={() => onHandwritingChange({
              ...handwriting,
              fontSizeVariance: SECTION_DEFAULTS.disarray.fontSizeVariance,
              rotationVariance: SECTION_DEFAULTS.disarray.rotationVariance,
              yVariance: SECTION_DEFAULTS.disarray.yVariance,
              xVariance: SECTION_DEFAULTS.disarray.xVariance,
              letterSpacingVariance: SECTION_DEFAULTS.disarray.letterSpacingVariance,
              lineTiltVariance: SECTION_DEFAULTS.disarray.lineTiltVariance,
              strokeWidthVariance: SECTION_DEFAULTS.disarray.strokeWidthVariance,
            })}
            title={t('editor.perturbationResetTitle')}
          >
            <RotateCcw size={11} />
            <span>{t('common.reset')}</span>
          </button>
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.fontSizeVariance')}</span>
            <span className="control-value">±{handwriting.fontSizeVariance} px</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="2.5" 
            step="0.1"
            value={handwriting.fontSizeVariance}
            onChange={(e) => onHandwritingChange({ ...handwriting, fontSizeVariance: Number(e.target.value) })}
          />
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.rotationVariance')}</span>
            <span className="control-value">±{handwriting.rotationVariance}°</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="3.5" 
            step="0.1"
            value={handwriting.rotationVariance}
            onChange={(e) => onHandwritingChange({ ...handwriting, rotationVariance: Number(e.target.value) })}
          />
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.baselineVariance')}</span>
            <span className="control-value">±{handwriting.yVariance} px</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1.8" 
            step="0.1"
            value={handwriting.yVariance}
            onChange={(e) => onHandwritingChange({ ...handwriting, yVariance: Number(e.target.value) })}
          />
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.spacingVariance')}</span>
            <span className="control-value">±{handwriting.letterSpacingVariance} px</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="2.0" 
            step="0.1"
            value={handwriting.letterSpacingVariance}
            onChange={(e) => onHandwritingChange({ ...handwriting, letterSpacingVariance: Number(e.target.value) })}
          />
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.lineTiltVariance')}</span>
            <span className="control-value">±{handwriting.lineTiltVariance}°</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="0.4" 
            step="0.02"
            value={handwriting.lineTiltVariance}
            onChange={(e) => onHandwritingChange({ ...handwriting, lineTiltVariance: Number(e.target.value) })}
          />
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.strokeVariance')}</span>
            <span className="control-value">{Math.round(handwriting.strokeWidthVariance * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="0.6" 
            step="0.05"
            value={handwriting.strokeWidthVariance}
            onChange={(e) => onHandwritingChange({ ...handwriting, strokeWidthVariance: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Real Human Handwriting Physics: Glyph Deformation & Inking (同字异构与墨迹物理仿真) */}
    </>
  );
};
