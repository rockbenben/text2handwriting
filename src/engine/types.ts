export type PaperType = 'blank' | 'ruled' | 'grid' | 'english' | 'kraft' | 'dot' | 'custom';

export type PaperSize = 'a4' | 'b5' | 'a5' | 'custom';

export interface PaperConfig {
  type: PaperType;
  size: PaperSize;
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  lineSpacing: number;
  gridCols?: number;
  gridRows?: number;
  customImageUrl?: string;
  customImageAspectRatio?: number;
  bgOpacity?: number; // 0.1 - 1.0, default 1.0
  bgBrightness?: number; // 0.5 - 1.5, default 1.0
  bgContrast?: number; // 0.5 - 1.5, default 1.0
  bgFit?: 'cover' | 'contain' | 'stretch'; // default 'cover'
  // Visual effects
  showLineGuide?: boolean;
  lineColor?: string;
  showMarginLine?: boolean;
  marginLineColor?: string;
  paperTexture?: 'clean' | 'photo' | 'vintage' | 'creased';
  shadowIntensity?: number; // 0 - 1
  vignette?: boolean;
}

export interface HandwritingConfig {
  fontFamily: string;
  fontSize: number;
  fontSizeVariance: number;
  lineHeight: number;
  lineHeightVariance: number;
  letterSpacing: number;
  letterSpacingVariance: number;
  rotationVariance: number; // in degrees
  xVariance: number;
  yVariance: number;
  strokeWidthVariance: number;
  opacityVariance: number;
  lineTiltVariance: number; // in degrees
  inkColor: string;
  paragraphIndent: number; // number of spaces
  alignToLines: boolean; // align text baseline to paper lines
  seed: number;
  scratchOutProbability?: number; // 0 - 0.05 (0% to 5%)
  scratchOutStyle?: ScratchOutStyleOption;
  scratchOutShowCorrection?: boolean; // whether to write the correct character above the struck-through typo
  scratchOutCorrectionColor?: string; // ink color of the correction character (default inkColor)
  scratchOutUseCaret?: boolean; // whether to draw caret ^ below the correction character
  scratchOutCorrectionPosition?: CorrectionPositionOption; // 'top_right' (default, realistic slant) | 'top' (formal centered) | 'random' (natural mixture)
  scratchOutSmartAvoidance?: boolean; // whether to automatically avoid first-line top collision and right margin overflow
  annotationProbability?: number; // 0 - 0.08 (0% to 8%)
  annotationStyle?: 'all' | 'underline_wavy' | 'circle' | 'caret_insert' | 'box';
  annotationColor?: string;
  positionDisarray?: number; // 0 - 2.0 (natural baseline wandering and drift)
  strokeRoughness?: number; // 0 - 1.0 (ink bleed & stroke thickness fluctuation)
  edgeCrowding?: boolean; // natural tendency to squeeze characters near line end
  glyphVariance?: number; // 0 - 1.0 (dynamic aspect ratio & slant deformation to break identical character repetition)
  wristArc?: number; // 0 - 1.0 (natural arm/wrist rotation arc across line)
  fatigueEffect?: boolean; // natural loosening of writing as hand fatigues down the page
  inkBleed?: number; // 0 - 1.0 (micro ink spread into paper fibers)
  inkSplatterProbability?: number; // 0 - 0.03 (occasional micro ink flecks on pen lifts)
  smartSignatureAlign?: boolean; // automatically right-align dates, signatures, salutations or [right]...[/right] tags
  penType?: PenType; // 'gel' (中性笔, default) | 'fountain' (钢笔, shading) | 'pencil' (铅笔, matte graphite) | 'ballpoint' (圆珠笔, oil ink)
}

export type PenType = 'gel' | 'fountain' | 'pencil' | 'ballpoint';

export type CorrectionPositionOption = 'top_right' | 'top' | 'random';

export type ScratchOutConcreteStyle =
  | 'slash'
  | 'backslash'
  | 'cross_x'
  | 'single_line'
  | 'double_line'
  | 'triple_line'
  | 'boxed_slash'
  | 'circled_slash'
  | 'spiral_coil'
  | 'scribble'
  | 'heavy_blot'
  | 'wavy'
  | 'mesh_patch';

export type ScratchOutStyleOption = 'all' | ScratchOutConcreteStyle;

export interface RenderChar {
  char: string;
  x: number;
  y: number;
  fontSize: number;
  rotation: number; // radians
  opacity: number;
  strokeWidth: number;
  color: string;
  scaleX?: number; // non-uniform horizontal scale (0.94 - 1.06)
  scaleY?: number; // non-uniform vertical scale (0.94 - 1.06)
  skewX?: number; // organic hand shear/slant angle (-0.06 to +0.06 rad)
  inkDensity?: number; // pressure deposit factor
  scratchOut?: {
    style: ScratchOutConcreteStyle;
    color: string;
    correctionChar?: string;
    correctionColor?: string;
    showCaret?: boolean;
    position?: 'top_right' | 'top';
    offsetDX?: number;
    offsetDY?: number;
    tiltAngle?: number;
    caretX?: number;
    caretY?: number;
    isFirstLine?: boolean;
    isNearRightMargin?: boolean;
    compoundTotal?: number;
    compoundIndex?: number;
    compoundWidth?: number;
    isCompoundLeader?: boolean;
  };
  annotation?: {
    style: 'underline_wavy' | 'circle' | 'caret_insert' | 'box';
    color: string;
  };
}

export interface PageLayout {
  pageIndex: number;
  chars: RenderChar[];
  lineCount: number;
  splatters?: { x: number; y: number; radius: number; opacity: number }[];
}

export interface TypesetResult {
  pages: PageLayout[];
  totalChars: number;
  totalPages: number;
}

/** 用户在预览上手绘的一笔（纸张坐标系，0..paper.width / 0..paper.height） */
export interface DoodlePoint {
  x: number;
  y: number;
}

export interface DoodleStroke {
  points: DoodlePoint[];
  /** 笔迹颜色（CSS 颜色） */
  color: string;
  /** 纸张坐标系下的线宽 px */
  width: number;
}

/** 按页码索引的手绘层 */
export type DoodleMap = Record<number, DoodleStroke[]>;
