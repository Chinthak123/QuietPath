import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AcousticPathFeature, CommunitySpot, RouteOption } from '../types';
import { getSoundCategory } from '../services/acousticEngine';

interface MapContainerProps {
  center: [number, number];
  zoom: number;
  theme: 'dark' | 'light';
  acousticFeatures: AcousticPathFeature[];
  communitySpots: CommunitySpot[];
  quietRoute: RouteOption | null;
  fastestRoute: RouteOption | null;
  selectedRouteType: 'quiet' | 'fastest';
  onMapClick: (lat: number, lng: number) => void;
  onHoverFeature?: (feature: AcousticPathFeature | null) => void;
  originCoords: [number, number] | null;
  destinationCoords: [number, number] | null;
  activeFilter: string | null;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  center,
  zoom,
  theme,
  acousticFeatures,
  communitySpots,
  quietRoute,
  fastestRoute,
  selectedRouteType,
  onMapClick,
  onHoverFeature,
  originCoords,
  destinationCoords,
  activeFilter
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const featuresLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const spotsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false
    });

    // Custom positioned zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Click handler for routing selection
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    // Initialize layer groups
    featuresLayerGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);
    spotsLayerGroupRef.current = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when theme changes (100% free, no API key required)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (theme === 'dark') {
      // Sleek dark gray canvas - completely free without API keys
      const tiles = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          maxNativeZoom: 16,
          maxZoom: 19,
          attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        }
      ).addTo(map);
      tiles.bringToBack();
      tileLayerRef.current = tiles;
    } else {
      // Official OpenStreetMap tile layer - 100% free, no API key required
      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      tiles.bringToBack();
      tileLayerRef.current = tiles;
    }
  }, [theme]);

  // Center / Zoom transition
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentCenter = map.getCenter();
    const dist = Math.hypot(currentCenter.lat - center[0], currentCenter.lng - center[1]);
    if (dist > 0.0001) {
      map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.25 });
    }
  }, [center, zoom]);

  // Render Acoustic Street Vectors
  useEffect(() => {
    const group = featuresLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();

    acousticFeatures.forEach((feat) => {
      const cat = getSoundCategory(feat.noiseDb);

      if (activeFilter && cat.category !== activeFilter) {
        return;
      }

      const isQuiet = feat.noiseDb < 50;
      const weight = isQuiet ? 4.5 : (feat.noiseDb > 70 ? 5 : 3.5);
      const opacity = isQuiet ? 0.9 : 0.75;

      const polyline = L.polyline(feat.coordinates, {
        color: cat.color,
        weight: weight,
        opacity: opacity,
        lineCap: 'round',
        lineJoin: 'round'
      });

      polyline.on('mouseover', () => {
        polyline.setStyle({ weight: weight + 3, opacity: 1 });
        if (onHoverFeature) onHoverFeature(feat);
      });

      polyline.on('mouseout', () => {
        polyline.setStyle({ weight: weight, opacity: opacity });
        if (onHoverFeature) onHoverFeature(null);
      });

      polyline.bindPopup(`
        <div style="font-family: inherit; font-size: 13px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-size: 14px;">${feat.name || 'Urban Corridor'}</strong>
            <span style="background: ${cat.color}25; color: ${cat.color}; font-weight: 700; padding: 2px 8px; border-radius: 999px; font-size: 11px;">
              ${feat.noiseDb} dB
            </span>
          </div>
          <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">
            ${cat.label} • ${feat.isPedestrian ? '🚶 Pedestrian' : '🚗 Roadway'}
          </div>
          <div style="font-size: 11px; opacity: 0.8;">
            ${cat.description}
          </div>
        </div>
      `);

      group.addLayer(polyline);
    });
  }, [acousticFeatures, activeFilter]);

  // Render Routes (QuietPath vs Fastest)
  useEffect(() => {
    const group = routeLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();

    if (!quietRoute && !fastestRoute) return;

    // Draw Fastest Route
    if (fastestRoute) {
      const isSelected = selectedRouteType === 'fastest';
      const fastestLine = L.polyline(fastestRoute.coordinates, {
        color: isSelected ? '#f59e0b' : '#64748b',
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 0.95 : 0.45,
        dashArray: isSelected ? undefined : '5, 8'
      });
      group.addLayer(fastestLine);
    }

    // Draw QuietPath Route (with outer ambient glow and neon emerald stroke)
    if (quietRoute) {
      const isSelected = selectedRouteType === 'quiet';

      // Glow layer
      const glowLine = L.polyline(quietRoute.coordinates, {
        color: '#10b981',
        weight: isSelected ? 12 : 7,
        opacity: isSelected ? 0.35 : 0.15
      });
      group.addLayer(glowLine);

      // Core crisp line
      const quietLine = L.polyline(quietRoute.coordinates, {
        color: isSelected ? '#34d399' : '#059669',
        weight: isSelected ? 6 : 4.5,
        opacity: isSelected ? 1 : 0.6
      });
      group.addLayer(quietLine);
    }
  }, [quietRoute, fastestRoute, selectedRouteType]);

  // Render Origin and Destination Pin Markers
  useEffect(() => {
    const group = markersLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();

    if (originCoords) {
      const icon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            width: 24px; height: 24px; border-radius: 50%;
            background: #38bdf8; border: 3px solid #ffffff;
            box-shadow: 0 0 16px #38bdf8; display: flex;
            align-items: center; justify-content: center;
            color: #000; font-weight: 800; font-size: 11px;
          ">A</div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      const marker = L.marker(originCoords, { icon });
      marker.bindTooltip('Origin (A)', { permanent: true, direction: 'top', offset: [0, -14] });
      group.addLayer(marker);
    }

    if (destinationCoords) {
      const icon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            width: 24px; height: 24px; border-radius: 50%;
            background: #10b981; border: 3px solid #ffffff;
            box-shadow: 0 0 16px #10b981; display: flex;
            align-items: center; justify-content: center;
            color: #ffffff; font-weight: 800; font-size: 11px;
          ">B</div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      const marker = L.marker(destinationCoords, { icon });
      marker.bindTooltip('Destination (B)', { permanent: true, direction: 'top', offset: [0, -14] });
      group.addLayer(marker);
    }
  }, [originCoords, destinationCoords]);

  // Render Community Spot Beacon Pins
  useEffect(() => {
    const group = spotsLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();

    communitySpots.forEach((spot) => {
      const isSerene = spot.dbLevel < 48;
      const color = isSerene ? '#10b981' : '#f59e0b';

      const icon = L.divIcon({
        className: 'community-spot-icon',
        html: `
          <div style="
            width: 28px; height: 28px; border-radius: 50%;
            background: ${color}; border: 2px solid #ffffff;
            box-shadow: 0 0 15px ${color}; display: flex;
            align-items: center; justify-content: center;
            color: #fff; font-size: 10px; font-weight: 700;
          ">
            ${spot.dbLevel}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([spot.lat, spot.lng], { icon });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${spot.name}</div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="background: ${color}25; color: ${color}; font-weight: 700; padding: 2px 8px; border-radius: 999px; font-size: 11px;">
              ${spot.dbLevel} dB • ${spot.category.toUpperCase()}
            </span>
            <span style="font-size: 11px; color: #94a3b8;">${spot.upvotes} Community Endorsements</span>
          </div>
          <p style="font-size: 12px; color: #cbd5e1; margin: 0;">"${spot.notes}"</p>
        </div>
      `);

      group.addLayer(marker);
    });
  }, [communitySpots]);

  return <div id="map-viewport" ref={mapContainerRef} />;
};
