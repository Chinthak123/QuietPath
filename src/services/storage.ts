import { CommunitySpot } from '../types';

const SPOTS_KEY = 'quietpath_community_spots';
const THEME_KEY = 'quietpath_map_theme';

const DEFAULT_SPOTS: CommunitySpot[] = [
  {
    id: 'spot-bengaluru-1',
    name: 'Cubbon Park Bamboo Pavilion',
    lat: 12.9745,
    lng: 77.5925,
    dbLevel: 38,
    category: 'park',
    notes: 'Dense bamboo thicket completely blocks Kasturba Rd traffic hum. Perfect for reading.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
    upvotes: 42
  },
  {
    id: 'spot-bengaluru-2',
    name: 'State Central Library Courtyard',
    lat: 12.9738,
    lng: 77.5908,
    dbLevel: 41,
    category: 'library',
    notes: 'Red brick heritage building shields the inner stone courtyard. Extremely calm.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5,
    upvotes: 29
  },
  {
    id: 'spot-nyc-1',
    name: 'The Ramble & Gill Waterfall',
    lat: 40.7765,
    lng: -73.9695,
    dbLevel: 42,
    category: 'park',
    notes: 'Natural bird sanctuary soundscape in the heart of Manhattan.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
    upvotes: 68
  },
  {
    id: 'spot-tokyo-1',
    name: 'Meiji Jingu Inner Forest Trail',
    lat: 35.6764,
    lng: 139.6993,
    dbLevel: 39,
    category: 'park',
    notes: 'Evergreen sacred woods where Tokyo sirens fade away completely.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 1,
    upvotes: 85
  }
];

export function getCommunitySpots(): CommunitySpot[] {
  try {
    const raw = localStorage.getItem(SPOTS_KEY);
    if (!raw) {
      localStorage.setItem(SPOTS_KEY, JSON.stringify(DEFAULT_SPOTS));
      return DEFAULT_SPOTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SPOTS;
  }
}

export function saveCommunitySpot(spot: Omit<CommunitySpot, 'id' | 'timestamp' | 'upvotes'>): CommunitySpot {
  const current = getCommunitySpots();
  const newSpot: CommunitySpot = {
    ...spot,
    id: `spot-${Date.now()}`,
    timestamp: Date.now(),
    upvotes: 1
  };
  const updated = [newSpot, ...current];
  try {
    localStorage.setItem(SPOTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save spot in localStorage', e);
  }
  return newSpot;
}

export function upvoteCommunitySpot(id: string): CommunitySpot[] {
  const current = getCommunitySpots();
  const updated = current.map((s) => (s.id === id ? { ...s, upvotes: s.upvotes + 1 } : s));
  try {
    localStorage.setItem(SPOTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to upvote in localStorage', e);
  }
  return updated;
}
