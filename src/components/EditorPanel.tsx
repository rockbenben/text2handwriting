import { useState, useRef, useMemo, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sliders, FileText, Camera, Grid } from 'lucide-react';
import type { PaperConfig, HandwritingConfig } from '../engine/types';
import { loadCustomFontFromFile, createCustomFontOption } from '../engine/fontLoader';
import type { FontOption } from '../engine/fontLoader';
import { scanLocalSystemFonts } from '../engine/fontScanner';
import { parseDocumentFile, isSupportedDocFile } from '../engine/docParser';
import { calculatePaperDimensionsFromImage } from '../engine/paper';
import { CUSTOM_BG_PERSIST_MAX_CHARS } from '../engine/storage';
import { TextTab } from './editor/TextTab';
import { HandwritingTab } from './editor/HandwritingTab';
import { PaperTab } from './editor/PaperTab';
import { PhotoTab } from './editor/PhotoTab';

/**
 * 大底图直接写入 localStorage 会超出配额，saveStoredSettings 会把它丢掉。
 * 纸纹照片缩到 2000px 再转 JPEG 几乎看不出差别，却能跨刷新保留；
 * 两次仍压不进阈值时返回原图，由现有的“仅本次打开有效”提示兜底。
 */
function compressPaperPhoto(img: HTMLImageElement, originalUrl: string): string {
  if (originalUrl.length <= CUSTOM_BG_PERSIST_MAX_CHARS) return originalUrl;

  const attempts = [
    { maxEdge: 2000, quality: 0.85 },
    { maxEdge: 1600, quality: 0.75 },
  ];

  try {
    for (const { maxEdge, quality } of attempts) {
      const longest = Math.max(img.naturalWidth, img.naturalHeight);
      const scale = longest > maxEdge ? maxEdge / longest : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return originalUrl;
      // JPEG 没有透明通道；先铺白底，避免透明 PNG 被压成黑底。
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      if (compressed.length <= CUSTOM_BG_PERSIST_MAX_CHARS) return compressed;
    }
  } catch (err) {
    // 极端大图/编码失败时退回原图；底图仍可用，只是回到“仅本次会话”提示兜底。
    console.warn('Background image compression failed, using the original:', err);
  }

  return originalUrl;
}

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

  // 上传/解析是异步的；用 ref 读取“完成时”的最新状态，避免用发起时的旧值覆盖
  // 用户在这期间输入的正文或改过的字体/纸张设置。
  const textRef = useRef(text);
  const paperRef = useRef(paper);
  const handwritingRef = useRef(handwriting);
  const docImportSeqRef = useRef(0);
  const fontUploadSeqRef = useRef(0);
  const bgUploadSeqRef = useRef(0);
  useLayoutEffect(() => {
    textRef.current = text;
    paperRef.current = paper;
    handwritingRef.current = handwriting;
  }, [text, paper, handwriting]);

  // 让内部所有修改都先同步 ref，再交给父组件渲染：
  // 上传解析在 await 后读取 ref 时，拿到的是“用户刚改过”的值，
  // 不依赖 React 何时提交渲染。
  const handleTextChange = (nextText: string) => {
    textRef.current = nextText;
    onTextChange(nextText);
  };
  const handlePaperChange = (nextPaper: PaperConfig) => {
    paperRef.current = nextPaper;
    onPaperChange(nextPaper);
  };
  const handleHandwritingChange = (nextHandwriting: HandwritingConfig) => {
    handwritingRef.current = nextHandwriting;
    onHandwritingChange(nextHandwriting);
  };

  const handleInsertTag = (prefix: string, suffix: string, defaultText = '') => {
    const el = textareaRef.current;
    if (!el) {
      handleTextChange(text + `${prefix}${defaultText}${suffix}`);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const selected = text.slice(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;
    const nextText = text.slice(0, start) + replacement + text.slice(end);
    handleTextChange(nextText);
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
    const matches = fontList.filter(f => f.name.toLowerCase().includes(q) || f.family.toLowerCase().includes(q));
    // 筛选时保留当前选中的字体，否则 select 的 value 不在 options 里会变空白，
    // 看起来像字体被取消了，但预览其实还在用它。
    const selected = fontList.find(f => f.family === handwriting.fontFamily);
    if (selected && !matches.some(f => f.family === selected.family)) {
      return [selected, ...matches];
    }
    return matches;
  }, [fontList, fontSearch, handwriting.fontFamily]);

  const handleAddCustomFontName = () => {
    if (!customFontName.trim()) return;
    const opt = createCustomFontOption(customFontName.trim());
    onAddCustomFont(opt);
    handleHandwritingChange({
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
    const requestId = ++docImportSeqRef.current;
    try {
      const extractedText = await parseDocumentFile(file);
      if (requestId !== docImportSeqRef.current) return;
      if (!extractedText) {
        // 只含图片的 docx、空 txt 都会解析成空串。不提示的话用户无法区分"没提取到文字"和"程序卡住了"
        alert(t('editor.docEmpty', { name: file.name }));
        return;
      }
      // 导入会整篇替换已输入内容，而应用没有撤销栈。用完成时的正文判断：
      // 用户在解析期间新输入的内容也必须触发确认，不能被静默覆盖。
      const currentText = textRef.current;
      if (currentText.trim() && currentText !== extractedText) {
        const confirmed = window.confirm(t('editor.docReplaceConfirm', { name: file.name }));
        if (!confirmed) return;
      }
      handleTextChange(extractedText);
    } catch (err) {
      if (requestId !== docImportSeqRef.current) return;
      console.error('Failed to parse document:', err);
      // .docx 解析器是按需加载的独立 chunk，弱网下也可能加载失败
      const msg = err instanceof Error ? err.message : '';
      const isChunkFail = /Failed to fetch dynamically imported module|Import maps|Loading chunk/i.test(msg);
      alert(isChunkFail ? t('editor.docChunkFail') : t('editor.docParseFail'));
    }
  };

  const handleFontFileUpload = async (file: File) => {
    const requestId = ++fontUploadSeqRef.current;
    try {
      const customFont = await loadCustomFontFromFile(file);
      if (requestId !== fontUploadSeqRef.current) return;
      onAddCustomFont(customFont);
      handleHandwritingChange({
        ...handwritingRef.current,
        fontFamily: customFont.family,
      });
    } catch (err) {
      if (requestId !== fontUploadSeqRef.current) return;
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
    const requestId = ++bgUploadSeqRef.current;
    const reader = new FileReader();
    reader.onerror = () => {
      if (requestId !== bgUploadSeqRef.current) return;
      alert(t('editor.imageReadFail', { name: file.name }));
    };
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const img = new Image();
      img.onerror = () => {
        if (requestId !== bgUploadSeqRef.current) return;
        // HEIC / 截断 / 损坏的图片解码会静默失败，必须给出反馈
        alert(t('editor.imageDecodeFail', { name: file.name }));
      };
      img.onload = () => {
        if (requestId !== bgUploadSeqRef.current) return;
        const currentPaper = paperRef.current;
        const dims = calculatePaperDimensionsFromImage(img.naturalWidth, img.naturalHeight, currentPaper.width || 1200);
        handlePaperChange({
          ...currentPaper,
          type: 'custom',
          size: 'custom',
          customImageUrl: compressPaperPhoto(img, url),
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
          onTextChange={handleTextChange}
          handwriting={handwriting}
          onHandwritingChange={handleHandwritingChange}
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
          onHandwritingChange={handleHandwritingChange}
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
          onPaperChange={handlePaperChange}
          handwriting={handwriting}
          onHandwritingChange={handleHandwritingChange}
          bgImageInputRef={bgImageInputRef}
          handleBgImageUpload={handleBgImageUpload}
        />
      )}

      {/* Tab 4: Photo Realism & Custom Background */}
      {activeTab === 'photo' && (
        <PhotoTab
          paper={paper}
          onPaperChange={handlePaperChange}
          bgImageInputRef={bgImageInputRef}
          handleBgImageUpload={handleBgImageUpload}
        />
      )}
    </aside>
  );
};
