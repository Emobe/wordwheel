export interface WheelPoint {
  x: number;
  y: number;
}

/** Centres of each letter circle, arranged evenly around the wheel, starting at the top. */
export function wheelLayout(count: number, wheelDiameter: number, letterDiameter: number): WheelPoint[] {
  const radius = (wheelDiameter - letterDiameter) / 2;
  const center = wheelDiameter / 2;
  const points: WheelPoint[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    points.push({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });
  }
  return points;
}
