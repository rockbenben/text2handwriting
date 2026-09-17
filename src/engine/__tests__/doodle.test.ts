import { describe, it, expect } from 'vitest';
import { eraseStrokesAt } from '../doodle';
import type { DoodleStroke } from '../types';

const stroke = (pts: [number, number][]): DoodleStroke => ({
  points: pts.map(([x, y]) => ({ x, y })),
  color: '#000',
  width: 2.6,
});

describe('eraseStrokesAt', () => {
  it('removes a stroke when the point is within radius of a segment', () => {
    const strokes = [
      stroke([[0, 0], [100, 0]]),
      stroke([[200, 200], [300, 200]]),
    ];
    // (50, 5) is 5px from the first segment (radius 10) -> remove first only
    const result = eraseStrokesAt(strokes, { x: 50, y: 5 }, 10);
    expect(result).toHaveLength(1);
    expect(result[0].points[0]).toEqual({ x: 200, y: 200 });
  });

  it('removes nothing when the point is far from every stroke', () => {
    const strokes = [stroke([[0, 0], [100, 0]])];
    const result = eraseStrokesAt(strokes, { x: 50, y: 50 }, 10);
    expect(result).toHaveLength(1);
  });

  it('hits a single-dot stroke by point distance', () => {
    const strokes = [stroke([[50, 50]]), stroke([[0, 0]])];
    const result = eraseStrokesAt(strokes, { x: 53, y: 50 }, 10);
    expect(result).toHaveLength(1);
    expect(result[0].points[0]).toEqual({ x: 0, y: 0 });
  });

  it('does not mutate the input array', () => {
    const strokes = [stroke([[0, 0], [10, 0]])];
    const snapshot = strokes[0].points.length;
    eraseStrokesAt(strokes, { x: 5, y: 0 }, 10);
    expect(strokes).toHaveLength(1);
    expect(strokes[0].points.length).toBe(snapshot);
  });
});
