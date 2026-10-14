import { CityPreset } from '../types';

export const CITY_PRESETS: CityPreset[] = [
  {
    name: 'Bengaluru',
    country: 'India',
    tag: 'Cubbon Park & MG Road',
    lat: 12.9716,
    lng: 77.5946,
    zoom: 16,
    description: 'Tech hub with serene green havens like Cubbon Park amidst bustling arterial avenues.',
    defaultQuietSpot: 'Cubbon Park Bamboo Grove (39 dB)'
  },
  {
    name: 'New York City',
    country: 'USA',
    tag: 'Central Park South & 5th Ave',
    lat: 40.7651,
    lng: -73.9748,
    zoom: 16,
    description: 'High contrast between the roaring Midtown avenues (78+ dB) and the Ramble tranquility (41 dB).',
    defaultQuietSpot: 'The Ramble & Bethesda Terrace (42 dB)'
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    tag: 'Shibuya & Yoyogi Forest',
    lat: 35.6698,
    lng: 139.7013,
    zoom: 16,
    description: 'Neon hustle at Shibuya Crossing contrasting with cedar-scented quiet paths around Meiji Jingu.',
    defaultQuietSpot: 'Meiji Jingu Sacred Forest Walk (38 dB)'
  },
  {
    name: 'London',
    country: 'UK',
    tag: 'Soho & St James’s Park',
    lat: 51.5074,
    lng: -0.1278,
    zoom: 16,
    description: 'West End entertainment energy paired with historic quiet royal mews and canal paths.',
    defaultQuietSpot: 'St James Park Duck Island (43 dB)'
  },
  {
    name: 'Paris',
    country: 'France',
    tag: 'Le Marais & Seine Banks',
    lat: 48.8566,
    lng: 2.3522,
    zoom: 16,
    description: 'Cobblestone pedestrian passages in the Marais and serene riverside promenades.',
    defaultQuietSpot: 'Place des Vosges Courtyard (40 dB)'
  },
  {
    name: 'San Francisco',
    country: 'USA',
    tag: 'Presidio & Marina Green',
    lat: 37.7989,
    lng: -122.4662,
    zoom: 16,
    description: 'Pacific breeze ocean trails and eucalyptus groves shielding against urban vehicle rumble.',
    defaultQuietSpot: 'Ecology Trail Eucalyptus Canopy (37 dB)'
  },
  {
    name: 'Amsterdam',
    country: 'Netherlands',
    tag: 'Jordaan & Vondelpark',
    lat: 52.3676,
    lng: 4.8856,
    zoom: 16,
    description: 'Low motorized traffic, peaceful canals, and dedicated tranquil bicycle corridors.',
    defaultQuietSpot: 'Vondelpark Rose Garden (42 dB)'
  },
  {
    name: 'Singapore',
    country: 'Singapore',
    tag: 'Marina Bay & Gardens',
    lat: 1.2825,
    lng: 103.8585,
    zoom: 16,
    description: 'Biophilic garden city with acoustic dampening vertical greenery and quiet waterfront paths.',
    defaultQuietSpot: 'Floral Fantasy Covered Walk (41 dB)'
  }
];

export interface SearchResult {
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

export async function searchLocations(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=6&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'QuietPath-Urban-Acoustic-Explorer/1.0'
      }
    });

    if (!res.ok) throw new Error('Geocoding service unavailable');
    const data = await res.json();

    return data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type || item.class || 'location'
    }));
  } catch (err) {
    console.warn('Nominatim search fallback:', err);
    // Local fuzzy match against city presets
    const qLower = query.toLowerCase();
    return CITY_PRESETS.filter(
      (c) =>
        c.name.toLowerCase().includes(qLower) ||
        c.country.toLowerCase().includes(qLower) ||
        c.tag.toLowerCase().includes(qLower)
    ).map((c) => ({
      displayName: `${c.name}, ${c.country} (${c.tag})`,
      lat: c.lat,
      lng: c.lng,
      type: 'city'
    }));
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'QuietPath-Urban-Acoustic-Explorer/1.0'
      }
    });
    if (!res.ok) throw new Error('Reverse geocoding failed');
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
