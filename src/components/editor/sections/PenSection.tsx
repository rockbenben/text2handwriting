import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { SECTION_DEFAULTS } from '../../../engine/storage';
import type { PenType } from '../../../engine/types';
import type { HandwritingConfig } from '../../../engine/types';

const INK_PRESETS = [
  { key: 'gelBlack', color: '#1e293b' },
  { key: 'pureBlack', color: '#09090b' },
  { key: 'blueInk', color: '#1d4ed8' },
  { key: 'blueBlack', color: '#1e3a5f' },
  { key: 'pencilGray', color: '#475569' },
  { key: 'gradingRed', color: '#dc2626' },
];

interface PenSectionProps {
  handwriting: HandwritingConfig;
  onHandwritingChange: (handwriting: HandwritingConfig) => void;
}

/** HandwritingTab 的「笔型与墨色」区块，逐字抽出，未改行为。 */
export const PenSection: React.FC<PenSectionProps> = ({
  handwriting,
  onHandwritingChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="control-group">
        <div className="group-title">
          <span>{t('editor.penTitle')}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
            onClick={() => onHandwritingChange({ 
              ...handwriting, 
              inkColor: SECTION_DEFAULTS.ink.inkColor,
              penType: SECTION_DEFAULTS.ink.penType 
            })}
            title={t('editor.penResetTitle')}
          >
            <RotateCcw size={11} />
            <span>{t('common.reset')}</span>
          </button>
        </div>

        {/* Pen Type Selector Chips */}
        <div className="control-item">
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{t('editor.penSimLabel')}</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {[
              { id: 'gel', icon: '🖊️' },
              { id: 'fountain', icon: '✒️' },
              { id: 'pencil', icon: '✏️' },
              { id: 'ballpoint', icon: '🖋️' },
            ].map((pen) => {
              const isActive = (handwriting.penType ?? 'gel') === pen.id;
              return (
                <button
                  key={pen.id}
                  type="button"
                  onClick={() => onHandwritingChange({ ...handwriting, penType: pen.id as PenType })}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '3px',
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    background: isActive ? 'rgba(59, 130, 246, 0.16)' : 'var(--bg-input)',
                    color: isActive ? '#60a5fa' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={t(`editor.pen_${pen.id}_desc`)}
                >
                  <span style={{ fontSize: '15px' }}>{pen.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: isActive ? 600 : 400 }}>{t(`editor.pen_${pen.id}_name`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="control-item" style={{ marginTop: '4px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{t('editor.inkColorLabel')}</label>
          <div className="color-palette">
            {INK_PRESETS.map((p) => (
              <div
                key={p.color}
                className={`color-swatch ${handwriting.inkColor === p.color ? 'active' : ''}`}
                style={{ backgroundColor: p.color }}
                role="button"
                tabIndex={0}
                aria-pressed={handwriting.inkColor === p.color}
                onClick={() => onHandwritingChange({ ...handwriting, inkColor: p.color })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onHandwritingChange({ ...handwriting, inkColor: p.color });
                  }
                }}
                title={t(`editor.ink_${p.key}`)}
              />
            ))}
            <input 
              type="color" 
              value={handwriting.inkColor}
              onChange={(e) => onHandwritingChange({ ...handwriting, inkColor: e.target.value })}
              style={{ width: '30px', height: '30px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }}
              title={t('editor.customPalette')}
            />
          </div>
        </div>
      </div>

      {/* Handwriting Dimension Sliders */}
    </>
  );
};
