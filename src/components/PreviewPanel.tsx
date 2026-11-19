import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Minus,
  Maximize2, 
  ChevronDown,
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Loader2,
  SlidersHorizontal,
  PenLine,
  Eraser,
  Trash2
} from 'lucide-react';
import type { PaperConfig, HandwritingConfig, PageLayout, DoodleStroke, DoodlePoint } from '../engine/types';
import { renderHandwritingPageToCanvas, drawMarginGuides } from '../engine/paper';
import { drawDoodles, eraseStrokesAt } from '../engine/doodle';

interface PreviewPanelProps {
  currentPage: PageLayout | null;
  documentRevision: number;
  currentPageIndex: number;
  totalPages: number;
  onPageChange: (index: number) => void;
  paper: PaperConfig;
  handwriting: HandwritingConfig;
  customImage: HTMLImageElement | null;
  onExportCurrentPage: (format: 'png' | 'jpeg') => void;
  isExporting: boolean;
  exportProgress?: { current: number; total: number };
  /** 当前页手绘笔画（纸张坐标系） */
  doodles: DoodleStroke[];
  onDoodlesChange: (strokes: DoodleStroke[]) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  currentPage,
  documentRevision,
  currentPageIndex,
  totalPages,
  onPageChange,
  paper,
  handwriting,
  customImage,
  onExportCurrentPage,
  isExporting,
  exportProgress,
  doodles,
  onDoodlesChange,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.58); // default comfortable preview zoom
  const [showMarginGuides, setShowMarginGuides] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const moreToolsRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showMoreTools) return;
    const dismissOutside = (event: PointerEvent) => {
      if (!moreToolsRef.current?.contains(event.target as Node)) setShowMoreTools(false);
    };
    document.addEventListener('pointerdown', dismissOutside);
    return () => document.removeEventListener('pointerdown', dismissOutside);
  }, [showMoreTools]);

  const closeMoreTools = () => {
    if (!showMoreTools) return;
    setShowMoreTools(false);
    toolsButtonRef.current?.focus();
  };

  // 预览位图按设备像素比超采样，高分屏放大不糊。封顶 2 控制位图内存
  // （A4 1200×1697 ×2 每层约 32MB，预览层与手绘层各一张）。导出分辨率仍由画质档位决定，与此无关。
  const previewDpr = useRef(Math.min(2, Math.max(1, window.devicePixelRatio || 1))).current;

  // 手绘层
  const doodleCanvasRef = useRef<HTMLCanvasElement>(null);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);
  const [doodleMode, setDoodleMode] = useState<'off' | 'pen' | 'eraser'>('off');
  const activeStrokeRef = useRef<DoodleStroke | null>(null);
  const drawingRef = useRef(false);
  const doodleColor = handwriting.inkColor;
  const doodlesRef = useRef(doodles);
  doodlesRef.current = doodles;

  useLayoutEffect(() => {
    drawingRef.current = false;
    activeStrokeRef.current = null;
  }, [documentRevision]);

  // 手绘线宽写进笔画数据、导出时复用同一份；橡皮半径只在预览端做删除命中测试
  const DOODLE_WIDTH = 2.6;
  const ERASER_RADIUS = Math.max(10, paper.width * 0.018);

  const redrawDoodles = (extra: DoodleStroke | null = null) => {
    const c = doodleCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    if (c.width !== Math.round(paper.width * previewDpr)) c.width = Math.round(paper.width * previewDpr);
    if (c.height !== Math.round(paper.height * previewDpr)) c.height = Math.round(paper.height * previewDpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.scale(previewDpr, previewDpr);
    drawDoodles(ctx, doodlesRef.current);
    if (extra && extra.points.length > 0) drawDoodles(ctx, [extra]);
    ctx.restore();
  };

  // 已提交笔画、切页或纸张尺寸变化时重绘
  useEffect(() => {
    redrawDoodles(activeStrokeRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doodles, paper.width, paper.height, previewDpr, currentPageIndex]);

  const eventToPaperPoint = (e: React.PointerEvent): DoodlePoint | null => {
    const c = doodleCanvasRef.current;
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * paper.width,
      y: ((e.clientY - rect.top) / rect.height) * paper.height,
    };
  };

  const handleDoodleDown = (e: React.PointerEvent) => {
    if (doodleMode === 'off') return;
    const p = eventToPaperPoint(e);
    if (!p) return;
    drawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (doodleMode === 'eraser') {
      const next = eraseStrokesAt(doodlesRef.current, p, ERASER_RADIUS);
      if (next.length !== doodlesRef.current.length) onDoodlesChange(next);
    } else {
      activeStrokeRef.current = { points: [p], color: doodleColor, width: DOODLE_WIDTH };
      redrawDoodles(activeStrokeRef.current);
    }
  };

  const handleDoodleMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || doodleMode === 'off') return;
    const p = eventToPaperPoint(e);
    if (!p) return;
    if (doodleMode === 'eraser') {
      const next = eraseStrokesAt(doodlesRef.current, p, ERASER_RADIUS);
      if (next.length !== doodlesRef.current.length) onDoodlesChange(next);
      return;
    }
    const stroke = activeStrokeRef.current;
    if (!stroke) return;
    const last = stroke.points[stroke.points.length - 1];
    // 纸张坐标下距离 <1px 的采样点丢弃，避免点数爆炸
    if (Math.hypot(p.x - last.x, p.y - last.y) < 1) return;
    stroke.points.push(p);
    redrawDoodles(stroke);
  };

  const handleDoodleUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (doodleMode === 'pen' && activeStrokeRef.current && activeStrokeRef.current.points.length > 0) {
      onDoodlesChange([...doodlesRef.current, activeStrokeRef.current]);
    }
    activeStrokeRef.current = null;
  };

  // Render canvas whenever current page, paper, handwriting, background image, or guides change
  useEffect(() => {
    let active = true;
    const render = () => {
      if (!canvasRef.current || !currentPage || !active) return;
      renderHandwritingPageToCanvas(
        canvasRef.current,
        currentPage,
        paper,
        handwriting,
        previewDpr,
        customImage
      );

      // Draw subtle margin boundary guide lines if enabled.
      // 渲染函数返回前会 restore 到恒等变换，所以这里要自己再套一次 dpr 缩放，
      // 否则辅助线会落在未缩放的像素坐标系里、缩在左上角。
      if (showMarginGuides) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(previewDpr, previewDpr);
          drawMarginGuides(ctx, paper);
          ctx.restore();
        }
      }
    };

    render();

    // Drawing can start a font load. Only schedule a second draw if a load
    // is actually pending after the first one.
    if (document.fonts?.status === 'loading') {
      void document.fonts.ready.then(render);
    }

    return () => {
      active = false;
    };
    // previewDpr 是挂载时读一次的常量（useRef().current），列进依赖只为满足 exhaustive-deps，
    // 实际永不变化、不会引起重渲染。
  }, [currentPage, paper, handwriting, customImage, showMarginGuides, previewDpr]);

  const handleAutoFit = useCallback(() => {
    const container = containerRef.current;
    if (!container?.clientWidth || !container.clientHeight) return;
    const styles = getComputedStyle(container);
    const availableWidth = container.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    const availableHeight = container.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
    const fit = Math.min(availableWidth / paper.width, availableHeight / paper.height, 1.2);
    setZoom(Math.max(0.01, Math.floor(fit * 100) / 100));
  }, [paper.width, paper.height]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    handleAutoFit();
    // The preview can resize when the mobile view or page strip changes without a window resize.
    const observer = new ResizeObserver(handleAutoFit);
    observer.observe(container, { box: 'border-box' });
    return () => observer.disconnect();
  }, [handleAutoFit]);

  // 页码多时缩略图条会横向滚动；用上一页/下一页切页后，让当前页始终留在可视区。
  useEffect(() => {
    const strip = thumbnailStripRef.current;
    if (!strip) return;
    const active = strip.querySelector<HTMLElement>('.thumb-item.active');
    if (!active) return;
    const stripRect = strip.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const centered =
      strip.scrollLeft +
      (activeRect.left - stripRect.left) -
      (strip.clientWidth - activeRect.width) / 2;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    strip.scrollTo({ left: centered, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [currentPageIndex, totalPages]);

  const handleZoomIn = () => setZoom(prev => Math.min(1.5, Math.round((prev + 0.1) * 100) / 100));
  const handleZoomOut = () => setZoom(prev => Math.max(0.01, Math.round((prev - 0.1) * 100) / 100));

  return (
    <main className="preview-viewport">
      {/* Top Preview Toolbar */}
      <div className="preview-toolbar">
        <h2>{t('preview.title')}</h2>
        <div className="preview-tools">
          <div className="tool-set zoom-tools">
            <button className="btn btn-secondary btn-sm" onClick={handleZoomOut} disabled={zoom <= 0.01} title={t('preview.zoomOut')}>
              <Minus size={16} aria-hidden="true" />
            </button>
            <span className="preview-zoom">{Math.round(zoom * 100)}%</span>
            <button className="btn btn-secondary btn-sm" onClick={handleZoomIn} disabled={zoom >= 1.5} title={t('preview.zoomIn')}>
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
          <button className="btn btn-secondary btn-sm preview-fit" onClick={handleAutoFit} title={t('preview.resetZoom')}>
            <Maximize2 size={14} aria-hidden="true" />
            <span>{t('preview.fitPage')}</span>
          </button>
          <button
            className={`btn btn-sm ${doodleMode === 'pen' ? 'btn-primary' : 'btn-secondary'}`}
            aria-label={t('preview.doodlePen')}
            aria-pressed={doodleMode === 'pen'}
            onClick={() => setDoodleMode(m => (m === 'pen' ? 'off' : 'pen'))}
            title={t('preview.doodlePen')}
          >
            <PenLine size={14} aria-hidden="true" />
            <span>{t('preview.pen')}</span>
          </button>
          <div
            className="preview-more"
            ref={moreToolsRef}
            onKeyDown={event => {
              if (event.key === 'Escape') closeMoreTools();
            }}
          >
            <button
              type="button"
              ref={toolsButtonRef}
              className={`btn btn-sm preview-more-toggle ${doodleMode === 'eraser' ? 'btn-primary' : 'btn-secondary'}`}
              aria-expanded={showMoreTools}
              aria-controls="preview-more-tools"
              onClick={() => setShowMoreTools(open => !open)}
            >
              <span>{t(doodleMode === 'eraser' ? 'preview.eraser' : 'preview.tools')}</span>
              <ChevronDown size={13} aria-hidden="true" />
            </button>
            <div id="preview-more-tools" className="tool-set preview-more-tools" data-open={showMoreTools}>
              <button
                className={`btn btn-sm ${doodleMode === 'eraser' ? 'btn-primary' : 'btn-secondary'}`}
                aria-label={t('preview.doodleEraser')}
                aria-pressed={doodleMode === 'eraser'}
                onClick={() => {
                  setDoodleMode(m => (m === 'eraser' ? 'off' : 'eraser'));
                  closeMoreTools();
                }}
                disabled={doodles.length === 0 && doodleMode !== 'eraser'}
                title={t('preview.doodleEraser')}
              >
                <Eraser size={14} aria-hidden="true" />
                <span>{t('preview.eraser')}</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onDoodlesChange([]);
                  setDoodleMode(m => m === 'eraser' ? 'off' : m);
                  closeMoreTools();
                }}
                disabled={doodles.length === 0}
                title={t('preview.doodleClear')}
              >
                <Trash2 size={14} aria-hidden="true" />
                <span>{t('preview.doodleClear')}</span>
              </button>
              <button
                className={`btn btn-sm ${showMarginGuides ? 'btn-primary' : 'btn-secondary'}`}
                aria-label={t('preview.marginGuides')}
                aria-pressed={showMarginGuides}
                onClick={() => {
                  setShowMarginGuides(!showMarginGuides);
                  closeMoreTools();
                }}
                title={t('preview.marginGuidesTitle')}
              >
                <SlidersHorizontal size={14} aria-hidden="true" />
                <span>{t('preview.marginGuides')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawings are session-only, so leave the reminder visible while they can be lost. */}
      {(doodleMode !== 'off' || doodles.length > 0) && (
        <div className="doodle-session-hint" role="note">
          {t('preview.doodleSessionHint')}
        </div>
      )}

      {/* Main Canvas Viewport */}
      <div className="preview-canvas-container" ref={containerRef}>
        <div 
          className="paper-canvas-wrapper"
          style={{
            width: paper.width * zoom,
            height: paper.height * zoom,
          }}
        >
          <canvas
            ref={canvasRef}
            className="preview-canvas"
            width={paper.width}
            height={paper.height}
          />
          {/* 手绘批注层：覆盖在纸面上方，坐标系与纸张一致 */}
          <canvas
            ref={doodleCanvasRef}
            className="doodle-canvas"
            style={{
              pointerEvents: doodleMode === 'off' ? 'none' : 'auto',
              cursor: doodleMode === 'eraser' ? 'cell' : 'crosshair',
              touchAction: 'none',
            }}
            onPointerDown={handleDoodleDown}
            onPointerMove={handleDoodleMove}
            onPointerUp={handleDoodleUp}
            onPointerCancel={handleDoodleUp}
          />
        </div>
      </div>

      {/* Bottom Thumbnail Strip for Multi-page Navigation */}
      {totalPages > 1 && (
        <div className="thumbnail-strip" ref={thumbnailStripRef}>
          {Array.from({ length: totalPages }).map((_, index) => (
            <div 
              key={index} 
              className={`thumb-item ${currentPageIndex === index ? 'active' : ''}`}
              role="button"
              tabIndex={0}
              aria-current={currentPageIndex === index ? 'page' : undefined}
              onClick={() => onPageChange(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPageChange(index);
                }
              }}
              title={t('preview.gotoPage', { page: index + 1 })}
            >
              <span>{index + 1}</span>
            </div>
          ))}
        </div>
      )}

      <div className="preview-footer">
        <div className="preview-pagination">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex <= 0}
            title={t('preview.prevPage')}
          >
            <ChevronLeft size={14} />
          </button>

          <span aria-live="polite">
            {t('preview.pageIndicator', { current: currentPageIndex + 1, total: totalPages || 1 })}
          </span>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPageIndex + 1))}
            disabled={currentPageIndex >= totalPages - 1}
            title={t('preview.nextPage')}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onExportCurrentPage('png')}
          disabled={isExporting}
          title={isExporting ? t('preview.exporting') : t('preview.savePage')}
          aria-label={isExporting ? t('preview.exporting') : t('preview.savePage')}
        >
          <Download size={13} />
          <span className="preview-save-format">{isExporting ? t('preview.exporting') : 'PNG'}</span>
          <span className="preview-save-label">{isExporting ? t('preview.exporting') : `${t('preview.savePage')} (PNG)`}</span>
        </button>
      </div>

      {/* Exporting Progress Overlay */}
      {isExporting && exportProgress && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card" style={{ width: '380px', padding: '24px', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
            <Loader2 size={36} className="animate-spin" color="var(--primary)" />
            <div>
              <h4 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '6px' }}>{t('preview.generatingTitle')}</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {t('preview.progress', { current: exportProgress.current, total: exportProgress.total })}
              </p>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${(exportProgress.current / exportProgress.total) * 100}%`, 
                  height: '100%', 
                  background: 'var(--primary)',
                  transition: 'width 0.2s ease'
                }} 
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
};
