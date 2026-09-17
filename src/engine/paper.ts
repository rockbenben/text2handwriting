import type { PaperConfig, PaperSize, PageLayout, HandwritingConfig, RenderChar } from './types';

export function getPaperDimensions(size: PaperSize, scale = 1.0): { width: number; height: number } {
  let baseWidth = 1200;
  let baseHeight = 1697;

  switch (size) {
    case 'b5':
      baseWidth = 1050;
      baseHeight = 1485;
      break;
    case 'a5':
      baseWidth = 848;
      baseHeight = 1200;
      break;
    case 'a4':
    default:
      baseWidth = 1200;
      baseHeight = 1697;
      break;
  }

  return {
    width: Math.round(baseWidth * scale),
    height: Math.round(baseHeight * scale),
  };
}

/**
 * Calculates optimal paper dimensions matching an uploaded background image's natural aspect ratio,
 * preventing any distortion or stretching.
 */
export function calculatePaperDimensionsFromImage(
  naturalWidth: number,
  naturalHeight: number,
  baseWidth = 1200
): { width: number; height: number; aspectRatio: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return { width: 1200, height: 1697, aspectRatio: 1200 / 1697 };
  }
  const aspectRatio = naturalWidth / naturalHeight;
  const width = Math.round(baseWidth);
  const height = Math.round(baseWidth / aspectRatio);
  return { width, height, aspectRatio };
}

export interface HDPaperPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  previewColor: string;
  createBackground: (width: number, height: number) => string;
}

export const HD_PAPER_PRESETS: HDPaperPreset[] = [
  {
    id: 'parchment_hd',
    name: '复古泛黄羊皮信笺',
    category: 'vintage',
    description: '茶渍微黄边缘，历史质感羊皮纸纹理，适合情书散文',
    previewColor: '#f4ebd0',
    createBackground: (w: number, h: number) => {
      if (typeof document === 'undefined') return 'data:image/png;base64,';
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return 'data:image/png;base64,';

      // Base warm parchment
      ctx.fillStyle = '#f6f1df';
      ctx.fillRect(0, 0, w, h);

      // Vignette tea-stained edges
      const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
      grad.addColorStop(0, 'rgba(246, 241, 223, 0)');
      grad.addColorStop(0.7, 'rgba(218, 192, 145, 0.35)');
      grad.addColorStop(1, 'rgba(168, 130, 80, 0.65)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Horizontal aging bands
      for (let y = 0; y < h; y += 40) {
        ctx.fillStyle = y % 80 === 0 ? 'rgba(180, 140, 90, 0.04)' : 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(0, y, w, 20);
      }

      return c.toDataURL('image/png');
    },
  },
  {
    id: 'kraft_hd',
    name: '高清有机牛皮纸',
    category: 'kraft',
    description: '天然草木纤维、自然粗粝手感牛皮纸，文艺手作手札风',
    previewColor: '#e0c088',
    createBackground: (w: number, h: number) => {
      if (typeof document === 'undefined') return 'data:image/png;base64,';
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return 'data:image/png;base64,';

      // Kraft gradient
      const kraft = ctx.createLinearGradient(0, 0, w, h);
      kraft.addColorStop(0, '#e5cca0');
      kraft.addColorStop(0.5, '#deb887');
      kraft.addColorStop(1, '#c89e63');
      ctx.fillStyle = kraft;
      ctx.fillRect(0, 0, w, h);

      // Organic texture flecks
      ctx.fillStyle = 'rgba(100, 60, 20, 0.07)';
      for (let i = 0; i < 150; i++) {
        const rx = (Math.sin(i * 19.3) * 0.5 + 0.5) * w;
        const ry = (Math.cos(i * 31.7) * 0.5 + 0.5) * h;
        const rw = 2 + (i % 5);
        const rh = 1 + (i % 3);
        ctx.fillRect(rx, ry, rw, rh);
      }

      // Edge shadow
      const edge = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
      edge.addColorStop(0, 'rgba(0,0,0,0)');
      edge.addColorStop(1, 'rgba(80, 45, 15, 0.3)');
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, w, h);

      return c.toDataURL('image/png');
    },
  },
  {
    id: 'dowling_cream_hd',
    name: '护眼米黄道林纸',
    category: 'clean',
    description: '温润微黄道林纸，柔和护眼不反光，经典实体书籍内页',
    previewColor: '#fcf8ec',
    createBackground: (w: number, h: number) => {
      if (typeof document === 'undefined') return 'data:image/png;base64,';
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return 'data:image/png;base64,';

      // Warm cream
      ctx.fillStyle = '#faf6ea';
      ctx.fillRect(0, 0, w, h);

      // Gentle ambient lighting
      const light = ctx.createLinearGradient(0, 0, w, h);
      light.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      light.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      light.addColorStop(1, 'rgba(180, 160, 130, 0.15)');
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, w, h);

      return c.toDataURL('image/png');
    },
  },
  {
    id: 'creased_notebook_hd',
    name: '折痕实拍老手札',
    category: 'creased',
    description: '带有轻度中间书脊折痕与自然翻页磨损的真实笔记本质感',
    previewColor: '#f5f3eb',
    createBackground: (w: number, h: number) => {
      if (typeof document === 'undefined') return 'data:image/png;base64,';
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return 'data:image/png;base64,';

      ctx.fillStyle = '#f4f2ea';
      ctx.fillRect(0, 0, w, h);

      // Spine crease down the middle
      const crease = ctx.createLinearGradient(0, h * 0.49, 0, h * 0.51);
      crease.addColorStop(0, 'rgba(0, 0, 0, 0)');
      crease.addColorStop(0.48, 'rgba(0, 0, 0, 0.12)');
      crease.addColorStop(0.52, 'rgba(255, 255, 255, 0.18)');
      crease.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = crease;
      ctx.fillRect(0, h * 0.45, w, h * 0.1);

      // Natural corner wear
      const corner = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.72);
      corner.addColorStop(0, 'rgba(0,0,0,0)');
      corner.addColorStop(1, 'rgba(60, 40, 20, 0.22)');
      ctx.fillStyle = corner;
      ctx.fillRect(0, 0, w, h);

      return c.toDataURL('image/png');
    },
  },
];

