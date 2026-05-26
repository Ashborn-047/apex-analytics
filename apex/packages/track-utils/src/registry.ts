// Auto-generated registry of circuit geometries
import albert_parkData from './data/albert_park.json';
import americasData from './data/americas.json';
import bahrainData from './data/bahrain.json';
import bakuData from './data/baku.json';
import catalunyaData from './data/catalunya.json';
import hungaroringData from './data/hungaroring.json';
import imolaData from './data/imola.json';
import interlagosData from './data/interlagos.json';
import monacoData from './data/monaco.json';
import monzaData from './data/monza.json';
import red_bull_ringData from './data/red_bull_ring.json';
import silverstoneData from './data/silverstone.json';
import spaData from './data/spa.json';
import suzukaData from './data/suzuka.json';
import yas_marinaData from './data/yas_marina.json';
import singaporeData from './data/singapore.json';
import marina_bayData from './data/marina_bay.json';
import jeddahData from './data/jeddah.json';
import losailData from './data/losail.json';
import miamiData from './data/miami.json';
import vegasData from './data/vegas.json';
import zandvoortData from './data/zandvoort.json';
import shanghaiData from './data/shanghai.json';
import sochiData from './data/sochi.json';

import { TrackPoint3D } from './index';

export const circuitGeometries: Record<string, TrackPoint3D[]> = {
  albert_park: albert_parkData as TrackPoint3D[],
  americas: americasData as TrackPoint3D[],
  bahrain: bahrainData as TrackPoint3D[],
  baku: bakuData as TrackPoint3D[],
  catalunya: catalunyaData as TrackPoint3D[],
  hungaroring: hungaroringData as TrackPoint3D[],
  imola: imolaData as TrackPoint3D[],
  interlagos: interlagosData as TrackPoint3D[],
  monaco: monacoData as TrackPoint3D[],
  monza: monzaData as TrackPoint3D[],
  red_bull_ring: red_bull_ringData as TrackPoint3D[],
  silverstone: silverstoneData as TrackPoint3D[],
  spa: spaData as TrackPoint3D[],
  suzuka: suzukaData as TrackPoint3D[],
  yas_marina: yas_marinaData as TrackPoint3D[],
  singapore: singaporeData as TrackPoint3D[],
  marina_bay: marina_bayData as TrackPoint3D[],
  jeddah: jeddahData as TrackPoint3D[],
  losail: losailData as TrackPoint3D[],
  miami: miamiData as TrackPoint3D[],
  vegas: vegasData as TrackPoint3D[],
  zandvoort: zandvoortData as TrackPoint3D[],
  shanghai: shanghaiData as TrackPoint3D[],
  sochi: sochiData as TrackPoint3D[],
};

export function getCircuitGeometry(id: string): TrackPoint3D[] | null {
  return circuitGeometries[id] || null;
}
