import { AcousticPathFeature, TimeOfDay } from '../types';

// Cache for acoustic data by rounded coordinate key
const acousticCache = new Map<string, AcousticPathFeature[]>();

export function getSoundCategory(db: number): {
  category: 'serene' | 'quiet' | 'moderate' | 'loud' | 'severe';
  label: string;
  color: string;
  glow: string;
  description: string;
} {
  if (db < 45) {
    return {
      category: 'serene',
      label: 'Serene Sanctuary',
      color: '#10b981', // Emerald
      glow: 'rgba(16, 185, 129, 0.45)',
      description: 'Ideal for deep focus, meditation, or restorative walks.'
    };
  } else if (db < 55) {
    return {
      category: 'quiet',
      label: 'Tranquil & Pleasant',
      color: '#06b6d4', // Cyan
      glow: 'rgba(6, 182, 212, 0.4)',
      description: 'Gentle residential or parkside ambiance, low vehicle flow.'
    };
  } else if (db < 65) {
    return {
      category: 'moderate',
      label: 'Moderate Urban Hum',
      color: '#f59e0b', // Amber
      glow: 'rgba(245, 158, 11, 0.4)',
      description: 'Typical city ambiance, regular foot traffic, distant vehicles.'
    };
  } else if (db < 75) {
    return {
      category: 'loud',
      label: 'High Acoustic Load',
      color: '#f97316', // Orange
      glow: 'rgba(249, 115, 22, 0.4)',
      description: 'Active commercial streets, bus corridors, noisy intersections.'
    };
  } else {
    return {
      category: 'severe',
      label: 'Heavy Noise Pollution',
      color: '#ef4444', // Red
      glow: 'rgba(239, 68, 68, 0.45)',
      description: 'Major arterial traffic, construction, or rail corridors.'
    };
  }
}

export function getTimeOfDayDelta(timeOfDay: TimeOfDay): number {
  if (timeOfDay === 'live') {
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) return -12; // Midnight tranquility
    if (hour >= 5 && hour < 7) return -6;   // Early dawn
    if (hour >= 8 && hour <= 10) return 6;  // Morning rush
    if (hour >= 17 && hour <= 19) return 7; // Evening rush
    if (hour >= 20 && hour < 23) return -4; // Late evening
    return 0; // Standard day
  }

  switch (timeOfDay) {
    case 'night':
      return -13;
    case 'evening':
      return -5;
    case 'morning':
      return -3;
    case 'rush':
      return 7;
    case 'afternoon':
    default:
      return 0;
  }
}

// Estimate sound decibels based on OpenStreetMap highway tagging and environmental context
function calculateBaseDecibels(highway: string, name?: string, isGreenArea: boolean = false): number {
  let base = 50;

  switch (highway) {
    case 'motorway':
    case 'motorway_link':
      base = 82;
      break;
    case 'trunk':
    case 'trunk_link':
      base = 78;
      break;
    case 'primary':
    case 'primary_link':
      base = 72;
      break;
    case 'secondary':
    case 'secondary_link':
      base = 65;
      break;
    case 'tertiary':
    case 'tertiary_link':
      base = 58;
      break;
    case 'residential':
      base = 47;
      break;
    case 'living_street':
      base = 41;
      break;
    case 'pedestrian':
      base = 42;
      break;
    case 'footway':
    case 'path':
    case 'steps':
      base = 38;
      break;
    case 'cycleway':
      base = 39;
      break;
    case 'track':
      base = 35;
      break;
    default:
      base = 52;
  }

  // Green buffer acoustic attenuation (trees, shrubs, lawn absorb 6-10 dB)
  if (isGreenArea) {
    base -= 9;
  }

  // Name heuristics (boulevard / ring road / highway usually louder; mews / alley / lane quieter)
  if (name) {
    const lower = name.toLowerCase();
    if (lower.includes('highway') || lower.includes('expressway') || lower.includes('avenue') || lower.includes('ring')) {
      base += 4;
    } else if (lower.includes('lane') || lower.includes('mews') || lower.includes('alley') || lower.includes('walk') || lower.includes('garden')) {
      base -= 4;
    }
  }

  // Add subtle deterministic spatial jitter (+/- 2 dB) based on name or tag
  const hash = (name || highway).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const jitter = ((hash % 5) - 2);

  return Math.max(32, Math.min(88, base + jitter));
}

