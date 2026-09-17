import { useTranslation } from 'react-i18next';
import { RotateCcw, Sparkles } from 'lucide-react';
import { SECTION_DEFAULTS } from '../../../engine/storage';
import type { HandwritingConfig } from '../../../engine/types';

interface AnnotationSectionProps {
  handwriting: HandwritingConfig;
  onHandwritingChange: (handwriting: HandwritingConfig) => void;
}

/** HandwritingTab 的「批注」区块，逐字抽出，未改行为。 */
export const AnnotationSection: React.FC<AnnotationSectionProps> = ({
  handwriting,
  onHandwritingChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="control-group">
        <div className="group-title">
          <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} />
            {t('editor.annotationTitle')}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
            onClick={() => onHandwritingChange({
              ...handwriting,
              annotationProbability: SECTION_DEFAULTS.annotation.annotationProbability,
              annotationStyle: SECTION_DEFAULTS.annotation.annotationStyle,
              annotationColor: SECTION_DEFAULTS.annotation.annotationColor,
            })}
            title={t('editor.annotationResetTitle')}
          >
            <RotateCcw size={11} />
            <span>{t('common.reset')}</span>
          </button>
        </div>

        <div className="control-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{t('editor.annotationEnable')}</span>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{t('editor.annotationEnableHint')}</div>
          </div>
          <input 
            type="checkbox" 
            checked={(handwriting.annotationProbability ?? 0) > 0}
            onChange={(e) => onHandwritingChange({ 
              ...handwriting, 
              annotationProbability: e.target.checked ? 0.02 : 0,
              annotationStyle: handwriting.annotationStyle || 'all',
            })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        {(handwriting.annotationProbability ?? 0) > 0 && (
          <>
            <div className="control-item">
              <div className="control-label-row">
                <span>{t('editor.annotationProbability')}</span>
                <span className="control-value">{((handwriting.annotationProbability ?? 0.02) * 100).toFixed(1)}%</span>
              </div>
              <input 
                type="range" 
                min="0.005" 
                max="0.08" 
                step="0.005"
                value={handwriting.annotationProbability ?? 0.02}
                onChange={(e) => onHandwritingChange({ ...handwriting, annotationProbability: Number(e.target.value) })}
              />
            </div>

            <div className="control-item">
              <div className="control-label-row">
                <span>{t('editor.annotationStyle')}</span>
              </div>
              <select 
                value={handwriting.annotationStyle || 'all'} 
                onChange={(e) => onHandwritingChange({ 
                  ...handwriting, 
                  annotationStyle: e.target.value as 'all' | 'underline_wavy' | 'circle' | 'caret_insert' | 'box'
                })}
              >
                <option value="all">{t('editor.anno_all')}</option>
                <option value="underline_wavy">{t('editor.anno_underline_wavy')}</option>
                <option value="circle">{t('editor.anno_circle')}</option>
                <option value="caret_insert">{t('editor.anno_caret_insert')}</option>
                <option value="box">{t('editor.anno_box')}</option>
              </select>
            </div>

            <div className="control-item">
              <div className="control-label-row">
                <span>{t('editor.annotationColor')}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {[
                  { key: 'redPen', color: '#dc2626' },
                  { key: 'sameInk', color: handwriting.inkColor },
                  { key: 'neutralBlue', color: '#2563eb' },
                  { key: 'neonOrange', color: '#ea580c' },
                ].map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => onHandwritingChange({ ...handwriting, annotationColor: c.color })}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      border: (handwriting.annotationColor || handwriting.inkColor) === c.color ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c.color }} />
                    {t(`editor.annoColor_${c.key}`)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Handwritten Disarray & Stroke Roughness (文字位置凌乱度与笔画凌乱度) */}
    </>
  );
};
