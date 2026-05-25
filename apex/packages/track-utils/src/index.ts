export interface TrackPoint {
  x: number;
  y: number;
}

export interface TrackPoint3D {
  x: number;
  y: number;
  z: number;
}

export interface CircuitMetadata {
  id: string;
  name: string;
  location: string;
  country: string;
  firstGp: number;
  lengthKm: number;
  corners: number;
}

export * from './geometry';
export * from './registry';