// Generate high quality synthetic acoustic network for any coordinate when Overpass is throttled
function generateProceduralNetwork(lat: number, lng: number, count = 70): AcousticPathFeature[] {
  const features: AcousticPathFeature[] = [];
  const roadTypes = [
    { type: 'primary', weight: 0.1 },
    { type: 'secondary', weight: 0.2 },
    { type: 'residential', weight: 0.4 },
    { type: 'pedestrian', weight: 0.15 },
    { type: 'footway', weight: 0.15 }
  ];

  const gridSize = 0.007; // ~700 meters span
  const latStep = gridSize / 7;
  const lngStep = gridSize / 7;

  let idCounter = 1;

  // Generate an organic grid with diagonal quiet alleys and park paths
  for (let i = -3; i <= 3; i++) {
    // East-West streets
    const streetLat = lat + i * latStep;
    const isMainEW = i === 0 || i === 2;
    const hwEW: string = isMainEW ? (i === 0 ? 'primary' : 'secondary') : (Math.abs(i) === 3 ? 'footway' : 'residential');
    const isGreenEW = Math.abs(i) === 3;
    const coordsEW: [number, number][] = [
      [streetLat, lng - gridSize / 2],
      [streetLat + (Math.sin(i) * 0.0003), lng],
      [streetLat, lng + gridSize / 2]
    ];
    const baseDbEW = calculateBaseDecibels(hwEW, `Street EW-${i}`, isGreenEW);

    features.push({
      id: `proc-ew-${idCounter++}`,
      name: isGreenEW ? 'Botanical Promenade Walk' : (isMainEW ? 'Grand Central Avenue' : `Residential Mews ${i + 4}`),
      highway: hwEW,
      baseDb: baseDbEW,
      noiseDb: baseDbEW,
      lengthMeters: 750,
      isGreen: isGreenEW,
      isPedestrian: hwEW === 'footway' || hwEW === 'pedestrian',
      coordinates: coordsEW
    });

    // North-South streets
    const streetLng = lng + i * lngStep;
    const isMainNS = i === -1;
    const hwNS: string = isMainNS ? 'primary' : (i === 1 ? 'pedestrian' : (Math.abs(i) === 3 ? 'footway' : 'residential'));
    const isGreenNS = i === 1 || Math.abs(i) === 3;
    const coordsNS: [number, number][] = [
      [lat - gridSize / 2, streetLng],
      [lat, streetLng + (Math.cos(i) * 0.0003)],
      [lat + gridSize / 2, streetLng]
    ];
    const baseDbNS = calculateBaseDecibels(hwNS, `Way NS-${i}`, isGreenNS);

    features.push({
      id: `proc-ns-${idCounter++}`,
      name: isGreenNS ? 'Park Greenery Walkway' : (isMainNS ? 'Metropolitan Boulevard' : `Quiet Way ${i + 4}`),
      highway: hwNS,
      baseDb: baseDbNS,
      noiseDb: baseDbNS,
      lengthMeters: 750,
      isGreen: isGreenNS,
      isPedestrian: hwNS === 'footway' || hwNS === 'pedestrian',
      coordinates: coordsNS
    });
  }

  // Add 8 diagonal connecting serene garden walkways & pedestrian paths
  for (let k = 0; k < 6; k++) {
    const angle = (k / 6) * Math.PI * 2;
    const r1 = 0.0012;
    const r2 = 0.0028;
    const p1: [number, number] = [lat + Math.sin(angle) * r1, lng + Math.cos(angle) * r1];
    const p2: [number, number] = [lat + Math.sin(angle + 0.4) * r2, lng + Math.cos(angle + 0.4) * r2];
    const baseDb = 36 + (k % 3) * 3;

    features.push({
      id: `proc-oasis-${idCounter++}`,
      name: `Sanctuary Pathway ${k + 1}`,
      highway: 'footway',
      baseDb: baseDb,
      noiseDb: baseDb,
      lengthMeters: 280,
      isGreen: true,
      isPedestrian: true,
      coordinates: [p1, [(p1[0] + p2[0]) / 2 + 0.0001, (p1[1] + p2[1]) / 2 - 0.0001], p2]
    });
  }

  return features;
}

