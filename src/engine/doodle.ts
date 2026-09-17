import type { DoodlePoint, DoodleStroke } from './types';

/**
 * 把手绘笔迹画到一个**已处于纸张坐标系**的 ctx 上
 * （调用方负责 save + 按 scale 缩放 + restore）。
 * 用二次贝塞尔连接采样点中点，避免硬折线，更像真实运笔。
 */
export function drawDoodles(ctx: CanvasRenderingContext2D, strokes: DoodleStroke[]): void {
  for (const stroke of strokes) {
    const pts = stroke.points;
    if (pts.length === 0) continue;

    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (pts.length === 1) {
      // 单点：画一个小圆点
      const p = pts[0];
      ctx.fillStyle = stroke.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    if (pts.length === 2) {
      ctx.lineTo(pts[1].x, pts[1].y);
    } else {
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2;
        const midY = (pts[i].y + pts[i].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      // 收尾到最后一点
      const last = pts[pts.length - 1];
      ctx.lineTo(last.x, last.y);
    }

    ctx.stroke();
    ctx.restore();
  }
}

/** 点到线段距离（纸张坐标系），用于橡皮命中判定 */
function distancePointToSegment(p: DoodlePoint, a: DoodlePoint, b: DoodlePoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * 橡皮：删除与给定点（纸张坐标）距离在 radius 内的所有笔画，
 * 返回删除后的新数组（不修改入参）。
 */
export function eraseStrokesAt(strokes: DoodleStroke[], point: DoodlePoint, radius: number): DoodleStroke[] {
  return strokes.filter((stroke) => {
    if (stroke.points.length === 1) {
      return Math.hypot(stroke.points[0].x - point.x, stroke.points[0].y - point.y) > radius;
    }
    for (let i = 0; i < stroke.points.length - 1; i++) {
      if (distancePointToSegment(point, stroke.points[i], stroke.points[i + 1]) <= radius) {
        return false; // 命中，删除这笔
      }
    }
    return true;
  });
}
