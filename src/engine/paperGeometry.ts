import type { PaperLayoutConfig } from './types';

/**
 * 根据纸张参数与边距计算正文方格（作文格）的列数、行数与单元格像素尺寸。
 *
 * 计算规则：
 * 1. 内容有效区：宽度与高度扣除上下左右页边距，下限为 1px 避免除以 0。
 * 2. 单元格尺寸（cellWidth）：每个格子为严格正方形（cellHeight === cellWidth）。
 *    取 `contentWidth / cols` 与 `contentHeight` 的较小值，避免单格超出整页。
 * 3. 容纳行数（fittingRows）：内容高度除以单元格宽度的整数向下取整。
 * 4. 自定义行数约束（gridRows）：若纸张配置显式指定了行数，取配置值与几何最大容纳行数的较小值。
 *
 * @param paper 纸张布局配置（含宽、高、边距、列数与行数）
 * @returns 方格网格参数 { cols, rows, cellWidth, cellHeight }
 */
export function getGridCells(paper: PaperLayoutConfig): { cols: number; rows: number; cellWidth: number; cellHeight: number } {
  const contentWidth = Math.max(1, paper.width - paper.marginLeft - paper.marginRight);
  const contentHeight = Math.max(1, paper.height - paper.marginTop - paper.marginBottom);
  const cols = paper.gridCols && paper.gridCols > 0 ? Math.max(1, Math.floor(paper.gridCols)) : 20;
  const cellWidth = Math.min(contentWidth / cols, contentHeight);
  const fittingRows = Math.floor(contentHeight / cellWidth);

  // 预设或用户配置可能限制行数；页高缩小或列数减少时，保证只绘制能完整塞入边距内的正方形格子
  const rows = paper.gridRows && paper.gridRows > 0
    ? Math.min(fittingRows, Math.max(1, Math.floor(paper.gridRows)))
    : fittingRows;
  return { cols, rows, cellWidth, cellHeight: cellWidth };
}
