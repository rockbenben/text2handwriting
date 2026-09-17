import { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sliders, FileText, Camera, Grid } from 'lucide-react';
import type { PaperConfig, HandwritingConfig } from '../engine/types';
import { loadCustomFontFromFile, createCustomFontOption } from '../engine/fontLoader';
import type { FontOption } from '../engine/fontLoader';
import { scanLocalSystemFonts } from '../engine/fontScanner';
import { parseDocumentFile, isSupportedDocFile } from '../engine/docParser';
import { calculatePaperDimensionsFromImage } from '../engine/paper';
import { TextTab } from './editor/TextTab';
import { HandwritingTab } from './editor/HandwritingTab';
import { PaperTab } from './editor/PaperTab';
import { PhotoTab } from './editor/PhotoTab';

interface EditorPanelProps {
  text: string;
  onTextChange: (text: string) => void;
  paper: PaperConfig;
  onPaperChange: (paper: PaperConfig) => void;
  handwriting: HandwritingConfig;
  onHandwritingChange: (handwriting: HandwritingConfig) => void;
  fontList: FontOption[];
  onAddCustomFont: (font: FontOption) => void;
  onAddMultipleFonts?: (fonts: FontOption[]) => void;
  onSelectSampleText: () => void;
  totalChars: number;
  totalPages: number;
}


