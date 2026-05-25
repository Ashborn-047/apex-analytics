import { expect, test, describe } from "bun:test";
import { processTrack, douglasPeucker, TrackPoint } from "./src";

describe("Geometry processing", () => {
  test("processTrack scales and centers points correctly", () => {
    const rawPoints: TrackPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 }
    ];

    const processed = processTrack(rawPoints, 0);
    expect(processed.length).toBe(4);
    
    // Normalized check: they should fit inside [0, 1] range
    for (const p of processed) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    }
  });

  test("douglasPeucker simplifies path based on epsilon", () => {
    const points: TrackPoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0.1 },
      { x: 2, y: 0 },
      { x: 3, y: 0 }
    ];

    const simplified = douglasPeucker(points, 0.2);
    expect(simplified.length).toBeLessThan(points.length);
    expect(simplified[0]).toEqual(points[0]);
    expect(simplified[simplified.length - 1]).toEqual(points[points.length - 1]);
  });
});
