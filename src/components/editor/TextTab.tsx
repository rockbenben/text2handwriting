import { useTranslation } from 'react-i18next';
import { FileUp, RotateCcw } from 'lucide-react';
import { SECTION_DEFAULTS } from '../../engine/storage';
import type { RefObject } from 'react';
import type { HandwritingConfig } from '../../engine/types';

interface TextTabProps {
  text: string;
  onTextChange: (text: string) => void;
  onClearText: () => void;
  handwriting: HandwritingConfig;
  onHandwritingChange: (handwriting: HandwritingConfig) => void;
  onSelectSampleText: () => void;
  totalChars: number;
  totalPages: number;
  isDraggingFile: boolean;
  setIsDraggingFile: (v: boolean) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  handleInsertTag: (prefix: string, suffix: string, defaultText?: string) => void;
  handleDocFileUpload: (file: File) => void;
}

export const TextTab: React.FC<TextTabProps> = ({
  text,
  onTextChange,
  onClearText,
  handwriting,
  onHandwritingChange,
  onSelectSampleText,
  totalChars,
  totalPages,
  isDraggingFile,
  setIsDraggingFile,
  fileInputRef,
  textareaRef,
  handleInsertTag,
  handleDocFileUpload,
}) => {
  const { t } = useTranslation();

  return (
    <div className="tab-content text-tab">
      <div className="text-editor-container">
        <div className="document-heading">
          <label htmlFor="document-text">{t('editor.textTitle')}</label>
          <div className="document-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={onSelectSampleText}
              title={t('editor.resetSampleTitle')}
            >
              <RotateCcw size={12} />
              <span>{t('editor.resetSample')}</span>
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={onClearText}
              title={t('editor.clearTitle')}
            >
              <span>{t('common.clear')}</span>
            </button>
          </div>
        </div>

        {/* Quick Inline Handwriting Markup Toolbar */}
        <div className="markup-toolbar">
          <span>{t('editor.tagInsert')}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleInsertTag('~~', '~~', t('editor.insertWord.typo'))}
            title={t('editor.tagScratchTitle')}
          >
            <s>{t('editor.tagScratch')}</s>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleInsertTag(t('editor.token.delCorrect'), '[/del]', t('editor.insertWord.typo'))}
            title={t('editor.tagCorrectTitle')}
          >
            <span>{t('editor.tagCorrect')}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleInsertTag('[u]', '[/u]', t('editor.insertWord.keyword'))}
            title={t('editor.tagUnderlineTitle')}
          >
            <u>{t('editor.tagUnderline')}</u>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleInsertTag('[circle]', '[/circle]', t('editor.insertWord.keyword'))}
            title={t('editor.tagCircleTitle')}
          >
            <span>{t('editor.tagCircle')}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleInsertTag('[box]', '[/box]', t('editor.insertWord.boxed'))}
            title={t('editor.tagBoxTitle')}
          >
            <span>{t('editor.tagBox')}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleInsertTag('[right]', '[/right]', t('editor.insertWord.signature'))}
            title={t('editor.tagRightTitle')}
          >
            <span>{t('editor.tagRight')}</span>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          id="document-text"
          dir="auto"
          className="editor-textarea"
          placeholder={t('editor.textareaPlaceholder')}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
        />

        <div className="editor-stats">
          <span>{t('editor.stats', { chars: totalChars, lines: text.split(/\r?\n/).length })}</span>
          <span className="editor-page-count">{t('editor.estimatedPages', { pages: totalPages })}</span>
        </div>

        {/* Drag & drop file area */}
        <button type="button"
          className={`file-drop-zone ${isDraggingFile ? 'dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingFile(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleDocFileUpload(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileUp size={17} aria-hidden="true" />
          <span>{t('editor.importFile')}</span>
          <small dir="ltr">.docx, .txt, .md</small>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".docx,.txt,.md"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleDocFileUpload(e.target.files[0]);
            }
            // 重置后同名文件才能被重新选择（否则 onChange 不再触发）
            e.target.value = '';
          }}
        />

        {/* 标记语法提示：让内联标签功能可被发现 */}
        <details className="editor-disclosure tag-hint">
          <summary>
            {t('editor.tagHintSummary')}
          </summary>
          <div style={{ marginTop: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { tag: t('editor.tagDemo.scratch'), desc: t('editor.tagDescScratch') },
              { tag: t('editor.tagDemo.del'), desc: t('editor.tagDescScratch') },
              { tag: t('editor.tagDemo.correct'), desc: t('editor.tagDescCorrect') },
              { tag: t('editor.tagDemo.underline'), desc: t('editor.tagDescUnderline') },
              { tag: t('editor.tagDemo.circle'), desc: t('editor.tagDescCircle') },
              { tag: t('editor.tagDemo.box'), desc: t('editor.tagDescBox') },
            ].map(row => (
              <div key={row.tag} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                <code style={{ flex: '0 0 auto', color: 'var(--accent)', background: 'var(--bg-card)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{row.tag}</code>
                <span style={{ flex: 1 }} />
                <span style={{ color: 'var(--text-muted)' }}>{row.desc}</span>
              </div>
            ))}
          </div>
        </details>

        {/* Freeform Writing & Indentation Quick Controls */}
        <details className="editor-disclosure">
          <summary>{t('editor.freeformTitle')}</summary>
          <div className="layout-options">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                  {handwriting.paragraphIndent === 0
                    ? t('editor.freeMode')
                    : t('editor.indentN', { n: handwriting.paragraphIndent })}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '1px 6px', height: '20px', display: 'flex', alignItems: 'center', gap: '3px' }}
                  onClick={() => onHandwritingChange({
                    ...handwriting,
                    paragraphIndent: SECTION_DEFAULTS.freeform.paragraphIndent,
                    alignToLines: SECTION_DEFAULTS.freeform.alignToLines,
                    smartSignatureAlign: SECTION_DEFAULTS.freeform.smartSignatureAlign,
                  })}
                  title={t('editor.freeformResetTitle')}
                >
                  <RotateCcw size={10} />
                  <span>{t('common.reset')}</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn btn-sm ${handwriting.paragraphIndent === 0 ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '12px', padding: '5px 4px', justifyContent: 'center' }}
                onClick={() => onHandwritingChange({ ...handwriting, paragraphIndent: 0 })}
                title={t('editor.freeInputTitle')}
              >
                {t('editor.freeInput')}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${handwriting.paragraphIndent === 2 ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '12px', padding: '5px 4px', justifyContent: 'center' }}
                onClick={() => onHandwritingChange({ ...handwriting, paragraphIndent: 2 })}
                title={t('editor.indent2Title')}
              >
                {t('editor.indent2')}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${handwriting.paragraphIndent === 4 ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '12px', padding: '5px 4px', justifyContent: 'center' }}
                onClick={() => onHandwritingChange({ ...handwriting, paragraphIndent: 4 })}
                title={t('editor.indent4Title')}
              >
                {t('editor.indent4')}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-main)' }}>
                <input
                  type="checkbox"
                  checked={handwriting.alignToLines}
                  onChange={(e) => onHandwritingChange({ ...handwriting, alignToLines: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <span>{t('editor.snapLines')}</span>
              </label>
              {!handwriting.alignToLines && (
                <span style={{ fontSize: '11px', color: 'var(--primary)' }}>
                  {t('editor.freeLineHeight', { n: handwriting.lineHeight })}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-main)' }} title={t('editor.smartSignatureTitle')}>
                <input
                  type="checkbox"
                  checked={handwriting.smartSignatureAlign !== false}
                  onChange={(e) => onHandwritingChange({ ...handwriting, smartSignatureAlign: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <span>{t('editor.smartSignature')}</span>
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {t('editor.supportsRightTag')}
              </span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};
