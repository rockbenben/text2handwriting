import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, PenLine } from 'lucide-react';
import { Header } from './components/Header';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { PresetModal } from './components/PresetModal';
import { PRESET_TEMPLATES, type PresetTemplate } from './engine/presets';
import { BUILTIN_FONTS, type FontOption, deduplicateFontList } from './engine/fontLoader';
import { typesetText } from './engine/typeset';
import { hasArabicLetters } from './engine/arabicLayout';
import { createShapedTextMeasurer } from './engine/paper';
import {
  composeOutputPage,
  exportCanvasAsImage,
  exportAllPagesAsZip,
  printPageImage,
  getPdfPageFormat
} from './engine/exporter';
import type { DoodleMap, DoodleStroke } from './engine/types';
import type { PaperConfig, HandwritingConfig } from './engine/types';
import {
  loadStoredSettings,
  loadStoredCustomFonts,
  saveStoredCustomFonts,
} from './engine/storage';
import { useDraftPersistence } from './useDraftPersistence';
import { usePaperBackground } from './usePaperBackground';

type OutputFormat = 'png' | 'jpeg' | 'zip' | 'pdf' | 'print';

const outputErrors = {
  png: 'errors.exportFailed',
  jpeg: 'errors.exportFailed',
  zip: 'errors.zipExportFailed',
  pdf: 'errors.pdfExportFailed',
  print: 'errors.printFailed',
} as const;

