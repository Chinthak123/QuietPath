export interface AcousticPathFeature {
  id: string;
  name?: string;
  highway?: string;
  noiseDb: number;
  baseDb: number;
  lengthMeters: number;
  isGreen: boolean;
  isPedestrian: boolean;
  coordinates: [number, number][]; // [lat, lng]
}

export interface AcousticDataSet {
  center: [number, number];
  zoom: number;
  locationName: string;
  features: AcousticPathFeature[];
  lastUpdated: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  averageDb: number;
  quietRating: 'serene' | 'quiet' | 'moderate' | 'loud';
}

export interface RouteOption {
  type: 'quiet' | 'fastest';
  name: string;
  distanceMeters: number;
  durationSeconds: number;
  averageDb: number;
  peakDb: number;
  noiseReductionPercent?: number; // relative to fastest
  tranquilityScore: number; // 0 - 100
  greeneryPercent: number;
  coordinates: [number, number][]; // [lat, lng]
  steps: RouteStep[];
}

export interface CommunitySpot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dbLevel: number;
  category: 'park' | 'cafe' | 'library' | 'residential' | 'street' | 'construction';
  notes: string;
  timestamp: number;
  upvotes: number;
}

export interface CityPreset {
  name: string;
  country: string;
  tag: string;
  lat: number;
  lng: number;
  zoom: number;
  description: string;
  defaultQuietSpot: string;
}

export type TimeOfDay = 'live' | 'morning' | 'rush' | 'afternoon' | 'evening' | 'night';

export type MapTheme = 'dark' | 'light' | 'satellite';
