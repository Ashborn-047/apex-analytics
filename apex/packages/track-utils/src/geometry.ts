import fs from 'fs';
import { TrackPoint, TrackPoint3D } from './index';

// 1. Process track points: Y-flip, rotate, scale and center in [0, 1] box
export function processTrack<T extends TrackPoint>(points: T[], rotateDeg: number): T[] {
  if (points.length === 0) return [];

  // Y-flip (negate y)
  const flipped = points.map(p => ({ ...p, y: -p.y }));

  // Rotate around origin
  const rad = (rotateDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rotated = flipped.map(p => ({
    ...p,
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
  }));

  // Normalize: Scale and center in 0 to 1 bounding box while preserving aspect ratio
  const xs = rotated.map(p => p.x);
  const ys = rotated.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = maxX - minX;
  const height = maxY - minY;
  const maxRange = Math.max(width, height) || 1;

  const xOffset = (1.0 - (width / maxRange)) / 2;
  const yOffset = (1.0 - (height / maxRange)) / 2;

  return rotated.map(p => ({
    ...p,
    x: Number(((p.x - minX) / maxRange + xOffset).toFixed(4)),
    y: Number(((p.y - minY) / maxRange + yOffset).toFixed(4)),
  })) as T[];
}

// 2. Douglas-Peucker path simplification
export function douglasPeucker<T extends TrackPoint>(points: T[], epsilon: number): T[] {
  if (points.length <= 2) return points;

  const sqEpsilon = epsilon * epsilon;
  const last = points.length - 1;
  let maxSqDist = 0;
  let index = 0;

  for (let i = 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[0], points[last]);
    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (maxSqDist > sqEpsilon) {
    const results1 = douglasPeucker(points.slice(0, index + 1), epsilon);
    const results2 = douglasPeucker(points.slice(index), epsilon);
    return results1.slice(0, results1.length - 1).concat(results2);
  } else {
    return [points[0], points[last]];
  }
}

function getSqSegDist(p: TrackPoint, p1: TrackPoint, p2: TrackPoint) {
  let x = p1.x;
  let y = p1.y;
  let dx = p2.x - x;
  let dy = p2.y - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2.x;
      y = p2.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p.x - x;
  dy = p.y - y;

  return dx * dx + dy * dy;
}

// 3. Load elevation from bacinger GeoJSON (containing [lng, lat, elev])
export function loadElevation(geojsonPath: string): TrackPoint3D[] {
  const content = fs.readFileSync(geojsonPath, 'utf8');
  const geojson = JSON.parse(content);

  let coordinates: number[][] = [];

  if (geojson.type === 'FeatureCollection') {
    for (const feature of geojson.features) {
      if (feature.geometry && (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString')) {
        const geomCoords = feature.geometry.coordinates;
        if (feature.geometry.type === 'LineString') {
          coordinates = geomCoords;
          break;
        } else if (feature.geometry.type === 'MultiLineString') {
          coordinates = geomCoords[0];
          break;
        }
      }
    }
  } else if (geojson.type === 'Feature') {
    if (geojson.geometry && geojson.geometry.type === 'LineString') {
      coordinates = geojson.geometry.coordinates;
    }
  } else if (geojson.type === 'LineString') {
    coordinates = geojson.coordinates;
  }

  return coordinates.map(coord => ({
    x: coord[0], // longitude
    y: coord[1], // latitude
    z: coord[2] || 0, // elevation
  }));
}
