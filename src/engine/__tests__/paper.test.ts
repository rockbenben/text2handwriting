import { describe, it, expect } from 'vitest';
import { getPaperDimensions, getRuledLinePositions, getGridCells } from '../paper';
import type { PaperConfig } from '../types';

describe('Paper geometry and layouts', () => {
  it('calculates standard paper dimensions correctly', () => {
    const a4 = getPaperDimensions('a4', 1.0);
    expect(a4.width).toBe(1200);
    expect(a4.height).toBe(1697); // ~1.414 ratio (A4 is 1:sqrt(2))

    const a4_2x = getPaperDimensions('a4', 2.0);
    expect(a4_2x.width).toBe(2400);
    expect(a4_2x.height).toBe(3394);

    const b5 = getPaperDimensions('b5', 1.0);
    expect(b5.width).toBe(1050);
    expect(b5.height).toBe(1485);
  });

  it('calculates ruled line positions accurately', () => {
    const paper: PaperConfig = {
      type: 'ruled',
      size: 'a4',
      width: 1200,
      height: 1697,
      marginTop: 150,
      marginBottom: 150,
      marginLeft: 100,
      marginRight: 100,
      lineSpacing: 60,
    };

    const lines = getRuledLinePositions(paper);
    expect(lines.length).toBeGreaterThan(15);
    expect(lines[0].y).toBe(150);
    expect(lines[1].y).toBe(210);
    expect(lines[lines.length - 1].y).toBeLessThanOrEqual(paper.height - paper.marginBottom);
  });

  it('calculates composition grid cells correctly', () => {
    const paper: PaperConfig = {
      type: 'grid',
      size: 'a4',
      width: 1200,
      height: 1697,
      marginTop: 150,
      marginBottom: 150,
      marginLeft: 100,
      marginRight: 100,
      lineSpacing: 50,
      gridCols: 20,
      gridRows: 25,
    };

    const grid = getGridCells(paper);
    expect(grid.cols).toBe(20);
    expect(grid.rows).toBe(25);
    expect(grid.cellWidth).toBe((1200 - 200) / 20); // 50
  });
});