/**
 * Returns ruled line positions across the paper.
 * If fullSheet is true (default when rendering notebook background), lines span the entire notebook sheet
 * rather than being chopped off by text writing margins.
 * If fullSheet is false, lines are restricted between marginTop and height - marginBottom.
 */
export function getRuledLinePositions(paper: PaperConfig, fullSheet: boolean = false): { y: number }[] {
  const lines: { y: number }[] = [];
  const step = paper.lineSpacing > 0 ? paper.lineSpacing : 50;

  if (!fullSheet) {
    const startY = paper.marginTop;
    const endY = paper.height - paper.marginBottom;
    for (let y = startY; y <= endY; y += step) {
      lines.push({ y });
    }
    return lines;
  }

  // Full sheet notebook lines: extend upward to sheet header (~80px) and downward to footer (~60px)
  let topY = paper.marginTop;
  while (topY - step >= 80) {
    topY -= step;
  }
  let bottomY = paper.height - paper.marginBottom;
  while (bottomY + step <= paper.height - 60) {
    bottomY += step;
  }

  for (let y = topY; y <= bottomY; y += step) {
    lines.push({ y });
  }
  return lines;
}

/**
 * Returns the X coordinate of the vertical margin line on ruled paper,
 * positioned strictly to the left of marginLeft (text writing area).
 */
export function getVerticalMarginLineX(paper: PaperConfig): number | null {
  if (paper.type !== 'ruled' || paper.showMarginLine === false) {
    return null;
  }
  // Notebook binder margin line stays on the left without getting dragged by text writing margins
  return Math.min(104, paper.marginLeft - 16);
}

export function getGridCells(paper: PaperConfig): { cols: number; rows: number; cellWidth: number; cellHeight: number } {
  const contentWidth = paper.width - paper.marginLeft - paper.marginRight;
  const contentHeight = paper.height - paper.marginTop - paper.marginBottom;

  const cols = paper.gridCols && paper.gridCols > 0 ? paper.gridCols : 20;
  const cellWidth = contentWidth / cols;
  const rows = paper.gridRows && paper.gridRows > 0 ? paper.gridRows : Math.floor(contentHeight / cellWidth);
  const cellHeight = cellWidth; // square grid

  return { cols, rows, cellWidth, cellHeight };
}

/**
 * Calculates optimal recommended font size based on current paper type and geometry
 */
export function getRecommendedFontSize(paper: PaperConfig): number {
  if (paper.type === 'grid') {
    const { cellWidth } = getGridCells(paper);
    return Math.max(18, Math.min(54, Math.round(cellWidth * 0.72)));
  }

  const lineSpacing = paper.lineSpacing || 56;
  return Math.max(18, Math.min(64, Math.round(lineSpacing * 0.68)));
}

/**
 * Renders the paper background onto canvas context
 */
