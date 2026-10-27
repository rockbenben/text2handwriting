import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { PresetModal } from './components/PresetModal';
import { PRESET_TEMPLATES, type PresetTemplate } from './engine/presets';
import { BUILTIN_FONTS, type FontOption, deduplicateFontList } from './engine/fontLoader';
import { typesetText } from './engine/typeset';
import {
  exportCanvasAsImage,
  exportAllPagesAsZip,
  exportAllPagesAsPdf,
  printPageImage,
  getPdfPageFormat
} from './engine/exporter';
import { renderHandwritingPageToCanvas } from './engine/paper';
import { drawDoodles } from './engine/doodle';
import type { DoodleMap, DoodleStroke } from './engine/types';
import type { PaperConfig, HandwritingConfig } from './engine/types';
import {
  loadStoredSettings,
  saveStoredSettings,
  loadStoredCustomFonts,
  saveStoredCustomFonts,
  hasStoredText,
} from './engine/storage';

export function App() {
  const { t } = useTranslation();
  // Initialize with persisted settings or default template
  const defaultPreset = PRESET_TEMPLATES[0];
  const initialSettings = useMemo(() => loadStoredSettings(), []);

  const [text, setText] = useState<string>(() => {
    // 首次访问（从未存过正文）跟随界面语言显示对应示例；老用户保留已存内容
    if (hasStoredText()) return initialSettings.text;
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
  const [exportScale, setExportScale] = useState<number>(() => initialSettings.exportScale); // 2x = ~300 DPI high resolution
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | undefined>();

  // 手绘层：按页码索引保存笔画。手绘只在当前会话存在，不写 localStorage ——
  // 一旦编辑正文导致分页变化，按页号挂的笔迹会错位，持久化反而误导。
  const [doodles, setDoodles] = useState<DoodleMap>({});
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

  const customImgRef = useRef<HTMLImageElement | null>(null);

  // Auto-persist settings to localStorage.
  // 防抖是必要的：text 每次击键都变，而 paper 里可能挂着几 MB 的 base64 底图，
  // 不防抖的话每次击键都要 JSON.stringify 一整块大字符串再写四次 localStorage。
  useEffect(() => {
    const timer = setTimeout(() => {
      saveStoredSettings({
        text,
        paper,
        handwriting,
        exportScale,
        activePresetId,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [text, paper, handwriting, exportScale, activePresetId]);

  // 标签页关闭前的最后一次兜底写入（防抖窗口内的内容不会丢）
  useEffect(() => {
    const persist = () => {
      saveStoredSettings({
        text,
        paper,
        handwriting,
        exportScale,
        activePresetId,
      });
    };
    window.addEventListener('beforeunload', persist);
    return () => window.removeEventListener('beforeunload', persist);
  }, [text, paper, handwriting, exportScale, activePresetId]);

  // Track custom background image
  useEffect(() => {
    let active = true;
    if (paper.customImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (active) {
          customImgRef.current = img;
        }
      };
      img.onerror = () => {
        if (active) {
          customImgRef.current = null;
        }
      };
      img.src = paper.customImageUrl;
    } else {
      customImgRef.current = null;
    }
    return () => {
      active = false;
    };
  }, [paper.customImageUrl]);

  // Typeset text whenever text, paper, or handwriting configs change
  const typesetResult = useMemo(() => {
    return typesetText(text, paper, handwriting);
  }, [text, paper, handwriting]);

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

  // Apply a preset template. 返回是否真的套用，弹窗据此决定要不要关闭：
  // 用户在确认框里点「取消」时，弹窗必须留着，否则还得重新打开一次。
  const handleSelectPreset = (preset: PresetTemplate): boolean => {
    // 预设会整篇替换当前文本，而应用里没有撤销栈，所以必须显式确认
    const sample = localizedSample(preset);
    if (text.trim() && text !== sample) {
      const confirmed = window.confirm(t('confirm.applyPreset'));
      if (!confirmed) return false;
    }
    setActivePresetId(preset.id);
    setPaper({ ...preset.paper });
    setHandwriting({ ...preset.handwriting });
    setText(sample);
    setCurrentPageIndex(0);
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

  // Export current page
  const handleExportCurrentPage = async (format: 'png' | 'jpeg') => {
    if (!currentPage || isExporting) return;
    setIsExporting(true);
    try {
      // 必须在画布绘制之前等字体就绪。放在 exportCanvasAsImage 内部等已经晚了：
      // 那时像素已经用兜底字体画完了，等也只是等一个已经完成的渲染。
      if (document.fonts) await document.fonts.ready;

      const offscreen = document.createElement('canvas');
      renderHandwritingPageToCanvas(
        offscreen,
        currentPage,
        paper,
        handwriting,
        exportScale,
        customImgRef.current
      );
      const pageDoodles = doodles[currentPage.pageIndex];
      if (pageDoodles && pageDoodles.length > 0) {
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(exportScale, exportScale);
          drawDoodles(ctx, pageDoodles);
          ctx.restore();
        }
      }
      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const filename = t('file.pageName', {
        base: t('file.baseName'),
        page: currentPageIndex + 1,
        timestamp: Date.now(),
        ext,
      });
      await exportCanvasAsImage(offscreen, filename, format, 0.95);
    } catch (err) {
      console.error('Export error:', err);
      alert(t('errors.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  // Export all pages as ZIP
  const handleExportAllZip = async () => {
    if (typesetResult.pages.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: typesetResult.pages.length });
    try {
      await exportAllPagesAsZip(
        typesetResult.pages,
        paper,
        handwriting,
        exportScale,
        'png',
        customImgRef.current,
        (current, total) => setExportProgress({ current, total }),
        doodles,
        t('file.baseName')
      );
    } catch (err) {
      console.error('ZIP Export error:', err);
      alert(t('errors.zipExportFailed'));
    } finally {
      setIsExporting(false);
      setExportProgress(undefined);
    }
  };

  // Export all pages as PDF
  const handleExportAllPdf = async () => {
    if (typesetResult.pages.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: typesetResult.pages.length });
    try {
      await exportAllPagesAsPdf(
        typesetResult.pages,
        paper,
        handwriting,
        exportScale,
        customImgRef.current,
        (current, total) => setExportProgress({ current, total }),
        doodles,
        t('file.baseName')
      );
    } catch (err) {
      console.error('PDF Export error:', err);
      alert(t('errors.pdfExportFailed'));
    } finally {
      setIsExporting(false);
      setExportProgress(undefined);
    }
  };

  // 打印当前页：走与 PNG 导出相同的离屏合成路径（纸面+文字+手绘），
  // 在隐藏 iframe 里按纸张真实毫米尺寸打印，保证手绘进入快照、不被页边裁切。
  const handlePrint = async () => {
    if (!currentPage) return;
    try {
      if (document.fonts) await document.fonts.ready;
      const offscreen = document.createElement('canvas');
      renderHandwritingPageToCanvas(offscreen, currentPage, paper, handwriting, exportScale, customImgRef.current);

      const pageDoodles = doodles[currentPage.pageIndex];
      if (pageDoodles && pageDoodles.length > 0) {
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(exportScale, exportScale);
          drawDoodles(ctx, pageDoodles);
          ctx.restore();
        }
      }

      const { widthMm, heightMm } = getPdfPageFormat(paper.size, paper.width, paper.height);
      await printPageImage(offscreen.toDataURL('image/png'), widthMm, heightMm);
    } catch (err) {
      console.error('Print error:', err);
      alert(t('errors.printFailed'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      {/* 预设弹窗打开时，把背景设为 inert/aria-hidden，键盘与读屏都留在弹窗内 */}
      <div
        className="app-shell"
        inert={isPresetModalOpen || undefined}
        aria-hidden={isPresetModalOpen || undefined}
      >
      {/* Top Navigation */}
      <Header 
        onOpenPresets={() => setIsPresetModalOpen(true)}
        onShuffleSeed={handleShuffleSeed}
        exportScale={exportScale}
        onSetExportScale={setExportScale}
        onExportCurrentPage={handleExportCurrentPage}
        onExportAllZip={handleExportAllZip}
        onExportAllPdf={handleExportAllPdf}
        onPrint={handlePrint}
        isExporting={isExporting}
        totalChars={typesetResult.totalChars}
        totalPages={typesetResult.totalPages}
      />

      {/* Main Split Body */}
      <div className="app-main">
        {/* Left Control Panel */}
        <EditorPanel 
          text={text}
          onTextChange={setText}
          paper={paper}
          onPaperChange={setPaper}
          handwriting={handwriting}
          onHandwritingChange={setHandwriting}
          fontList={fontList}
          onAddCustomFont={handleAddCustomFont}
          onAddMultipleFonts={handleAddMultipleFonts}
          onSelectSampleText={() => {
            const currentPreset = PRESET_TEMPLATES.find((p) => p.id === activePresetId) || defaultPreset;
            const sample = localizedSample(currentPreset);
            // 只换回示例文字、不动纸张与笔迹设置，所以确认文案只说替换正文
            if (text.trim() && text !== sample && !window.confirm(t('confirm.resetSample'))) return;
            setText(sample);
          }}
          totalChars={typesetResult.totalChars}
          totalPages={typesetResult.totalPages}
        />

        {/* Right Live Preview Canvas */}
        <PreviewPanel 
          currentPage={currentPage}
          currentPageIndex={currentPageIndex}
          totalPages={typesetResult.totalPages}
          onPageChange={setCurrentPageIndex}
          paper={paper}
          handwriting={handwriting}
          onExportCurrentPage={handleExportCurrentPage}
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
