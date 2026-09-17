import { useTranslation } from 'react-i18next';
import { RotateCcw, Sparkles } from 'lucide-react';
import { SECTION_DEFAULTS } from '../../../engine/storage';
import type { HandwritingConfig } from '../../../engine/types';

interface PhysicsSectionProps {
  handwriting: HandwritingConfig;
  onHandwritingChange: (handwriting: HandwritingConfig) => void;
}

/** HandwritingTab 的「物理与墨迹」区块，逐字抽出，未改行为。 */
export const PhysicsSection: React.FC<PhysicsSectionProps> = ({
  handwriting,
  onHandwritingChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="control-group">
        <div className="group-title">
          <span style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} />
            {t('editor.physicsTitle')}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
            onClick={() => onHandwritingChange({
              ...handwriting,
              glyphVariance: SECTION_DEFAULTS.realism.glyphVariance,
              inkBleed: SECTION_DEFAULTS.realism.inkBleed,
              wristArc: SECTION_DEFAULTS.realism.wristArc,
              fatigueEffect: SECTION_DEFAULTS.realism.fatigueEffect,
              inkSplatterProbability: SECTION_DEFAULTS.realism.inkSplatterProbability,
            })}
            title={t('editor.physicsResetTitle')}
          >
            <RotateCcw size={11} />
            <span>{t('common.reset')}</span>
          </button>
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.glyphVariance')}</span>
            <span className="control-value">{Math.round((handwriting.glyphVariance ?? 0.4) * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1.0" 
            step="0.05"
            value={handwriting.glyphVariance ?? 0.4}
            onChange={(e) => onHandwritingChange({ ...handwriting, glyphVariance: Number(e.target.value) })}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
            {t('editor.glyphVarianceHint')}
          </div>
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.inkBleed')}</span>
            <span className="control-value">{Math.round((handwriting.inkBleed ?? 0.35) * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1.0" 
            step="0.05"
            value={handwriting.inkBleed ?? 0.35}
            onChange={(e) => onHandwritingChange({ ...handwriting, inkBleed: Number(e.target.value) })}
          />
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.wristArc')}</span>
            <span className="control-value">{Math.round((handwriting.wristArc ?? 0.3) * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1.0" 
            step="0.05"
            value={handwriting.wristArc ?? 0.3}
            onChange={(e) => onHandwritingChange({ ...handwriting, wristArc: Number(e.target.value) })}
          />
        </div>

        <div className="control-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{t('editor.fatigueLabel')}</span>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{t('editor.fatigueHint')}</div>
          </div>
          <input 
            type="checkbox" 
            checked={handwriting.fatigueEffect !== false}
            onChange={(e) => onHandwritingChange({ ...handwriting, fatigueEffect: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        <div className="control-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{t('editor.splatterLabel')}</span>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{t('editor.splatterHint')}</div>
          </div>
          <input 
            type="checkbox" 
            checked={(handwriting.inkSplatterProbability ?? 0) > 0}
            onChange={(e) => onHandwritingChange({ 
              ...handwriting, 
              inkSplatterProbability: e.target.checked ? 0.008 : 0 
            })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Real Human Writing Details: Scratch-out simulation (真实错字涂改) */}
    </>
  );
};
