export interface WheelPoint {
  x: number;
  y: number;
}

/**
 * Centres of each letter circle, arranged evenly around the wheel, starting
 * at the top. `edgeMargin` insets the ring from the wheel's outer edge —
 * without it, `radius = (wheelDiameter - letterDiameter) / 2` puts each
 * letter circle exactly tangent to the wheel's edge, leaving no breathing
 * room and making the wheel look mostly like wasted empty space.
 */
export function wheelLayout(count: number, wheelDiameter: number, letterDiameter: number, edgeMargin = 0): WheelPoint[] {
  const radius = (wheelDiameter - letterDiameter) / 2 - edgeMargin;
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
