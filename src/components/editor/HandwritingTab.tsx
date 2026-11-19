import { useTranslation } from 'react-i18next';
import { Dice5 } from 'lucide-react';
import type { RefObject } from 'react';
import type { HandwritingConfig, PaperConfig } from '../../engine/types';
import type { FontOption } from '../../engine/fontLoader';
import { PersonaSection } from './sections/PersonaSection';
import { FontSection } from './sections/FontSection';
import { PenSection } from './sections/PenSection';
import { TypographySection } from './sections/TypographySection';
import { PerturbationSection } from './sections/PerturbationSection';
import { PhysicsSection } from './sections/PhysicsSection';
import { ScratchSection } from './sections/ScratchSection';
import { AnnotationSection } from './sections/AnnotationSection';
import { RoughnessSection } from './sections/RoughnessSection';

interface HandwritingTabProps {
  onShuffleSeed: () => void;
  handwriting: HandwritingConfig;
  onHandwritingChange: (handwriting: HandwritingConfig) => void;
  paper: PaperConfig;
  customFontName: string;
  setCustomFontName: (v: string) => void;
  fontSearch: string;
  setFontSearch: (v: string) => void;
  isScanningFonts: boolean;
  scanNotice: string | null;
  fontInputRef: RefObject<HTMLInputElement | null>;
  handleScanFonts: () => void;
  handleAddCustomFontName: () => void;
  handleFontFileUpload: (file: File) => void;
  filteredFonts: FontOption[];
}

/**
 * 笔迹 tab：只负责把各区块组装起来，状态与处理函数仍由 EditorPanel 持有。
 * 扰动/物理/涂改/批注/粗糙度收进「高级」折叠区，默认只露出最常调的人格/字体/笔型/排版，
 * 否则一屏滑杆会把主线功能淹掉。
 */
export const HandwritingTab: React.FC<HandwritingTabProps> = ({
  onShuffleSeed,
  handwriting,
  onHandwritingChange,
  paper,
  customFontName,
  setCustomFontName,
  fontSearch,
  setFontSearch,
  isScanningFonts,
  scanNotice,
  fontInputRef,
  handleScanFonts,
  handleAddCustomFontName,
  handleFontFileUpload,
  filteredFonts,
}) => {
  const { t } = useTranslation();

  return (
    <div className="tab-content">
      <div className="handwriting-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onShuffleSeed} title={t('header.shuffleTitle')}>
          <Dice5 size={15} aria-hidden="true" />
          {t('header.shuffle')}
        </button>
      </div>
      <PersonaSection
        handwriting={handwriting}
        onHandwritingChange={onHandwritingChange}
      />
      <FontSection
        handwriting={handwriting}
        onHandwritingChange={onHandwritingChange}
        customFontName={customFontName}
        setCustomFontName={setCustomFontName}
        fontSearch={fontSearch}
        setFontSearch={setFontSearch}
        isScanningFonts={isScanningFonts}
        scanNotice={scanNotice}
        fontInputRef={fontInputRef}
        handleScanFonts={handleScanFonts}
        handleAddCustomFontName={handleAddCustomFontName}
        handleFontFileUpload={handleFontFileUpload}
        filteredFonts={filteredFonts}
      />
      <PenSection
        handwriting={handwriting}
        onHandwritingChange={onHandwritingChange}
      />
      <TypographySection
        handwriting={handwriting}
        onHandwritingChange={onHandwritingChange}
        paper={paper}
      />
      <details className="editor-disclosure">
        <summary>{t('editor.advancedHandwriting')}</summary>
        <div className="advanced-settings">
          <PerturbationSection
            handwriting={handwriting}
            onHandwritingChange={onHandwritingChange}
          />
          <PhysicsSection
            handwriting={handwriting}
            onHandwritingChange={onHandwritingChange}
          />
          <ScratchSection
            handwriting={handwriting}
            onHandwritingChange={onHandwritingChange}
          />
          <AnnotationSection
            handwriting={handwriting}
            onHandwritingChange={onHandwritingChange}
          />
          <RoughnessSection
            handwriting={handwriting}
            onHandwritingChange={onHandwritingChange}
          />
        </div>
      </details>
    </div>
  );
};
