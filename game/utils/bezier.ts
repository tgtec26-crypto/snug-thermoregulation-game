/** 3차 베지어 곡선 위의 점 */
export function bezierPoint(
  t: number,
  p0x: number, p0y: number,
  cp1x: number, cp1y: number,
  cp2x: number, cp2y: number,
  p1x: number, p1y: number,
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt ** 3 * p0x + 3 * mt ** 2 * t * cp1x + 3 * mt * t ** 2 * cp2x + t ** 3 * p1x,
    y: mt ** 3 * p0y + 3 * mt ** 2 * t * cp1y + 3 * mt * t ** 2 * cp2y + t ** 3 * p1y,
  };
}

/** 3차 베지어 곡선 위 t 지점의 진행 방향(라디안) */
export function bezierAngle(
  t: number,
  p0x: number, p0y: number,
  cp1x: number, cp1y: number,
  cp2x: number, cp2y: number,
  p1x: number, p1y: number,
): number {
  const t2 = Math.min(t + 0.01, 1);
  const a = bezierPoint(t,  p0x, p0y, cp1x, cp1y, cp2x, cp2y, p1x, p1y);
  const b = bezierPoint(t2, p0x, p0y, cp1x, cp1y, cp2x, cp2y, p1x, p1y);
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/** admin SVG용 3차 베지어 path 문자열 */
export function bezierSvgPath(
  p0x: number, p0y: number,
  cp1x: number, cp1y: number,
  cp2x: number, cp2y: number,
  p1x: number, p1y: number,
): string {
  return `M ${p0x} ${p0y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p1x} ${p1y}`;
}