// Convert GeoJSON to AcousticPathFeature
export function parseGeoJsonToFeatures(geojson: any): AcousticPathFeature[] {
  if (!geojson || !geojson.features) return [];
  const list: AcousticPathFeature[] = [];

  for (let i = 0; i < geojson.features.length; i++) {
    const f = geojson.features[i];
    if (!f.geometry || !f.geometry.coordinates) continue;

    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
    let coords: [number, number][] = [];
    if (f.geometry.type === 'LineString') {
      coords = f.geometry.coordinates.map((c: any) => [c[1], c[0]]);
    } else if (f.geometry.type === 'MultiLineString') {
      coords = f.geometry.coordinates[0]?.map((c: any) => [c[1], c[0]]) || [];
    }

    if (coords.length < 2) continue;

    const noise = f.properties?.noise_db ?? f.properties?.noise ?? 55;
    const isPed = (f.properties?.highway === 'footway' || f.properties?.highway === 'pedestrian' || f.properties?.highway === 'path');

    list.push({
      id: f.id || `feat-${i}`,
      name: f.properties?.name || (isPed ? 'Pedestrian Walkway' : 'City Corridor'),
      highway: f.properties?.highway || 'residential',
      baseDb: Math.round(noise),
      noiseDb: Math.round(noise),
      lengthMeters: 100,
      isGreen: noise < 48,
      isPedestrian: isPed,
      coordinates: coords
    });
  }

  return list;
}

// Live Overpass API fetcher with timeout and caching
export async function fetchAcousticData(
  lat: number,
  lng: number,
  timeOfDay: TimeOfDay = 'live'
): Promise<AcousticPathFeature[]> {
  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const delta = getTimeOfDayDelta(timeOfDay);

  if (acousticCache.has(cacheKey)) {
    const cached = acousticCache.get(cacheKey)!;
    return cached.map((f) => ({
      ...f,
      noiseDb: Math.max(30, Math.min(92, Math.round(f.baseDb + delta)))
    }));
  }

  // Radius in degrees approx 700m
  const span = 0.007;
  const south = lat - span;
  const west = lng - span;
  const north = lat + span;
  const east = lng + span;

  const overpassQuery = `
    [out:json][timeout:8];
    (
      way["highway"](${south},${west},${north},${east});
    );
    out geom tags 150;
  `;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];

    let data: any = null;
    let success = false;

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: overpassQuery,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          signal: controller.signal
        });

        if (res.ok) {
          data = await res.json();
          if (data && data.elements && data.elements.length > 5) {
            success = true;
            break;
          }
        }
      } catch (e) {
        // try next endpoint
      }
    }

    clearTimeout(timeoutId);

    if (success && data && data.elements) {
      const parsed: AcousticPathFeature[] = [];

      for (const el of data.elements) {
        if (el.type === 'way' && el.geometry && el.geometry.length >= 2) {
          const coords: [number, number][] = el.geometry.map((pt: any) => [pt.lat, pt.lon]);
          const highway = el.tags?.highway || 'residential';
          const name = el.tags?.name;
          const isGreen = el.tags?.leisure === 'park' || el.tags?.landuse === 'grass' || el.tags?.natural === 'wood';
          const isPed = ['footway', 'pedestrian', 'path', 'cycleway', 'living_street'].includes(highway);

          const baseDb = calculateBaseDecibels(highway, name, isGreen);

          parsed.push({
            id: `osm-${el.id}`,
            name: name || (isPed ? 'Pedestrian Walk' : `${highway.toUpperCase()} Link`),
            highway: highway,
            baseDb: baseDb,
            noiseDb: Math.max(30, Math.min(92, Math.round(baseDb + delta))),
            lengthMeters: 80,
            isGreen: isGreen || baseDb < 45,
            isPedestrian: isPed,
            coordinates: coords
          });
        }
      }

      if (parsed.length >= 10) {
        acousticCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.info('Overpass API fallback activated:', err);
  }

  // Fallback to procedural model calibrated to this coordinate
  const procedural = generateProceduralNetwork(lat, lng);
  acousticCache.set(cacheKey, procedural);
  return procedural.map((f) => ({
    ...f,
    noiseDb: Math.max(30, Math.min(92, Math.round(f.baseDb + delta)))
  }));
}
