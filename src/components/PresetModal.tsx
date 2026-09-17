import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { PRESET_TEMPLATES, type PresetTemplate } from '../engine/presets';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetTemplate) => void;
  activePresetId?: string;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  activePresetId,
}) => {
  const { t } = useTranslation();
  // Esc 关闭 + 打开时把焦点移入弹窗，关闭后回到触发按钮附近。
  // 之前弹窗只能点遮罩或点 X 关闭，纯键盘用户完全无法操作。
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('preset.title')}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>{t('preset.title')}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('preset.subtitle')}</span>
          </div>
          <button
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={onClose}
            title={t('preset.closeTitle')}
            aria-label={t('preset.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="preset-grid">
            {PRESET_TEMPLATES.map((preset) => {
              const isActive = activePresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`preset-card ${isActive ? 'active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectPreset(preset);
                      onClose();
                    }
                  }}
                  aria-label={t('preset.applyAria', { name: t(`presetData.${preset.id}.name`, { defaultValue: preset.name }) })}
                  style={{
                    borderColor: isActive ? 'var(--primary)' : undefined,
                    background: isActive ? '#1e2d42' : undefined,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>
                      {t(`presetData.${preset.id}.name`, { defaultValue: preset.name })}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#93c5fd'
                      }}
                    >
                      {t(`presetData.${preset.id}.badge`, { defaultValue: preset.badge })}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', flex: 1 }}>
                    {t(`presetData.${preset.id}.description`, { defaultValue: preset.description })}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-subtle)', marginTop: '6px' }}>
                    <span>
                      {t('preset.paperLabel')}: {t(`paperType.${preset.paper.type}`, { defaultValue: t('paperType.other') })}
                    </span>
                    <span>{t('preset.fontSizeLabel')}: {preset.handwriting.fontSize}px</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