export function renderPaperBackground(
  ctx: CanvasRenderingContext2D,
  paper: PaperConfig,
  customImage?: HTMLImageElement | null
): void {
  const { width, height } = paper;

  // 1. Draw base background
  // Always fill base background first to prevent transparent canvas or ghosting on re-render
  if (paper.type === 'kraft') {
    ctx.fillStyle = '#f3e5ab';
    ctx.fillRect(0, 0, width, height);
    // Add kraft paper texture warmth
    const kraftGrad = ctx.createLinearGradient(0, 0, width, height);
    kraftGrad.addColorStop(0, 'rgba(218, 185, 137, 0.4)');
    kraftGrad.addColorStop(0.5, 'rgba(235, 213, 179, 0.2)');
    kraftGrad.addColorStop(1, 'rgba(196, 156, 102, 0.45)');
    ctx.fillStyle = kraftGrad;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Ultra-realistic soft warm white
    ctx.fillStyle = '#fdfdfb';
    ctx.fillRect(0, 0, width, height);
  }

  if (customImage && customImage.complete && customImage.naturalWidth > 0) {
    ctx.save();
    const brightness = paper.bgBrightness ?? 1.0;
    const contrast = paper.bgContrast ?? 1.0;
    if (brightness !== 1.0 || contrast !== 1.0) {
      ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
    }
    const opacity = paper.bgOpacity ?? 1.0;
    ctx.globalAlpha = Math.max(0.05, Math.min(1.0, opacity));

    const fit = paper.bgFit || 'cover';
    if (fit === 'stretch') {
      ctx.drawImage(customImage, 0, 0, width, height);
    } else {
      const imgW = customImage.naturalWidth;
      const imgH = customImage.naturalHeight;
      const imgRatio = imgW / imgH;
      const canvasRatio = width / height;

      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (fit === 'cover') {
        if (imgRatio > canvasRatio) {
          drawW = height * imgRatio;
          drawX = (width - drawW) / 2;
        } else {
          drawH = width / imgRatio;
          drawY = (height - drawH) / 2;
        }
      } else {
        // contain
        if (imgRatio > canvasRatio) {
          drawH = width / imgRatio;
          drawY = (height - drawH) / 2;
        } else {
          drawW = height * imgRatio;
          drawX = (width - drawW) / 2;
        }
      }
      ctx.drawImage(customImage, drawX, drawY, drawW, drawH);
    }
    ctx.restore();
  }

  // 2. Draw guidelines if enabled
  if (paper.showLineGuide !== false) {
    drawPaperGuidelines(ctx, paper);
  }

  // 3. Realistic Photo / Ambient lighting effects
  if (paper.paperTexture === 'photo' || paper.vignette) {
    renderPhotoLightingEffects(ctx, paper);
  }
}

