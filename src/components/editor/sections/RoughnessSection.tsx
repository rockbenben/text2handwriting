import { useTranslation } from 'react-i18next';
import { Sliders, RotateCcw } from 'lucide-react';
import { SECTION_DEFAULTS } from '../../../engine/storage';
import type { HandwritingConfig } from '../../../engine/types';

interface RoughnessSectionProps {
  handwriting: HandwritingConfig;
  onHandwritingChange: (handwriting: HandwritingConfig) => void;
}

/** HandwritingTab 的「粗糙度」区块，逐字抽出，未改行为。 */
export const RoughnessSection: React.FC<RoughnessSectionProps> = ({
  handwriting,
  onHandwritingChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="control-group">
        <div className="group-title">
          <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sliders size={14} />
            {t('editor.roughnessTitle')}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
            onClick={() => onHandwritingChange({
              ...handwriting,
              positionDisarray: SECTION_DEFAULTS.roughness.positionDisarray,
              strokeRoughness: SECTION_DEFAULTS.roughness.strokeRoughness,
              edgeCrowding: SECTION_DEFAULTS.roughness.edgeCrowding,
            })}
            title={t('editor.roughnessResetTitle')}
          >
            <RotateCcw size={11} />
            <span>{t('common.reset')}</span>
          </button>
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.positionDisarray')}</span>
            <span className="control-value">{handwriting.positionDisarray ?? 0}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="2.0" 
            step="0.1"
            value={handwriting.positionDisarray ?? 0}
            onChange={(e) => onHandwritingChange({ ...handwriting, positionDisarray: Number(e.target.value) })}
          />
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.strokeRoughness')}</span>
            <span className="control-value">{Math.round((handwriting.strokeRoughness ?? 0) * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1.0" 
            step="0.05"
            value={handwriting.strokeRoughness ?? 0}
            onChange={(e) => onHandwritingChange({ ...handwriting, strokeRoughness: Number(e.target.value) })}
          />
        </div>

        <div className="control-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{t('editor.edgeCrowding')}</span>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{t('editor.edgeCrowdingHint')}</div>
          </div>
          <input 
            type="checkbox" 
            checked={!!handwriting.edgeCrowding}
            onChange={(e) => onHandwritingChange({ ...handwriting, edgeCrowding: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        {/* Quick Preset Buttons for Handwriting Realism */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '11px', padding: '4px 8px' }}
            onClick={() => onHandwritingChange({
              ...handwriting,
              positionDisarray: 0,
              strokeRoughness: 0,
              edgeCrowding: false,
              glyphVariance: 0.15,
              inkBleed: 0.2,
              wristArc: 0.08,
              fatigueEffect: false,
              inkSplatterProbability: 0,
              scratchOutProbability: 0,
              annotationProbability: 0,
            })}
          >
            {t('editor.presetNeat')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '11px', padding: '4px 8px' }}
            onClick={() => onHandwritingChange({
              ...handwriting,
              positionDisarray: 0.6,
              strokeRoughness: 0.35,
              edgeCrowding: true,
              glyphVariance: 0.45,
              inkBleed: 0.35,
              wristArc: 0.35,
              fatigueEffect: true,
              inkSplatterProbability: 0.006,
              scratchOutProbability: 0.008,
              scratchOutStyle: 'all',
              annotationProbability: 0.015,
              annotationStyle: 'underline_wavy',
            })}
          >
            {t('editor.presetNatural')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '11px', padding: '4px 8px', borderColor: '#f59e0b' }}
            onClick={() => onHandwritingChange({
              ...handwriting,
              positionDisarray: 1.3,
              strokeRoughness: 0.65,
              edgeCrowding: true,
              glyphVariance: 0.7,
              inkBleed: 0.5,
              wristArc: 0.55,
              fatigueEffect: true,
              inkSplatterProbability: 0.012,
              scratchOutProbability: 0.018,
              scratchOutStyle: 'all',
              annotationProbability: 0.035,
              annotationStyle: 'all',
              annotationColor: '#dc2626',
            })}
          >
            {t('editor.presetDraft')}
          </button>
        </div>
      </div>
    </>
  );
};
