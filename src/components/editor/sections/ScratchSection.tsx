import { useTranslation } from 'react-i18next';
import { RotateCcw, Edit3 } from 'lucide-react';
import { SECTION_DEFAULTS } from '../../../engine/storage';
import type { ScratchOutStyleOption, CorrectionPositionOption } from '../../../engine/types';
import type { HandwritingConfig } from '../../../engine/types';

interface ScratchSectionProps {
  handwriting: HandwritingConfig;
  onHandwritingChange: (handwriting: HandwritingConfig) => void;
}

/** HandwritingTab 的「划改」区块，逐字抽出，未改行为。 */
export const ScratchSection: React.FC<ScratchSectionProps> = ({
  handwriting,
  onHandwritingChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="control-group">
        <div className="group-title">
          <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Edit3 size={14} />
            {t('editor.scratchTitle')}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
            onClick={() => onHandwritingChange({
              ...handwriting,
              scratchOutProbability: SECTION_DEFAULTS.scratch.scratchOutProbability,
              scratchOutStyle: SECTION_DEFAULTS.scratch.scratchOutStyle,
              scratchOutShowCorrection: SECTION_DEFAULTS.scratch.scratchOutShowCorrection,
              scratchOutUseCaret: SECTION_DEFAULTS.scratch.scratchOutUseCaret,
              scratchOutCorrectionColor: SECTION_DEFAULTS.scratch.scratchOutCorrectionColor,
              scratchOutCorrectionPosition: SECTION_DEFAULTS.scratch.scratchOutCorrectionPosition,
              scratchOutSmartAvoidance: SECTION_DEFAULTS.scratch.scratchOutSmartAvoidance,
            })}
            title={t('editor.scratchResetTitle')}
          >
            <RotateCcw size={11} />
            <span>{t('common.reset')}</span>
          </button>
        </div>

        <div className="control-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{t('editor.scratchEnable')}</span>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{t('editor.scratchEnableHint')}</div>
          </div>
          <input 
            type="checkbox" 
            checked={(handwriting.scratchOutProbability ?? 0) > 0}
            onChange={(e) => onHandwritingChange({ 
              ...handwriting, 
              scratchOutProbability: e.target.checked ? 0.015 : 0,
              scratchOutStyle: handwriting.scratchOutStyle || 'all',
            })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        {(handwriting.scratchOutProbability ?? 0) > 0 && (
          <>
            <div className="control-item">
              <div className="control-label-row">
                <span>{t('editor.scratchProbability')}</span>
                <span className="control-value">{((handwriting.scratchOutProbability ?? 0.015) * 100).toFixed(1)}%</span>
              </div>
              <input 
                type="range" 
                min="0.002" 
                max="0.05" 
                step="0.002"
                value={handwriting.scratchOutProbability ?? 0.015}
                onChange={(e) => onHandwritingChange({ ...handwriting, scratchOutProbability: Number(e.target.value) })}
              />
            </div>

            <div className="control-item">
              <div className="control-label-row">
                <span>{t('editor.scratchStyle')}</span>
              </div>
              <select 
                value={handwriting.scratchOutStyle || 'all'} 
                onChange={(e) => onHandwritingChange({ 
                  ...handwriting, 
                  scratchOutStyle: e.target.value as ScratchOutStyleOption 
                })}
              >
                <option value="all">{t('editor.scratch_all')}</option>
                <optgroup label={t('editor.scratchGroupCommon')}>
                  <option value="slash">{t('editor.scratch_slash')}</option>
                  <option value="backslash">{t('editor.scratch_backslash')}</option>
                  <option value="cross_x">{t('editor.scratch_cross_x')}</option>
                  <option value="single_line">{t('editor.scratch_single_line')}</option>
                  <option value="triple_line">{t('editor.scratch_triple_line')}</option>
                </optgroup>
                <optgroup label={t('editor.scratchGroupExam')}>
                  <option value="double_line">{t('editor.scratch_double_line')}</option>
                  <option value="boxed_slash">{t('editor.scratch_boxed_slash')}</option>
                  <option value="circled_slash">{t('editor.scratch_circled_slash')}</option>
                </optgroup>
                <optgroup label={t('editor.scratchGroupHeavy')}>
                  <option value="spiral_coil">{t('editor.scratch_spiral_coil')}</option>
                  <option value="scribble">{t('editor.scratch_scribble')}</option>
                  <option value="heavy_blot">{t('editor.scratch_heavy_blot')}</option>
                  <option value="mesh_patch">{t('editor.scratch_mesh_patch')}</option>
                  <option value="wavy">{t('editor.scratch_wavy')}</option>
                </optgroup>
              </select>
            </div>

            {/* Correction character placed above strikethrough (错字改写订正) */}
            <div className="control-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '10px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#fca5a5' }}>{t('editor.correctionEnable')}</span>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('editor.correctionHint')}</div>
              </div>
              <input 
                type="checkbox" 
                checked={handwriting.scratchOutShowCorrection !== false}
                onChange={(e) => onHandwritingChange({ 
                  ...handwriting, 
                  scratchOutShowCorrection: e.target.checked 
                })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {handwriting.scratchOutShowCorrection !== false && (
              <>
                <div className="control-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>{t('editor.caretLabel')}</span>
                    <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{t('editor.caretHint')}</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={handwriting.scratchOutUseCaret !== false}
                    onChange={(e) => onHandwritingChange({ 
                      ...handwriting, 
                      scratchOutUseCaret: e.target.checked 
                    })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </div>

                {/* Correction Placement Direction */}
                <div className="control-item">
                  <div className="control-label-row">
                    <span>{t('editor.correctionPosition')}</span>
                    <span className="control-value" style={{ fontSize: '11px', color: '#93c5fd' }}>
                      {handwriting.scratchOutCorrectionPosition === 'top'
                        ? t('editor.posTop')
                        : handwriting.scratchOutCorrectionPosition === 'random'
                        ? t('editor.posRandom')
                        : t('editor.posTopRight')}
                    </span>
                  </div>
                  <select
                    value={handwriting.scratchOutCorrectionPosition || 'top_right'}
                    onChange={(e) => onHandwritingChange({
                      ...handwriting,
                      scratchOutCorrectionPosition: e.target.value as CorrectionPositionOption
                    })}
                  >
                    <option value="top_right">{t('editor.posTopRightOption')}</option>
                    <option value="random">{t('editor.posRandomOption')}</option>
                    <option value="top">{t('editor.posTopOption')}</option>
                  </select>
                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                    {handwriting.scratchOutCorrectionPosition === 'top'
                      ? t('editor.posTopDesc')
                      : handwriting.scratchOutCorrectionPosition === 'random'
                      ? t('editor.posRandomDesc')
                      : t('editor.posTopRightDesc')}
                  </div>
                </div>

                {/* Smart Avoidance for First Line and Margin Edges */}
                <div className="control-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>{t('editor.avoidanceLabel')}</span>
                    <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{t('editor.avoidanceHint')}</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={handwriting.scratchOutSmartAvoidance !== false}
                    onChange={(e) => onHandwritingChange({ 
                      ...handwriting, 
                      scratchOutSmartAvoidance: e.target.checked 
                    })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </div>

                <div className="control-item">
                  <div className="control-label-row">
                    <span>{t('editor.correctionColor')}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {[
                      { key: 'sameInk', color: handwriting.inkColor },
                      { key: 'redPen', color: '#dc2626' },
                      { key: 'deepBlue', color: '#1d4ed8' },
                    ].map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => onHandwritingChange({ ...handwriting, scratchOutCorrectionColor: c.color })}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          border: (handwriting.scratchOutCorrectionColor || handwriting.inkColor) === c.color ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c.color }} />
                        {t(`editor.corrColor_${c.key}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Real Document Markup: Annotations simulation (真实文件手写圈画与批注) */}
    </>
  );
};
