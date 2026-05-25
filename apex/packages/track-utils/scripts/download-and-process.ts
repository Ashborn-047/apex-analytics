import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadElevation, douglasPeucker, processTrack } from '../src/geometry';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping of Ergast/Jolpica circuit IDs to bacinger GeoJSON filenames
const CIRCUIT_MAPPING: Record<string, { filename: string; rotate: number }> = {
  albert_park: { filename: 'au-1953.geojson', rotate: 0 },
  americas: { filename: 'us-2012.geojson', rotate: 0 },
  bahrain: { filename: 'bh-2002.geojson', rotate: 0 },
  baku: { filename: 'az-2016.geojson', rotate: 0 },
  catalunya: { filename: 'es-1991.geojson', rotate: 0 },
  hungaroring: { filename: 'hu-1986.geojson', rotate: 0 },
  imola: { filename: 'it-1953.geojson', rotate: 0 },
  interlagos: { filename: 'br-1940.geojson', rotate: 0 },
  monaco: { filename: 'mc-1929.geojson', rotate: 0 },
  monza: { filename: 'it-1922.geojson', rotate: 0 },
  red_bull_ring: { filename: 'at-1969.geojson', rotate: 0 },
  silverstone: { filename: 'gb-1948.geojson', rotate: 0 },
  spa: { filename: 'be-1925.geojson', rotate: 0 },
  suzuka: { filename: 'jp-1962.geojson', rotate: 0 },
  yas_marina: { filename: 'ae-2009.geojson', rotate: 0 },
  singapore: { filename: 'sg-2008.geojson', rotate: 0 }, // Marina Bay
  marina_bay: { filename: 'sg-2008.geojson', rotate: 0 },
  jeddah: { filename: 'sa-2021.geojson', rotate: 0 },
  losail: { filename: 'qa-2004.geojson', rotate: 0 },
  miami: { filename: 'us-2022.geojson', rotate: 0 },
  vegas: { filename: 'us-2023.geojson', rotate: 0 },
  zandvoort: { filename: 'nl-1948.geojson', rotate: 0 },
  shanghai: { filename: 'cn-2004.geojson', rotate: 0 },
  sochi: { filename: 'ru-2014.geojson', rotate: 0 },
};

const BASE_URL = 'https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits';
const TEMP_DIR = path.join(__dirname, '../temp');
const OUT_DIR = path.join(__dirname, '../src/data');

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.statusText}`);
  }
  const text = await res.text();
  fs.writeFileSync(dest, text, 'utf8');
}

async function run() {
  console.log('Starting track geometry ingestion and processing...');
  
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const results: string[] = [];

  for (const [circuitId, config] of Object.entries(CIRCUIT_MAPPING)) {
    const url = `${BASE_URL}/${config.filename}`;
    const tempPath = path.join(TEMP_DIR, `${circuitId}.geojson`);
    const outPath = path.join(OUT_DIR, `${circuitId}.json`);

    try {
      console.log(`Downloading ${circuitId} GeoJSON...`);
      await downloadFile(url, tempPath);

      console.log(`Processing ${circuitId} geometry...`);
      // 1. Load coordinates with elevation
      const rawPoints = loadElevation(tempPath);
      
      // 2. Simplify geometry using Douglas-Peucker (epsilon ~0.00005 for good fidelity vs point count)
      const simplified = douglasPeucker(rawPoints, 0.00005);
      
      // 3. Process track: Y-flip, rotate, normalize into [0, 1]
      const processed = processTrack(simplified, config.rotate);

      // Write static JSON
      fs.writeFileSync(outPath, JSON.stringify(processed, null, 2), 'utf8');
      console.log(`Saved processed geometry to ${outPath} (${processed.length} points)`);
      results.push(circuitId);
    } catch (err: any) {
      console.error(`Failed to process circuit ${circuitId}:`, err.message);
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  // Generate index of data files
  const indexContent = `// Auto-generated registry of circuit geometries
${results.map(id => `import ${id}Data from './data/${id}.json';`).join('\n')}

import { TrackPoint3D } from '../index';

export const circuitGeometries: Record<string, TrackPoint3D[]> = {
${results.map(id => `  ${id}: ${id}Data as TrackPoint3D[],`).join('\n')}
};

export function getCircuitGeometry(id: string): TrackPoint3D[] | null {
  return circuitGeometries[id] || null;
}
`;

  fs.writeFileSync(path.join(__dirname, '../src/registry.ts'), indexContent, 'utf8');
  console.log('Registry src/registry.ts updated.');

  // Clean temp directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  console.log('Track geometry pre-processing complete!');
}

run().catch(console.error);
