import { useTranslation } from 'react-i18next';
import { Camera, Upload, RotateCcw, Sparkles, ImageIcon, Maximize2 } from 'lucide-react';
import { HD_PAPER_PRESETS, calculatePaperDimensionsFromImage } from '../../engine/paper';
import { SECTION_DEFAULTS, isCustomBackgroundTooLarge } from '../../engine/storage';
import type { RefObject } from 'react';
import type { PaperConfig } from '../../engine/types';

interface PhotoTabProps {
  paper: PaperConfig;
  onPaperChange: (paper: PaperConfig) => void;
  bgImageInputRef: RefObject<HTMLInputElement | null>;
  handleBgImageUpload: (file: File) => void;
}

/** 由 EditorPanel 的「photo」tab 逐字抽出，未改行为。 */
export const PhotoTab: React.FC<PhotoTabProps> = ({
  paper,
  onPaperChange,
  bgImageInputRef,
  handleBgImageUpload,
}) => {
  const { t } = useTranslation();

  return (
    <div className="tab-content">
      {/* 1. Custom Background Image Upload & Controls */}
      <div className="control-group">
        <div className="group-title">
          <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ImageIcon size={14} />
            {t('editor.customBgTitle')}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
            onClick={() => onPaperChange({
              ...paper,
              customImageUrl: undefined,
              customImageAspectRatio: undefined,
              type: paper.type === 'custom' ? 'ruled' : paper.type,
              ...(paper.size === 'custom' ? {
                size: 'a4',
                width: 1200,
                height: 1697,
              } : {}),
            })}
            title={t('editor.customBgResetTitle')}
          >
            <RotateCcw size={11} />
            <span>{t('common.reset')}</span>
          </button>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => bgImageInputRef.current?.click()}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Upload size={14} />
          <span>{paper.customImageUrl ? t('editor.customBgChange') : t('editor.customBgUpload')}</span>
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

        {paper.customImageUrl && (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', fontSize: '12px', marginTop: '4px' }}
              onClick={() => {
                const img = new Image();
                img.onload = () => {
                  const dims = calculatePaperDimensionsFromImage(img.naturalWidth, img.naturalHeight, paper.width);
                  onPaperChange({
                    ...paper,
                    size: 'custom',
                    width: dims.width,
                    height: dims.height,
                    customImageAspectRatio: dims.aspectRatio,
                  });
                };
                img.src = paper.customImageUrl!;
              }}
              title={t('editor.bgFitSizeTitle')}
            >
              <Maximize2 size={12} />
              <span>{t('editor.bgFitSize')}</span>
            </button>

            <div className="control-item">
              <div className="control-label-row">
                <span>{t('editor.bgOpacity')}</span>
                <span className="control-value">{Math.round((paper.bgOpacity ?? 1.0) * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.05"
                value={paper.bgOpacity ?? 1.0}
                onChange={(e) => onPaperChange({ ...paper, bgOpacity: Number(e.target.value) })}
              />
            </div>

            <div className="control-item">
              <div className="control-label-row">
                <span>{t('editor.bgBrightness')}</span>
                <span className="control-value">{Math.round((paper.bgBrightness ?? 1.0) * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.6" 
                max="1.4" 
                step="0.05"
                value={paper.bgBrightness ?? 1.0}
                onChange={(e) => onPaperChange({ ...paper, bgBrightness: Number(e.target.value) })}
              />
            </div>

            <div className="control-item">
              <div className="control-label-row">
                <span>{t('editor.bgContrast')}</span>
                <span className="control-value">{Math.round((paper.bgContrast ?? 1.0) * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.6" 
                max="1.4" 
                step="0.05"
                value={paper.bgContrast ?? 1.0}
                onChange={(e) => onPaperChange({ ...paper, bgContrast: Number(e.target.value) })}
              />
            </div>

            <div className="control-item">
              <div className="control-label-row">
                <span>{t('editor.bgFitLabel')}</span>
              </div>
              <select
                value={paper.bgFit || 'cover'}
                onChange={(e) => onPaperChange({ ...paper, bgFit: e.target.value as 'cover' | 'contain' | 'stretch' })}
              >
                <option value="cover">{t('editor.bgfit_cover')}</option>
                <option value="contain">{t('editor.bgfit_contain')}</option>
                <option value="stretch">{t('editor.bgfit_stretch')}</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* 2. Curated HD Real Paper Showcase */}
      <div className="control-group">
        <div className="group-title">
          <span style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} />
            {t('editor.hdShowcaseTitle')}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
            onClick={() => onPaperChange({
              ...paper,
              customImageUrl: undefined,
              customImageAspectRatio: undefined,
              paperTexture: 'clean',
              type: 'ruled',
              ...(paper.size === 'custom' ? {
                size: 'a4',
                width: 1200,
                height: 1697,
              } : {}),
            })}
            title={t('editor.hdShowcaseResetTitle')}
          >
            <RotateCcw size={11} />
            <span>{t('common.reset')}</span>
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {HD_PAPER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                const dataUrl = preset.createBackground(paper.width || 1200, paper.height || 1697);
                onPaperChange({
                  ...paper,
                  type: 'custom',
                  customImageUrl: dataUrl,
                  paperTexture: 'photo',
                  shadowIntensity: 0.2,
                });
              }}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                cursor: 'pointer',
                textAlign: 'start',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: preset.previewColor, border: '1px solid rgba(255,255,255,0.2)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{t(`paperPreset.${preset.id}.name`, { defaultValue: preset.name })}</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>{t(`paperPreset.${preset.id}.description`, { defaultValue: preset.description })}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Photo Camera Simulation */}
      <div className="control-group">
        <div className="group-title">
          <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Camera size={14} />
            {t('editor.photoLightingTitle')}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
            onClick={() => onPaperChange({
              ...paper,
              paperTexture: SECTION_DEFAULTS.photoEffects.paperTexture,
              shadowIntensity: SECTION_DEFAULTS.photoEffects.shadowIntensity,
              vignette: SECTION_DEFAULTS.photoEffects.vignette,
            })}
            title={t('editor.photoLightingResetTitle')}
          >
            <RotateCcw size={11} />
            <span>{t('common.reset')}</span>
          </button>
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.textureMode')}</span>
          </div>
          <select 
            value={paper.paperTexture || 'clean'} 
            onChange={(e) => onPaperChange({ 
              ...paper, 
              paperTexture: e.target.value as 'clean' | 'photo' | 'vintage' | 'creased',
              vignette: e.target.value === 'photo',
            })}
          >
            <option value="clean">{t('editor.tex_clean')}</option>
            <option value="photo">{t('editor.tex_photo')}</option>
            <option value="creased">{t('editor.tex_creased')}</option>
            <option value="vintage">{t('editor.tex_vintage')}</option>
          </select>
        </div>

        <div className="control-item">
          <div className="control-label-row">
            <span>{t('editor.shadowIntensity')}</span>
            <span className="control-value">{Math.round((paper.shadowIntensity ?? 0.2) * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="0.6" 
            step="0.05"
            value={paper.shadowIntensity ?? 0.2}
            onChange={(e) => onPaperChange({ ...paper, shadowIntensity: Number(e.target.value) })}
          />
        </div>

        <div className="control-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px' }}>{t('editor.vignette')}</span>
          <input 
            type="checkbox" 
            checked={paper.vignette ?? false}
            onChange={(e) => onPaperChange({ ...paper, vignette: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
};