export function App() {
  const { t } = useTranslation();
  const [mobilePreview, setMobilePreview] = useState(false);
  // Initialize with persisted settings or default template
  const defaultPreset = PRESET_TEMPLATES[0];
  const initialSettings = useMemo(() => loadStoredSettings(), []);

  const [text, setText] = useState<string>(() => {
    // 首次访问（从未存过正文）跟随界面语言显示对应示例；老用户保留已存内容
    if (initialSettings.storedText !== null) return initialSettings.text;
    return t(`samples.${PRESET_TEMPLATES[0].id}`, { defaultValue: initialSettings.text });
  });
  const [paper, setPaper] = useState<PaperConfig>(() => initialSettings.paper);
  const [handwriting, setHandwriting] = useState<HandwritingConfig>(() => initialSettings.handwriting);
  const [fontList, setFontList] = useState<FontOption[]>(() => {
    const savedCustom = loadStoredCustomFonts();
    if (savedCustom.length > 0) {
      return deduplicateFontList([...BUILTIN_FONTS, ...savedCustom]);
    }
    return BUILTIN_FONTS;
  });
  const [activePresetId, setActivePresetId] = useState<string>(() => initialSettings.activePresetId);

  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [exportScale, setExportScale] = useState<number>(() => initialSettings.exportScale); // 2x ≈ 290 DPI（A4 1200px 宽对应 210mm，与顶栏「高清」档标注一致）
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | undefined>();

  // 手绘层：按页码索引保存笔画。手绘只在当前会话存在，不写 localStorage ——
  // 一旦编辑正文导致分页变化，按页号挂的笔迹会错位，持久化反而误导。
  const [doodles, setDoodles] = useState<DoodleMap>({});
  const [documentRevision, setDocumentRevision] = useState(0);
  const handleDoodlesChange = (pageIndex: number, strokes: DoodleStroke[]) => {
    setDoodles((prev) => {
      const next = { ...prev };
      if (strokes.length === 0) {
        delete next[pageIndex];
      } else {
        next[pageIndex] = strokes;
      }
      return next;
    });
  };

  const draft = useMemo(() => ({
    text, paper, handwriting, exportScale, activePresetId,
  }), [text, paper, handwriting, exportScale, activePresetId]);
  const draftStatus = useDraftPersistence(draft, initialSettings.storedText);

  const { load: loadBackground, image: customImage } = usePaperBackground(paper.customImageUrl);

  const shapesText = useMemo(() => hasArabicLetters(text), [text]);
  const [fontRevision, setFontRevision] = useState(0);
  useEffect(() => {
    if (!shapesText || !document.fonts) return;
    const refreshFontMetrics = () => setFontRevision(revision => revision + 1);
    document.fonts.addEventListener('loadingdone', refreshFontMetrics);
    return () => document.fonts.removeEventListener('loadingdone', refreshFontMetrics);
  }, [shapesText]);
  const measureShapedText = useMemo(() => {
    // Recreate the context after a face loads so wrapping uses the new metrics.
    if (shapesText) return createShapedTextMeasurer(handwriting.fontSize, handwriting.fontFamily);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Loaded font metrics can change without changing the CSS font string.
  }, [shapesText, handwriting.fontSize, handwriting.fontFamily, fontRevision]);

  const {
    type, width, height, marginTop, marginBottom, marginLeft, marginRight, lineSpacing, gridCols, gridRows,
  } = paper;
  // Pass just the paper geometry to the layout engine. Preview and export
  // still receive the full paper configuration for drawing.
  const typesetResult = useMemo(() => {
    return typesetText(text, {
      type, width, height, marginTop, marginBottom, marginLeft, marginRight, lineSpacing, gridCols, gridRows,
    }, handwriting, measureShapedText);
  }, [
    text, handwriting, measureShapedText,
    type, width, height, marginTop, marginBottom, marginLeft, marginRight, lineSpacing, gridCols, gridRows,
  ]);

  // 分页数变少时把页码拉回合法范围。在渲染期直接校正 state，而不是放进 useEffect ——
  // 后者会先提交一帧越界页码（此刻 currentPage 为 null、预览闪空），再触发一次级联渲染。
  // 这里每轮都判一次，setState 后 currentPageIndex 立即合法，条件转假，不会循环。
  if (currentPageIndex >= typesetResult.totalPages) {
    setCurrentPageIndex(Math.max(0, typesetResult.totalPages - 1));
  }

  const currentPage = typesetResult.pages[currentPageIndex] || null;

  // Re-roll seed for new handwriting natural variation
  const handleShuffleSeed = () => {
    const newSeed = Math.floor(Math.random() * 900000) + 1000;
    setHandwriting((prev) => ({
      ...prev,
      seed: newSeed,
    }));
  };

  // 取预设示例正文：优先当前语言版本，缺翻译时回落到内置中文源文本
  const localizedSample = (preset: PresetTemplate): string =>
    t(`samples.${preset.id}`, { defaultValue: preset.sampleText });

  const replaceDocument = (nextText: string, confirmation: string): boolean => {
    const hasDoodles = Object.keys(doodles).length > 0;
    const requiresConfirmation = hasDoodles || (text.trim() !== '' && text !== nextText);
    const message = hasDoodles ? `${confirmation}\n\n${t('confirm.replaceDoodles')}` : confirmation;
    if (requiresConfirmation && !window.confirm(message)) return false;

    setText(nextText);
    setDoodles({});
    setCurrentPageIndex(0);
    setDocumentRevision(revision => revision + 1);
    return true;
  };

  // Apply a preset template. 返回是否真的套用，弹窗据此决定要不要关闭：
  // 用户在确认框里点「取消」时，弹窗必须留着，否则还得重新打开一次。
  const handleSelectPreset = (preset: PresetTemplate): boolean => {
    if (!replaceDocument(localizedSample(preset), t('confirm.applyPreset'))) return false;
    setActivePresetId(preset.id);
    setPaper({ ...preset.paper });
    setHandwriting({ ...preset.handwriting });
    return true;
  };

  const handleAddCustomFont = (font: FontOption) => {
    if (!font || !font.family) {
      console.warn('Ignored invalid custom font entry', font);
      return;
    }
    setFontList((prev) => {
      const updated = [font, ...prev];
      saveStoredCustomFonts(updated);
      return updated;
    });
  };

  const handleAddMultipleFonts = (newFonts: FontOption[]) => {
    const valid = (newFonts || []).filter(f => f && f.family);
    if (valid.length === 0) return;
    setFontList((prev) => {
      const updated = deduplicateFontList([...prev, ...valid]);
      saveStoredCustomFonts(updated);
      return updated;
    });
  };

  const runOutput = async (format: OutputFormat) => {
    if (!currentPage || isExporting) return;
    // Editor updates replace these objects and arrays, so the values captured
    // here stay valid even if the document is changed while assets load.
    const snapshot = {
      page: currentPage,
      pages: typesetResult.pages,
      paper,
      handwriting,
      scale: exportScale,
      doodles,
    };
    const fileBaseName = t('file.baseName');
    const trackProgress = (current: number, total: number) => setExportProgress({ current, total });
    if (format !== 'print') setIsExporting(true);
    if (format === 'pdf' || format === 'zip') trackProgress(0, snapshot.pages.length);

    try {
      const [background] = await Promise.all([loadBackground?.(), document.fonts?.ready]);
      const composition = { ...snapshot, customImage: background };
      if (format === 'zip') {
        await exportAllPagesAsZip(snapshot.pages, composition, trackProgress, fileBaseName);
        return;
      }
      if (format === 'pdf') {
        const { exportAllPagesAsPdf } = await import('./engine/pdfExporter');
        await exportAllPagesAsPdf(snapshot.pages, composition, trackProgress, fileBaseName);
        return;
      }

      const offscreen = document.createElement('canvas');
      composeOutputPage(offscreen, snapshot.page, composition);
      if (format === 'print') {
        const { size, width, height } = snapshot.paper;
        const { widthMm, heightMm } = getPdfPageFormat(size, width, height);
        await printPageImage(offscreen.toDataURL('image/png'), widthMm, heightMm);
        return;
      }

      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const filename = t('file.pageName', {
        base: fileBaseName,
        page: snapshot.page.pageIndex + 1,
        timestamp: Date.now(),
        ext,
      });
      await exportCanvasAsImage(offscreen, filename, format, 0.95);
    } catch (err) {
      console.error(`Could not output ${format}:`, err);
      alert(t(outputErrors[format]));
    } finally {
      if (format !== 'print') {
        setIsExporting(false);
        setExportProgress(undefined);
      }
    }
  };

  return (
    <div className="app-frame">
      {/* 预设弹窗打开时，把背景设为 inert/aria-hidden，键盘与读屏都留在弹窗内 */}
      <div
        className="app-shell"
        inert={isPresetModalOpen || undefined}
        aria-hidden={isPresetModalOpen || undefined}
      >
        {/* Top Navigation */}
        <Header
          onOpenPresets={() => setIsPresetModalOpen(true)}
          exportScale={exportScale}
          onSetExportScale={setExportScale}
          onExportCurrentPage={runOutput}
          onExportAllZip={() => runOutput('zip')}
          onExportAllPdf={() => runOutput('pdf')}
          onPrint={() => runOutput('print')}
          isExporting={isExporting}
          totalChars={typesetResult.totalChars}
          totalPages={typesetResult.totalPages}
        />

        {draftStatus && (
          <div className="draft-save-status" role="status">
            {t(draftStatus === 'conflict' ? 'errors.draftConflict' : 'errors.draftSaveFailed')}
          </div>
        )}
        {/* 窄屏（≤900px）单栏切换：宽屏由 CSS 隐藏，同一套 DOM 只显示编辑或预览其中一栏 */}
        <div className="mobile-workspace-switch">
          <button type="button" className="btn" aria-pressed={!mobilePreview} onClick={() => setMobilePreview(false)}>
            <PenLine size={16} aria-hidden="true" />
            {t('editor.workspaceEdit')}
          </button>
          <button type="button" className="btn" aria-pressed={mobilePreview} onClick={() => setMobilePreview(true)}>
            <Eye size={16} aria-hidden="true" />
            {t('preview.title')}
          </button>
        </div>
        {/* Main Split Body */}
        <div className="app-main" data-mobile-view={mobilePreview ? 'preview' : 'editor'}>
          {/* Left Control Panel */}
          <EditorPanel
            text={text}
            onShuffleSeed={handleShuffleSeed}
            onTextChange={setText}
            onReplaceDocument={replaceDocument}
            documentRevision={documentRevision}
            paper={paper}
            onPaperChange={setPaper}
            handwriting={handwriting}
            onHandwritingChange={setHandwriting}
            fontList={fontList}
            onAddCustomFont={handleAddCustomFont}
            onAddMultipleFonts={handleAddMultipleFonts}
            onSelectSampleText={() => {
              const currentPreset = PRESET_TEMPLATES.find((p) => p.id === activePresetId) || defaultPreset;
              replaceDocument(localizedSample(currentPreset), t('confirm.resetSample'));
            }}
            totalChars={typesetResult.totalChars}
            totalPages={typesetResult.totalPages}
          />

          {/* Right Live Preview Canvas */}
          <PreviewPanel
            currentPage={currentPage}
            documentRevision={documentRevision}
            currentPageIndex={currentPageIndex}
            totalPages={typesetResult.totalPages}
            onPageChange={setCurrentPageIndex}
            paper={paper}
            handwriting={handwriting}
            customImage={customImage}
            onExportCurrentPage={runOutput}
            isExporting={isExporting}
            exportProgress={exportProgress}
            doodles={doodles[currentPageIndex] ?? []}
            onDoodlesChange={(strokes) => handleDoodlesChange(currentPageIndex, strokes)}
          />
        </div>
      </div>

      {/* Presets Modal */}
      <PresetModal 
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onSelectPreset={handleSelectPreset}
        activePresetId={activePresetId}
      />
    </div>
  );
}

export default App;
