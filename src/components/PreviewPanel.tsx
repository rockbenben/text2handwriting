import { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
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
  currentPageIndex: number;
  totalPages: number;
  onPageChange: (index: number) => void;
  paper: PaperConfig;
  handwriting: HandwritingConfig;
  onExportCurrentPage: (format: 'png' | 'jpeg') => void;
  isExporting: boolean;
  exportProgress?: { current: number; total: number };
  /** 当前页手绘笔画（纸张坐标系） */
  doodles: DoodleStroke[];
  onDoodlesChange: (strokes: DoodleStroke[]) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  currentPage,
  currentPageIndex,
  totalPages,
  onPageChange,
  paper,
  handwriting,
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
  const [customImgElement, setCustomImgElement] = useState<HTMLImageElement | null>(null);
  const [showMarginGuides, setShowMarginGuides] = useState(false);

  // 预览位图按设备像素比超采样，高分屏放大不糊。封顶 2 控制显存
  // （A4 1200×1697 ×2 约 32MB 位图）。导出分辨率仍由画质档位决定，与此无关。
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

  // 手绘线宽 / 橡皮半径都在纸张坐标系定义，导出与预览用同一套数值
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

  // 已提交笔画或纸张尺寸变化时重绘
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

  // Load custom image if URL provided
  useEffect(() => {
    let active = true;
    if (paper.customImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (active) setCustomImgElement(img);
      };
      img.onerror = () => {
        if (active) setCustomImgElement(null);
      };
      img.src = paper.customImageUrl;
    } else {
      setCustomImgElement(null);
    }
    return () => {
      active = false;
    };
  }, [paper.customImageUrl]);

  // Render canvas whenever current page, paper, or handwriting changes
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
        customImgElement
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

    // Re-render immediately when fonts finish asynchronous loading
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        render();
      });
    }

    return () => {
      active = false;
    };
    // previewDpr 是挂载时读一次的常量（useRef().current），列进依赖只为满足 exhaustive-deps，
    // 实际永不变化、不会引起重渲染。
  }, [currentPage, paper, handwriting, customImgElement, showMarginGuides, previewDpr]);

  // Auto-fit zoom based on container viewport dimensions
  // useCallback 是必需的：下面的 effect 把它当依赖注册 resize 监听，
  // 若每次渲染都产生新引用，监听会被反复解绑重绑。依赖纸张尺寸即可。
  const handleAutoFit = useCallback(() => {
    if (containerRef.current) {
      const containerW = containerRef.current.clientWidth - 60;
      const containerH = containerRef.current.clientHeight - 60;
      const fitW = containerW / paper.width;
      const fitH = containerH / paper.height;
      // 缩放下限：桌面 0.38 是「别缩到看不清」的底线，但手机上一个 A4 页面
      // 大约要 0.2 才塞得进屏幕，卡死在 0.38 会让预览永远横向溢出。
      // 只在窄屏放宽，桌面仍取 0.38，行为不变。
      const minZoom = window.matchMedia('(max-width: 900px)').matches ? 0.18 : 0.38;
      const optimal = Math.max(minZoom, Math.min(1.2, Math.min(fitW, fitH)));
      setZoom(Math.round(optimal * 100) / 100);
    } else {
      setZoom(0.65);
    }
  }, [paper.width, paper.height]);

  useEffect(() => {
    handleAutoFit();
    window.addEventListener('resize', handleAutoFit);
    return () => window.removeEventListener('resize', handleAutoFit);
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
    strip.scrollTo({ left: Math.max(0, centered), behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [currentPageIndex, totalPages]);

  const handleZoomIn = () => setZoom((prev) => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10));
  // 下限必须低于窄屏自动适配的最小值（0.18），否则在手机上点「缩小」反而会放大：
  // 18% - 10% = 8%，被 0.3 的下限抬到 30%。
  const handleZoomOut = () => setZoom((prev) => Math.max(0.1, Math.round((prev - 0.1) * 10) / 10));
  const handleResetZoom = handleAutoFit;

  return (
    <main className="preview-viewport">
      {/* Top Preview Toolbar */}
      <div className="preview-toolbar">
        {/* Page Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex <= 0}
            title={t('preview.prevPage')}
          >
            <ChevronLeft size={14} />
          </button>

          <span style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0', minWidth: '85px', textAlign: 'center' }}>
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

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleZoomOut} title={t('preview.zoomOut')}>
            <ZoomOut size={13} />
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '42px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button className="btn btn-secondary btn-sm" onClick={handleZoomIn} title={t('preview.zoomIn')}>
            <ZoomIn size={13} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleResetZoom} title={t('preview.resetZoom')}>
            <Maximize2 size={13} />
          </button>

          <button 
            className={`btn btn-sm ${showMarginGuides ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setShowMarginGuides(!showMarginGuides)}
            title={t('preview.marginGuidesTitle')}
          >
            <SlidersHorizontal size={13} />
            <span>{t('preview.marginGuides')}</span>
          </button>

          {/* Freehand doodle tools */}
          <button
            className={`btn btn-sm ${doodleMode === 'pen' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDoodleMode(m => (m === 'pen' ? 'off' : 'pen'))}
            title={t('preview.doodlePen')}
          >
            <PenLine size={13} />
          </button>
          <button
            className={`btn btn-sm ${doodleMode === 'eraser' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDoodleMode(m => (m === 'eraser' ? 'off' : 'eraser'))}
            disabled={doodles.length === 0}
            title={t('preview.doodleEraser')}
          >
            <Eraser size={13} />
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onDoodlesChange([])}
            disabled={doodles.length === 0}
            title={t('preview.doodleClear')}
          >
            <Trash2 size={13} />
          </button>

          <button
            className="btn btn-primary btn-sm toolbar-export"
            onClick={() => onExportCurrentPage('png')}
            disabled={isExporting}
            title={isExporting ? t('preview.exporting') : t('preview.savePage')}
            aria-label={isExporting ? t('preview.exporting') : t('preview.savePage')}
          >
            <Download size={13} />
            <span>{isExporting ? t('preview.exporting') : t('preview.savePage')}</span>
          </button>
        </div>
      </div>

      {/*
        手绘只在当前会话有效，但工具栏里只有图标，移动端也没有 hover title；
        用户在纸上画完再刷新时没有任何提示，会以为批注已经保存。
      */}
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
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <canvas
            ref={canvasRef}
            className="preview-canvas"
            width={paper.width}
            height={paper.height}
            style={{ width: `${paper.width}px` }}
          />
          {/* 手绘批注层：覆盖在纸面上方，坐标系与纸张一致 */}
          <canvas
            ref={doodleCanvasRef}
            className="doodle-canvas"
            style={{
              width: `${paper.width}px`,
              height: `${paper.height}px`,
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

      {/* Exporting Progress Overlay */}
      {isExporting && exportProgress && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ width: '380px', padding: '24px', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
            <Loader2 size={36} className="animate-spin" color="#3b82f6" />
            <div>
              <h4 style={{ fontSize: '16px', color: '#fff', marginBottom: '6px' }}>{t('preview.generatingTitle')}</h4>
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
        </div>
      )}
    </main>
  );
};
