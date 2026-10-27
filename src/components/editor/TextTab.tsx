import { useTranslation } from 'react-i18next';
import { FileUp, RotateCcw } from 'lucide-react';
import { SECTION_DEFAULTS } from '../../engine/storage';
import type { RefObject } from 'react';
import type { HandwritingConfig } from '../../engine/types';

interface TextTabProps {
  text: string;
  onTextChange: (text: string) => void;
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

/** 由 EditorPanel 的「text」tab 逐字抽出，未改行为。 */
export const TextTab: React.FC<TextTabProps> = ({
  text,
  onTextChange,
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
    <div className="tab-content">
      <div className="text-editor-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
            {t('editor.textTitle')}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
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
              onClick={() => {
                if (text.trim() && !window.confirm(t('confirm.clearText'))) return;
                onTextChange('');
              }}
              title={t('editor.clearTitle')}
            >
              <span>{t('common.clear')}</span>
            </button>
          </div>
        </div>

        {/* Quick Inline Handwriting Markup Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap',
          padding: '6px 8px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', marginInlineEnd: '2px' }}>{t('editor.tagInsert')}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '1px 6px', height: '22px' }}
            onClick={() => handleInsertTag('~~', '~~', t('editor.insertWord.typo'))}
            title={t('editor.tagScratchTitle')}
          >
            <s>{t('editor.tagScratch')}</s>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '1px 6px', height: '22px' }}
            onClick={() => handleInsertTag(t('editor.token.delCorrect'), '[/del]', t('editor.insertWord.typo'))}
            title={t('editor.tagCorrectTitle')}
          >
            <span>{t('editor.tagCorrect')}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '1px 6px', height: '22px' }}
            onClick={() => handleInsertTag('[u]', '[/u]', t('editor.insertWord.keyword'))}
            title={t('editor.tagUnderlineTitle')}
          >
            <u>{t('editor.tagUnderline')}</u>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '1px 6px', height: '22px' }}
            onClick={() => handleInsertTag('[circle]', '[/circle]', t('editor.insertWord.keyword'))}
            title={t('editor.tagCircleTitle')}
          >
            <span>{t('editor.tagCircle')}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '1px 6px', height: '22px' }}
            onClick={() => handleInsertTag('[box]', '[/box]', t('editor.insertWord.boxed'))}
            title={t('editor.tagBoxTitle')}
          >
            <span>{t('editor.tagBox')}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '1px 6px', height: '22px' }}
            onClick={() => handleInsertTag('[right]', '[/right]', t('editor.insertWord.signature'))}
            title={t('editor.tagRightTitle')}
          >
            <span>{t('editor.tagRight')}</span>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="editor-textarea"
          placeholder={t('editor.textareaPlaceholder')}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
        />

        {/* 标记语法提示：让内联标签功能可被发现 */}
        <details className="tag-hint" style={{ marginBottom: '8px' }}>
          <summary style={{ fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
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
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              {t('editor.freeformTitle')}
            </span>
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid rgba(51, 65, 85, 0.5)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={handwriting.alignToLines}
                onChange={(e) => onHandwritingChange({ ...handwriting, alignToLines: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              <span>{t('editor.snapLines')}</span>
            </label>
            {!handwriting.alignToLines && (
              <span style={{ fontSize: '11px', color: '#38bdf8' }}>
                {t('editor.freeLineHeight', { n: handwriting.lineHeight })}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#cbd5e1' }} title={t('editor.smartSignatureTitle')}>
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

        <div className="editor-stats">
          <span>{t('editor.stats', { chars: totalChars, lines: text.split(/\r?\n/).length })}</span>
          <span style={{ color: '#60a5fa' }}>{t('editor.estimatedPages', { pages: totalPages })}</span>
        </div>

        {/* Drag & drop file area */}
        <div 
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
          <FileUp size={20} color="#60a5fa" />
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>
            {t('editor.dropPrimary')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
            {t('editor.dropSecondary')}
          </div>
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
        </div>
      </div>
    </div>
  );
};
