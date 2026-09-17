import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { HANDWRITING_PERSONAS, applyPersonaToHandwriting } from '../../../engine/presets';
import type { HandwritingConfig } from '../../../engine/types';

interface PersonaSectionProps {
  handwriting: HandwritingConfig;
  onHandwritingChange: (handwriting: HandwritingConfig) => void;
}

/** HandwritingTab 的「书写人格」区块，逐字抽出，未改行为。 */
export const PersonaSection: React.FC<PersonaSectionProps> = ({
  handwriting,
  onHandwritingChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="control-group" style={{ background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-input) 100%)', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
        <div className="group-title" style={{ marginBottom: '8px' }}>
          <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
            <Sparkles size={14} />
            {t('editor.personaTitle')}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {HANDWRITING_PERSONAS.map((persona) => (
            <button
              key={persona.id}
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '8px 10px',
                height: 'auto',
                textAlign: 'start',
                background: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onClick={() => onHandwritingChange(applyPersonaToHandwriting(handwriting, persona))}
              title={t(`personaData.${persona.id}.description`, { defaultValue: persona.description })}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-main)' }}>
                  {t(`personaData.${persona.id}.name`, { defaultValue: persona.name })}
                </span>
                <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  {t(`personaData.${persona.id}.badge`, { defaultValue: persona.badge })}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                {t(`personaData.${persona.id}.description`, { defaultValue: persona.description })}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Font Selection */}
    </>
  );
};