function drawPaperGuidelines(ctx: CanvasRenderingContext2D, paper: PaperConfig): void {
  const { width, height, marginLeft, marginTop, marginBottom } = paper;

  ctx.save();

  if (paper.type === 'ruled') {
    // Full sheet notebook lines (not clipped by text writing margins)
    const lines = getRuledLinePositions(paper, true);
    const lineColor = paper.lineColor || 'rgba(160, 185, 220, 0.55)';
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.2;

    const lineStartX = 50;
    const lineEndX = width - 50;

    for (const line of lines) {
      ctx.beginPath();
      ctx.moveTo(lineStartX, line.y);
      ctx.lineTo(lineEndX, line.y);
      ctx.stroke();
    }

    // Left vertical margin line (classic red binder margin line)
    const marginLineX = getVerticalMarginLineX(paper);
    if (marginLineX !== null) {
      ctx.strokeStyle = paper.marginLineColor || 'rgba(244, 114, 114, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(marginLineX, Math.min(80, marginTop * 0.6));
      ctx.lineTo(marginLineX, height - Math.min(60, marginBottom * 0.6));
      ctx.stroke();
    }
  } else if (paper.type === 'grid') {
    const { cols, rows, cellWidth, cellHeight } = getGridCells(paper);
    const lineColor = paper.lineColor || 'rgba(239, 68, 68, 0.4)'; // classic red composition grid
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.0;

    for (let r = 0; r <= rows; r++) {
      const y = marginTop + r * cellHeight;
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft + cols * cellWidth, y);
      ctx.stroke();
    }

    for (let c = 0; c <= cols; c++) {
      const x = marginLeft + c * cellWidth;
      ctx.beginPath();
      ctx.moveTo(x, marginTop);
      ctx.lineTo(x, marginTop + rows * cellHeight);
      ctx.stroke();
    }
  } else if (paper.type === 'english') {
    // English 4-line 3-space notebook spanning full notebook sheet
    const lines = getRuledLinePositions(paper, true);
    const unitHeight = paper.lineSpacing / 3;
    const lineStartX = 50;
    const lineEndX = width - 50;

    for (const line of lines) {
      // Line 1: top line (red or blue)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(lineStartX, line.y);
      ctx.lineTo(lineEndX, line.y);
      ctx.stroke();

      // Line 2: middle upper dashed line
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
      ctx.lineWidth = 1.0;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(lineStartX, line.y + unitHeight);
      ctx.lineTo(lineEndX, line.y + unitHeight);
      ctx.stroke();

      // Line 3: baseline (blue)
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(lineStartX, line.y + unitHeight * 2);
      ctx.lineTo(lineEndX, line.y + unitHeight * 2);
      ctx.stroke();

      // Line 4: bottom line
      ctx.beginPath();
      ctx.moveTo(lineStartX, line.y + unitHeight * 3);
      ctx.lineTo(lineEndX, line.y + unitHeight * 3);
      ctx.stroke();
    }
  } else if (paper.type === 'dot') {
    const dotSpacing = paper.lineSpacing || 40;
    const dotColor = paper.lineColor || 'rgba(100, 116, 139, 0.35)';
    ctx.fillStyle = dotColor;

    for (let y = 80; y <= height - 60; y += dotSpacing) {
      for (let x = 50; x <= width - 50; x += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (paper.type === 'kraft') {
    // Vintage ruled lines spanning notebook sheet
    const lines = getRuledLinePositions(paper, true);
    ctx.strokeStyle = paper.lineColor || 'rgba(139, 94, 60, 0.35)';
    ctx.lineWidth = 1.2;
    const lineStartX = 50;
    const lineEndX = width - 50;

    for (const line of lines) {
      ctx.beginPath();
      ctx.moveTo(lineStartX, line.y);
      ctx.lineTo(lineEndX, line.y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function renderPhotoLightingEffects(ctx: CanvasRenderingContext2D, paper: PaperConfig): void {
  const { width, height } = paper;
  const intensity = paper.shadowIntensity ?? 0.25;

  ctx.save();

  // 1. Ambient lighting gradient: Light coming from top-left, gentle shadow on bottom-right
  const lightGrad = ctx.createRadialGradient(
    width * 0.25,
    height * 0.15,
    width * 0.1,
    width * 0.5,
    height * 0.6,
    Math.max(width, height) * 0.85
  );
  lightGrad.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.4})`);
  lightGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  lightGrad.addColorStop(1, `rgba(15, 23, 42, ${intensity * 0.55})`);
  ctx.fillStyle = lightGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Corner Vignette
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.4,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, `rgba(30, 20, 10, ${intensity * 0.4})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // 3. Subtle paper crease / fold shadow across middle
  if (paper.paperTexture === 'creased') {
    ctx.beginPath();
    const creaseGrad = ctx.createLinearGradient(0, height * 0.48, 0, height * 0.52);
    creaseGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    creaseGrad.addColorStop(0.48, 'rgba(0, 0, 0, 0.08)');
    creaseGrad.addColorStop(0.52, 'rgba(255, 255, 255, 0.12)');
    creaseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = creaseGrad;
    ctx.fillRect(0, height * 0.45, width, height * 0.1);
  }

  ctx.restore();
}

export function formatFontFamilyForCanvas(fontFamily: string): string {
  const trimmed = fontFamily.trim();
  if (!trimmed) return '"KaiTi", "STKaiti", "Microsoft YaHei", sans-serif';

  // If it already contains comma-separated font stack, format each entry properly
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(part => {
      const p = part.trim();
      if (!p) return '';
      // Generic CSS families must NOT be quoted
      if (/^(sans-serif|serif|cursive|monospace|fantasy|system-ui)$/i.test(p)) {
        return p;
      }
      // Strip any existing outer quotes and re-wrap cleanly
      const unquoted = p.replace(/^['"]+|['"]+$/g, '').trim();
      return `"${unquoted}"`;
    }).filter(Boolean);

    return parts.join(', ');
  }

  // Single font name: strip any extra quotes and wrap cleanly
  const unquoted = trimmed.replace(/^['"]+|['"]+$/g, '').trim();
  if (/^(sans-serif|serif|cursive|monospace|fantasy|system-ui)$/i.test(unquoted)) {
    return unquoted;
  }
  return `"${unquoted}"`;
}

export function buildCanvasFont(fontSize: number, fontFamily: string): string {
  const formattedFamily = formatFontFamilyForCanvas(fontFamily);
  return `${Math.round(fontSize)}px ${formattedFamily}, "KaiTi", "STKaiti", "Microsoft YaHei", sans-serif`;
}

/**
 * Main rendering function for drawing a complete handwriting page to HTMLCanvasElement
 */
export function renderHandwritingPageToCanvas(
  canvas: HTMLCanvasElement,
  pageLayout: PageLayout,
  paper: PaperConfig,
  config: HandwritingConfig,
  scale = 1.0,
  customImage?: HTMLImageElement | null
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const targetWidth = Math.round(paper.width * scale);
  const targetHeight = Math.round(paper.height * scale);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  ctx.save();
  ctx.scale(scale, scale);
  if (typeof ctx.clearRect === 'function') {
    ctx.clearRect(0, 0, paper.width, paper.height);
  }

  // 1. Draw Paper Background
  renderPaperBackground(ctx, paper, customImage);

  // 2. Draw Handwritten Text Characters
  for (const item of pageLayout.chars) {
    ctx.save();

    // Position & Rotation transformation
    ctx.translate(item.x, item.y);
    if (item.rotation !== 0) {
      ctx.rotate(item.rotation);
    }

    // Organic glyph deformation (breaking computer font uniformity with optical center anchor)
    if (item.scaleX !== undefined || item.scaleY !== undefined || item.skewX !== undefined) {
      const sX = item.scaleX ?? 1.0;
      const sY = item.scaleY ?? 1.0;
      const skX = item.skewX ?? 0.0;
      const halfW = item.fontSize * 0.48;
      const halfH = item.fontSize * 0.38;
      ctx.translate(halfW, -halfH);
      ctx.transform(sX, 0, skX, sY, 0, 0);
      ctx.translate(-halfW, halfH);
    }

    // Font configuration
    ctx.font = buildCanvasFont(item.fontSize, config.fontFamily);
    ctx.fillStyle = item.color;
    ctx.textBaseline = 'alphabetic';

    // Physical Pen Inking Simulation (四种真实书写笔具物理模拟)
    const penType = config.penType ?? 'gel';

    if (penType === 'pencil') {
      // 铅笔：石墨哑光、无墨水渗纸晕染、微颗粒触感
      ctx.shadowBlur = 0;
      ctx.globalAlpha = item.opacity * 0.88;
      ctx.fillText(item.char, 0, 0);

      // Graphite grain deposition pass (石墨微粉层)
      ctx.save();
      ctx.globalAlpha = item.opacity * 0.22;
      ctx.fillText(item.char, 0.25, 0.2);
      ctx.restore();
    } else if (penType === 'fountain') {
      // 钢笔：水性墨水深浅浓淡过渡（Shading）、笔尖下墨层次
      const inkBleedVal = (config.inkBleed ?? 0.35) * 1.1;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = Math.max(0.4, item.strokeWidth * 0.8 + inkBleedVal * 0.8);

      // Base fluid ink pass (底色水墨)
      ctx.globalAlpha = item.opacity * 0.84;
      ctx.fillText(item.char, 0, 0);

      // Concentrated nib contact core (钢笔下墨中心浓重处)
      ctx.save();
      ctx.globalAlpha = item.opacity * 0.55;
      ctx.lineWidth = Math.max(0.4, item.strokeWidth * 0.6);
      ctx.strokeStyle = item.color;
      ctx.strokeText(item.char, 0, 0);
      ctx.restore();
    } else if (penType === 'ballpoint') {
      // 圆珠笔：油性油墨、边缘干脆、极低渗透、转折处偶有油墨微聚
      const inkBleedVal = (config.inkBleed ?? 0.35) * 0.25;
      if (inkBleedVal > 0.05) {
        ctx.shadowColor = item.color;
        ctx.shadowBlur = inkBleedVal * 0.5;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = item.opacity * 0.94;
      ctx.fillText(item.char, 0, 0);

      if (item.strokeWidth > 0.3) {
        ctx.lineWidth = Math.min(0.8, (item.strokeWidth - 0.2) * 0.4);
        ctx.strokeStyle = item.color;
        ctx.strokeText(item.char, 0, 0);
      }
    } else {
      // 中性笔（gel）：晨光/百乐 0.5mm 经典饱满墨色与自然纸纤维微渗
      const inkBleedVal = config.inkBleed ?? 0.35;
      if (item.strokeWidth > 0.1 || inkBleedVal > 0) {
        ctx.shadowColor = item.color;
        ctx.shadowBlur = Math.max(0.35, item.strokeWidth * 0.7 + inkBleedVal * 0.75);
      }
      ctx.globalAlpha = item.opacity;
      ctx.fillText(item.char, 0, 0);

      // Subtle core pass for heavy pen pressure inking
      if (item.strokeWidth > 0.35) {
        ctx.lineWidth = Math.min(1.0, (item.strokeWidth - 0.35) * 0.5);
        ctx.strokeStyle = item.color;
        ctx.strokeText(item.char, 0, 0);
      }
    }

    // Realistic handwritten scratch-out (错字划掉/涂改及上方补写正确字)
    if (item.scratchOut) {
      drawScratchOut(ctx, item, config.fontFamily);
    }

    // Realistic handwritten document annotation (手写重点勾画/圈画/批改)
    if (item.annotation) {
      drawAnnotation(ctx, item);
    }

    ctx.restore();
  }

  // 3. Draw Micro Ink Flecks / Splatters (偶发微落墨点)
  if (pageLayout.splatters && pageLayout.splatters.length > 0) {
    ctx.save();
    for (const splat of pageLayout.splatters) {
      ctx.fillStyle = config.inkColor;
      ctx.globalAlpha = Math.min(1.0, splat.opacity);
      ctx.beginPath();
      ctx.arc(splat.x, splat.y, splat.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 4. Post-render overlay if in photo texture mode (gives paper texture on top of ink)
  if (paper.paperTexture === 'photo') {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(0, 0, paper.width, paper.height);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws visible boundary guides for margins (top, bottom, left, right)
 */
export function drawMarginGuides(ctx: CanvasRenderingContext2D, paper: PaperConfig): void {
  const { width, height, marginLeft, marginRight, marginTop, marginBottom } = paper;
  ctx.save();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);

  // Top
  ctx.beginPath();
  ctx.moveTo(0, marginTop);
  ctx.lineTo(width, marginTop);
  ctx.stroke();

  // Bottom
  ctx.beginPath();
  ctx.moveTo(0, height - marginBottom);
  ctx.lineTo(width, height - marginBottom);
  ctx.stroke();

  // Left
  ctx.beginPath();
  ctx.moveTo(marginLeft, 0);
  ctx.lineTo(marginLeft, height);
  ctx.stroke();

  // Right
  ctx.beginPath();
  ctx.moveTo(width - marginRight, 0);
  ctx.lineTo(width - marginRight, height);
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders a natural, hand-drawn scratch-out mark over a mistakenly written character,
 * and writes the correct intended character above it.
 */
export function drawScratchOut(ctx: CanvasRenderingContext2D, item: RenderChar, fontFamily?: string): void {
  if (!item.scratchOut) return;
  const style = item.scratchOut.style;
  const color = item.scratchOut.color;
  const size = item.fontSize;
  const charWidth = size * 0.95;
  const width = item.scratchOut.compoundWidth ?? charWidth;
  const isLeader = item.scratchOut.isCompoundLeader !== false;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.6, size * 0.055);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = Math.min(1.0, item.opacity * 1.15);

  const midY = -size * 0.36;

  if (isLeader) {
    if (style === 'slash') {
    // 1. Single swift diagonal slash (/): from bottom-left to upper-right with slight curve
    const pJitter = ((Math.sin(item.x * 7.1 + item.y * 13.3) * 10000) % 1) * (size * 0.08);
    ctx.beginPath();
    ctx.moveTo(-size * 0.06 + pJitter, midY + size * 0.42);
    ctx.quadraticCurveTo(width * 0.46, midY - size * 0.02, width + size * 0.1 - pJitter, midY - size * 0.44);
    ctx.stroke();
  } else if (style === 'backslash') {
    // 2. Single swift reverse diagonal slash (\): from upper-left to bottom-right
    const pJitter = ((Math.sin(item.x * 7.1 + item.y * 13.3) * 10000) % 1) * (size * 0.08);
    ctx.beginPath();
    ctx.moveTo(-size * 0.06 + pJitter, midY - size * 0.42);
    ctx.quadraticCurveTo(width * 0.46, midY + size * 0.02, width + size * 0.1 - pJitter, midY + size * 0.44);
    ctx.stroke();
  } else if (style === 'cross_x') {
    // 3. Crossed-out X (✕): two swift diagonal strokes across the character
    ctx.beginPath();
    ctx.moveTo(-size * 0.08, midY - size * 0.38);
    ctx.quadraticCurveTo(width * 0.48, midY + size * 0.02, width + size * 0.08, midY + size * 0.38);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-size * 0.05, midY + size * 0.36);
    ctx.quadraticCurveTo(width * 0.52, midY - size * 0.02, width + size * 0.06, midY - size * 0.4);
    ctx.stroke();
  } else if (style === 'single_line') {
    // 4. Single slightly tilted handwritten strike-through line with micro-curve
    ctx.beginPath();
    ctx.moveTo(-size * 0.08, midY - size * 0.04);
    ctx.quadraticCurveTo(width * 0.45, midY + size * 0.03, width + size * 0.1, midY + size * 0.02);
    ctx.stroke();
  } else if (style === 'double_line') {
    // 5. Two rapid parallel strikethroughs
    ctx.beginPath();
    ctx.moveTo(-size * 0.06, midY - size * 0.12);
    ctx.lineTo(width + size * 0.08, midY - size * 0.08);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-size * 0.06, midY + size * 0.1);
    ctx.lineTo(width + size * 0.08, midY + size * 0.14);
    ctx.stroke();
  } else if (style === 'triple_line') {
    // 6. Rapid three parallel horizontal strikethroughs (≡)
    for (let l = -1; l <= 1; l++) {
      const lineY = midY + l * size * 0.15;
      const jY = ((Math.sin((item.x + l * 19) * 3.3) * 1000) % 1) * (size * 0.03);
      ctx.beginPath();
      ctx.moveTo(-size * 0.06, lineY + jY);
      ctx.lineTo(width + size * 0.08, lineY - jY * 0.5);
      ctx.stroke();
    }
  } else if (style === 'boxed_slash') {
    // 7. Examination-standard boxed strikethrough ([/]): hand-drawn rectangle with diagonal slash
    const bLeft = -size * 0.06;
    const bRight = width + size * 0.08;
    const bTop = midY - size * 0.44;
    const bBottom = midY + size * 0.44;

    ctx.beginPath();
    ctx.moveTo(bLeft, bTop);
    ctx.lineTo(bRight + size * 0.02, bTop);
    ctx.lineTo(bRight, bBottom + size * 0.02);
    ctx.lineTo(bLeft - size * 0.02, bBottom);
    if (typeof ctx.closePath === 'function') {
      ctx.closePath();
    } else {
      ctx.lineTo(bLeft, bTop);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bLeft + size * 0.04, bBottom - size * 0.04);
    ctx.lineTo(bRight - size * 0.04, bTop + size * 0.04);
    ctx.stroke();
  } else if (style === 'circled_slash') {
    // 8. Circled scratch-out ((/)): hand-drawn loose oval enclosing typo with an internal slash
    const cx = width * 0.48;
    const cy = midY;
    const rx = width * 0.58;
    const ry = size * 0.46;

    ctx.beginPath();
    if (typeof ctx.ellipse === 'function') {
      ctx.ellipse(cx, cy, rx, ry, -0.05, 0, Math.PI * 2.1);
    } else {
      ctx.arc(cx, cy, (rx + ry) / 2, 0, Math.PI * 2);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.85, cy + ry * 0.75);
    ctx.lineTo(cx + rx * 0.85, cy - ry * 0.75);
    ctx.stroke();
  } else if (style === 'spiral_coil') {
    // 9. Smooth continuous spiral loop coil (连续回旋弹簧圈涂抹)
    ctx.beginPath();
    const coils = 4;
    const startX = -size * 0.04;
    const totalSpan = width + size * 0.12;
    const coilW = totalSpan / coils;

    ctx.moveTo(startX, midY);
    for (let c = 0; c < coils; c++) {
      const cx = startX + c * coilW;
      ctx.bezierCurveTo(
        cx + coilW * 0.2, midY - size * 0.38,
        cx + coilW * 0.8, midY - size * 0.38,
        cx + coilW, midY
      );
      ctx.bezierCurveTo(
        cx + coilW * 1.1, midY + size * 0.38,
        cx + coilW * 0.4, midY + size * 0.38,
        cx + coilW * 0.5, midY
      );
    }
    ctx.stroke();
  } else if (style === 'scribble') {
    // 10. Realistic dense handwritten scribble (来回快速折线涂抹墨团)
    ctx.beginPath();
    ctx.moveTo(-size * 0.05, midY - size * 0.22);
    ctx.lineTo(width + size * 0.05, midY + size * 0.18);
    ctx.lineTo(-size * 0.03, midY + size * 0.08);
    ctx.lineTo(width + size * 0.03, midY - size * 0.16);
    ctx.lineTo(width * 0.15, midY + size * 0.22);
    ctx.lineTo(width * 0.85, midY + size * 0.02);
    ctx.stroke();
  } else if (style === 'heavy_blot') {
    // 11. Heavy black-out ink blot (浓墨团块彻底涂黑遮盖)
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.min(0.92, item.opacity * 1.25);
    const bLeft = -size * 0.05;
    const bTop = midY - size * 0.40;
    const bW = width + size * 0.14;
    const bH = size * 0.78;

    ctx.beginPath();
    if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === 'function') {
      (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number[]) => void }).roundRect(
        bLeft, bTop, bW, bH, [size * 0.08, size * 0.12, size * 0.06, size * 0.1]
      );
    } else {
      ctx.rect(bLeft, bTop, bW, bH);
    }
    ctx.fill();

    ctx.lineWidth = Math.max(2.4, size * 0.08);
    ctx.beginPath();
    ctx.moveTo(bLeft, midY - size * 0.2);
    ctx.lineTo(bLeft + bW, midY + size * 0.15);
    ctx.lineTo(bLeft, midY + size * 0.25);
    ctx.lineTo(bLeft + bW, midY - size * 0.15);
    ctx.stroke();
    ctx.restore();
  } else if (style === 'wavy') {
    // 12. Continuous wavy strike
    ctx.beginPath();
    const steps = 4;
    const stepW = (width + size * 0.16) / steps;
    ctx.moveTo(-size * 0.08, midY);
    for (let s = 0; s < steps; s++) {
      const sx = -size * 0.08 + s * stepW;
      const wave = (s % 2 === 0 ? 1 : -1) * (size * 0.12);
      ctx.quadraticCurveTo(sx + stepW / 2, midY + wave, sx + stepW, midY);
    }
    ctx.stroke();
  } else if (style === 'mesh_patch') {
    // 13. Dense cross-hatched mesh patch (交叉网格排线涂黑)
    ctx.beginPath();
    // Forward diagonal slashes
    for (let i = 0; i < 4; i++) {
      const xOffset = (width / 3) * i - size * 0.1;
      ctx.moveTo(xOffset, midY + size * 0.38);
      ctx.lineTo(xOffset + width * 0.45, midY - size * 0.38);
    }
    // Backward diagonal counter-slashes
    for (let j = 0; j < 3; j++) {
      const xOffset = (width / 2) * j;
      ctx.moveTo(xOffset, midY - size * 0.36);
      ctx.lineTo(xOffset + width * 0.42, midY + size * 0.36);
    }
    ctx.stroke();
  }
  } // end if (isLeader)

  // 8. If correction character is present, write the correct character above/top-right the struck-through mistake
  if (item.scratchOut.correctionChar) {
    const corrChar = item.scratchOut.correctionChar;
    const corrColor = item.scratchOut.correctionColor || color;
    const isFirstLine = !!item.scratchOut.isFirstLine;
    const corrFontSize = Math.max(12, Math.round(size * (isFirstLine ? 0.62 : 0.68)));
    const isTopRight = item.scratchOut.position !== 'top';

    // Optional handwritten insertion caret `^` pointing to the correction
    if (item.scratchOut.showCaret) {
      ctx.save();
      ctx.strokeStyle = corrColor;
      ctx.lineWidth = Math.max(1.2, size * 0.04);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const caretY = (item.scratchOut.caretY ?? (isFirstLine ? -0.52 : -0.68)) * size;
      const caretX = (item.scratchOut.caretX ?? (isTopRight ? 0.52 : 0.46)) * charWidth;

      ctx.translate(caretX, caretY);
      if (isTopRight) {
        ctx.rotate(0.18); // Natural ~10° slant pointing toward top-right correction
      }
      ctx.beginPath();
      ctx.moveTo(-size * 0.11, size * 0.1);
      ctx.lineTo(0, 0);
      ctx.lineTo(size * 0.11, size * 0.1);
      ctx.stroke();
      ctx.restore();
    }

    // Draw the correction character in the designated position (top-right or top)
    ctx.save();
    if (fontFamily) {
      ctx.font = buildCanvasFont(corrFontSize, fontFamily);
    } else if (ctx.font) {
      ctx.font = ctx.font.replace(/\d+(\.\d+)?px/, `${corrFontSize}px`);
    } else {
      ctx.font = `${corrFontSize}px sans-serif`;
    }
    ctx.fillStyle = corrColor;
    ctx.globalAlpha = Math.min(1.0, item.opacity * 1.15);
    ctx.textBaseline = 'alphabetic';

    const corrY = (item.scratchOut.offsetDY ?? (isTopRight ? -0.85 : -0.80)) * size;
    const corrX = (item.scratchOut.offsetDX ?? (isTopRight ? 0.52 : 0.08)) * charWidth;
    const tilt = item.scratchOut.tiltAngle ?? (isTopRight ? 0.04 : 0);

    ctx.translate(corrX, corrY);
    ctx.rotate(tilt);
    if (typeof ctx.fillText === 'function') {
      ctx.fillText(corrChar, 0, 0);
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renders hand-drawn document markings (underlines, circles, caret inserts, boxes)
 */
export function drawAnnotation(ctx: CanvasRenderingContext2D, item: RenderChar): void {
  if (!item.annotation) return;
  const style = item.annotation.style;
  const color = item.annotation.color;
  const size = item.fontSize;
  const width = size * 0.95;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.4, size * 0.05);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = Math.min(1.0, item.opacity * 1.1);

  if (style === 'underline_wavy') {
    // Hand-drawn wavy underline underneath character
    const y = size * 0.16;
    ctx.beginPath();
    ctx.moveTo(-size * 0.05, y);
    const steps = 4;
    const stepW = (width + size * 0.1) / steps;
    for (let s = 0; s < steps; s++) {
      const sx = -size * 0.05 + s * stepW;
      const wave = (s % 2 === 0 ? 1 : -1) * (size * 0.08);
      ctx.quadraticCurveTo(sx + stepW / 2, y + wave, sx + stepW, y);
    }
    ctx.stroke();
  } else if (style === 'circle') {
    // Hand-drawn tilted imperfect circle / ellipse around character
    const cx = width * 0.48;
    const cy = -size * 0.35;
    const rx = width * 0.65;
    const ry = size * 0.58;
    ctx.beginPath();
    // Start at top-left, loop around with slight overlap for realism
    if (typeof ctx.ellipse === 'function') {
      ctx.ellipse(cx, cy, rx, ry, -0.08, 0, Math.PI * 2.15);
    } else {
      ctx.arc(cx, cy, (rx + ry) / 2, 0, Math.PI * 2);
    }
    ctx.stroke();
  } else if (style === 'caret_insert') {
    // Handwritten caret insertion symbol `^` below character
    const y = size * 0.15;
    const cx = width * 0.48;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.18, y + size * 0.22);
    ctx.lineTo(cx, y);
    ctx.lineTo(cx + size * 0.18, y + size * 0.22);
    ctx.stroke();
  } else if (style === 'box') {
    // Loose hand-drawn rectangle
    const x1 = -size * 0.08;
    const y1 = -size * 0.82;
    const x2 = width + size * 0.08;
    const y2 = size * 0.12;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y1 + size * 0.02);
    ctx.lineTo(x2 - size * 0.02, y2);
    ctx.lineTo(x1, y2 - size * 0.01);
    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}