export const EditorPanel: React.FC<EditorPanelProps> = ({
  text,
  onTextChange,
  paper,
  onPaperChange,
  handwriting,
  onHandwritingChange,
  fontList,
  onAddCustomFont,
  onAddMultipleFonts,
  onSelectSampleText,
  totalChars,
  totalPages,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'text' | 'handwriting' | 'paper' | 'photo'>('text');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [customFontName, setCustomFontName] = useState('');
  const [fontSearch, setFontSearch] = useState('');
  const [isScanningFonts, setIsScanningFonts] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertTag = (prefix: string, suffix: string, defaultText = '') => {
    const el = textareaRef.current;
    if (!el) {
      onTextChange(text + `${prefix}${defaultText}${suffix}`);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const selected = text.slice(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;
    const nextText = text.slice(0, start) + replacement + text.slice(end);
    onTextChange(nextText);
    setTimeout(() => {
      el.focus();
      const newCursor = start + prefix.length + selected.length;
      el.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const handleScanFonts = async () => {
    setIsScanningFonts(true);
    setScanNotice(null);
    try {
      const result = await scanLocalSystemFonts();
      if (result.fonts.length > 0) {
        onAddMultipleFonts?.(result.fonts);
        setScanNotice(t('editor.scanFound', { count: result.totalFound }));
      } else {
        setScanNotice(t('editor.scanNone'));
      }
    } catch (e) {
      console.error('Scan fonts error:', e);
      setScanNotice(t('editor.scanFallback'));
    } finally {
      setIsScanningFonts(false);
    }
  };

  const filteredFonts = useMemo(() => {
    if (!fontSearch.trim()) return fontList;
    const q = fontSearch.toLowerCase().trim();
    return fontList.filter(f => f.name.toLowerCase().includes(q) || f.family.toLowerCase().includes(q));
  }, [fontList, fontSearch]);

  const handleAddCustomFontName = () => {
    if (!customFontName.trim()) return;
    const opt = createCustomFontOption(customFontName.trim());
    onAddCustomFont(opt);
    onHandwritingChange({
      ...handwriting,
      fontFamily: opt.family,
    });
    setCustomFontName('');
  };

  const handleDocFileUpload = async (file: File) => {
    if (!isSupportedDocFile(file)) {
      alert(t('editor.unsupportedDoc', { name: file.name }));
      return;
    }
    try {
      const extractedText = await parseDocumentFile(file);
      if (!extractedText) {
        // 只含图片的 docx、空 txt 都会解析成空串。不提示的话用户无法区分"没提取到文字"和"程序卡住了"
        alert(t('editor.docEmpty', { name: file.name }));
        return;
      }
      // 导入会整篇替换已输入内容，而应用没有撤销栈
      if (text.trim() && text !== extractedText) {
        const confirmed = window.confirm(t('editor.docReplaceConfirm', { name: file.name }));
        if (!confirmed) return;
      }
      onTextChange(extractedText);
    } catch (err) {
      console.error('Failed to parse document:', err);
      // .docx 解析器是按需加载的独立 chunk，弱网下也可能加载失败
      const msg = err instanceof Error ? err.message : '';
      const isChunkFail = /Failed to fetch dynamically imported module|Import maps|Loading chunk/i.test(msg);
      alert(isChunkFail ? t('editor.docChunkFail') : t('editor.docParseFail'));
    }
  };

  const handleFontFileUpload = async (file: File) => {
    try {
      const customFont = await loadCustomFontFromFile(file);
      onAddCustomFont(customFont);
      onHandwritingChange({
        ...handwriting,
        fontFamily: customFont.family,
      });
    } catch (err) {
      console.error('Failed to load font:', err);
      alert(t('editor.fontLoadFail'));
    }
  };

  const handleBgImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(t('editor.imageTypeFail', { name: file.name }));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert(t('editor.imageTooLarge'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => {
      alert(t('editor.imageReadFail', { name: file.name }));
    };
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const img = new Image();
      img.onerror = () => {
        // HEIC / 截断 / 损坏的图片解码会静默失败，必须给出反馈
        alert(t('editor.imageDecodeFail', { name: file.name }));
      };
      img.onload = () => {
        const dims = calculatePaperDimensionsFromImage(img.naturalWidth, img.naturalHeight, paper.width || 1200);
        onPaperChange({
          ...paper,
          type: 'custom',
          size: 'custom',
          customImageUrl: url,
          customImageAspectRatio: dims.aspectRatio,
          width: dims.width,
          height: dims.height,
        });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="sidebar-panel">
      {/* Tab Navigation */}
      <div className="tab-bar">
        <button 
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
          title={t('editor.tabText')}
          aria-label={t('editor.tabText')}
        >
          <FileText size={15} />
          <span>{t('editor.tabText')}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'handwriting' ? 'active' : ''}`}
          onClick={() => setActiveTab('handwriting')}
          title={t('editor.tabHandwriting')}
          aria-label={t('editor.tabHandwriting')}
        >
          <Sliders size={15} />
          <span>{t('editor.tabHandwriting')}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'paper' ? 'active' : ''}`}
          onClick={() => setActiveTab('paper')}
          title={t('editor.tabPaper')}
          aria-label={t('editor.tabPaper')}
        >
          <Grid size={15} />
          <span>{t('editor.tabPaper')}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'photo' ? 'active' : ''}`}
          onClick={() => setActiveTab('photo')}
          title={t('editor.tabPhoto')}
          aria-label={t('editor.tabPhoto')}
        >
          <Camera size={15} />
          <span>{t('editor.tabPhoto')}</span>
        </button>
      </div>

      {/* Tab 1: Text Content */}

      {/* Tab 1: Text Content */}
      {activeTab === 'text' && (
        <TextTab
          text={text}
          onTextChange={onTextChange}
          handwriting={handwriting}
          onHandwritingChange={onHandwritingChange}
          onSelectSampleText={onSelectSampleText}
          totalChars={totalChars}
          totalPages={totalPages}
          isDraggingFile={isDraggingFile}
          setIsDraggingFile={setIsDraggingFile}
          fileInputRef={fileInputRef}
          textareaRef={textareaRef}
          handleInsertTag={handleInsertTag}
          handleDocFileUpload={handleDocFileUpload}
        />
      )}

      {/* Tab 2: Handwriting Perturbations & Fonts */}
      {activeTab === 'handwriting' && (
        <HandwritingTab
          handwriting={handwriting}
          onHandwritingChange={onHandwritingChange}
          paper={paper}
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
      )}

      {/* Tab 3: Paper & Layout */}
      {activeTab === 'paper' && (
        <PaperTab
          paper={paper}
          onPaperChange={onPaperChange}
          handwriting={handwriting}
          onHandwritingChange={onHandwritingChange}
          bgImageInputRef={bgImageInputRef}
          handleBgImageUpload={handleBgImageUpload}
        />
      )}

      {/* Tab 4: Photo Realism & Custom Background */}
      {activeTab === 'photo' && (
        <PhotoTab
          paper={paper}
          onPaperChange={onPaperChange}
          bgImageInputRef={bgImageInputRef}
          handleBgImageUpload={handleBgImageUpload}
        />
      )}
    </aside>
  );
};
