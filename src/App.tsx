import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CityPresetsBar } from './components/CityPresetsBar';
import { MapContainer } from './components/MapContainer';
import { RoutePanel } from './components/RoutePanel';
import { DecibelMeterModal } from './components/DecibelMeterModal';
import { CommunitySpotModal } from './components/CommunitySpotModal';
import { TimeOfDaySlider } from './components/TimeOfDaySlider';
import { LegendHUD } from './components/LegendHUD';
import { AcousticPathFeature, CityPreset, CommunitySpot, RouteOption, TimeOfDay } from './types';
import { CITY_PRESETS, reverseGeocode } from './services/geocoding';
import { fetchAcousticData, parseGeoJsonToFeatures } from './services/acousticEngine';
import { calculateQuietAndFastRoutes } from './services/routingService';
import { soundscape } from './services/audioSynthesizer';
import { getCommunitySpots, saveCommunitySpot } from './services/storage';

export const App: React.FC = () => {
  // Map viewport state
  const [center, setCenter] = useState<[number, number]>([12.9716, 77.5946]); // Bengaluru default
  const [zoom, setZoom] = useState<number>(16);
  const [currentCityName, setCurrentCityName] = useState<string>('Bengaluru');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Acoustic features
  const [features, setFeatures] = useState<AcousticPathFeature[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('live');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Routing state
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [originName, setOriginName] = useState<string>('');
  const [destinationName, setDestinationName] = useState<string>('');
  const [quietRoute, setQuietRoute] = useState<RouteOption | null>(null);
  const [fastestRoute, setFastestRoute] = useState<RouteOption | null>(null);
  const [selectedRouteType, setSelectedRouteType] = useState<'quiet' | 'fastest'>('quiet');

  // Community spots
  const [communitySpots, setCommunitySpots] = useState<CommunitySpot[]>([]);

  // Modals & Audio
  const [isDecibelMeterOpen, setIsDecibelMeterOpen] = useState(false);
  const [isAddSpotOpen, setIsAddSpotOpen] = useState(false);
  const [measuredDbForSpot, setMeasuredDbForSpot] = useState(42);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Load Community spots on mount
  useEffect(() => {
    setCommunitySpots(getCommunitySpots());
  }, []);

  // Sync theme with document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load acoustic data whenever center or timeOfDay changes
  const loadAcousticData = useCallback(async (lat: number, lng: number, tod: TimeOfDay) => {
    // If user is near Bengaluru center, try to load pre-calculated quiet_paths.geojson as base
    if (Math.hypot(lat - 12.9716, lng - 77.5946) < 0.015) {
      try {
        const res = await fetch('/quiet_paths.geojson');
        if (res.ok) {
          const geo = await res.json();
          const parsed = parseGeoJsonToFeatures(geo);
          if (parsed.length > 0) {
            setFeatures(parsed);
            return;
          }
        }
      } catch (_) {}
    }

    // Otherwise fetch live from Overpass OSM / procedural engine anywhere in the world
    const data = await fetchAcousticData(lat, lng, tod);
    setFeatures(data);
  }, []);

  useEffect(() => {
    loadAcousticData(center[0], center[1], timeOfDay);
  }, [center, timeOfDay, loadAcousticData]);

  // Handle City Preset click
  const handleSelectCityPreset = (preset: CityPreset) => {
    setCenter([preset.lat, preset.lng]);
    setZoom(preset.zoom);
    setCurrentCityName(preset.name);
    // Clear routes when changing cities
    setOriginCoords(null);
    setDestinationCoords(null);
    setQuietRoute(null);
    setFastestRoute(null);
  };

  // Handle Search selection
  const handleSelectLocation = (lat: number, lng: number, name: string) => {
    setCenter([lat, lng]);
    setZoom(16);
    setCurrentCityName(name);
  };

  // Handle GPS Locate User
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCenter([lat, lng]);
        setZoom(16);
        setCurrentCityName('Current Location');
      },
      (err) => {
        alert('Could not access your location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Handle Map Click to set A -> B route
  const handleMapClick = async (lat: number, lng: number) => {
    if (!originCoords) {
      setOriginCoords([lat, lng]);
      const name = await reverseGeocode(lat, lng);
      setOriginName(name.split(',')[0]);
    } else if (!destinationCoords) {
      setDestinationCoords([lat, lng]);
      const name = await reverseGeocode(lat, lng);
      setDestinationName(name.split(',')[0]);

      // Calculate routes
      const routes = await calculateQuietAndFastRoutes(originCoords, [lat, lng], features);
      setQuietRoute(routes.quiet);
      setFastestRoute(routes.fastest);
      setSelectedRouteType('quiet');

      // If audio is playing, tune it to quiet route
      if (isAudioPlaying) {
        soundscape.updateAcousticTuning(routes.quiet.averageDb);
      }
    } else {
      // Third click restarts route from new origin
      setOriginCoords([lat, lng]);
      setDestinationCoords(null);
      setQuietRoute(null);
      setFastestRoute(null);
      const name = await reverseGeocode(lat, lng);
      setOriginName(name.split(',')[0]);
    }
  };

  // Toggle Audio Synthesizer
  const handleToggleAudio = () => {
    if (isAudioPlaying) {
      soundscape.stop();
      setIsAudioPlaying(false);
    } else {
      const avgDb = features.length > 0 ? features[0].noiseDb : 42;
      soundscape.start(avgDb);
      setIsAudioPlaying(true);
    }
  };

  // Hover over feature tunes synthesizer dynamically
  const handleHoverFeature = (feat: AcousticPathFeature | null) => {
    if (feat && isAudioPlaying) {
      soundscape.updateAcousticTuning(feat.noiseDb);
    }
  };

  // Save new Community Spot
  const handleSaveSpot = (spotData: Omit<CommunitySpot, 'id' | 'timestamp' | 'upvotes'>) => {
    const saved = saveCommunitySpot(spotData);
    setCommunitySpots((prev) => [saved, ...prev]);
  };

  // Clear current route
  const handleClearRoute = () => {
    setOriginCoords(null);
    setDestinationCoords(null);
    setQuietRoute(null);
    setFastestRoute(null);
  };

  return (
    <div className="app-layout">
      {/* Background Map Viewport */}
      <MapContainer
        center={center}
        zoom={zoom}
        theme={theme}
        acousticFeatures={features}
        communitySpots={communitySpots}
        quietRoute={quietRoute}
        fastestRoute={fastestRoute}
        selectedRouteType={selectedRouteType}
        onMapClick={handleMapClick}
        onHoverFeature={handleHoverFeature}
        originCoords={originCoords}
        destinationCoords={destinationCoords}
        activeFilter={activeFilter}
      />

      {/* Top Navbar */}
      <Navbar
        onSelectLocation={handleSelectLocation}
        onLocateUser={handleLocateUser}
        onOpenDecibelMeter={() => setIsDecibelMeterOpen(true)}
        onOpenAddSpot={() => {
          setMeasuredDbForSpot(42);
          setIsAddSpotOpen(true);
        }}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={handleToggleAudio}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        currentCityName={currentCityName}
      />

      {/* City Presets Bar */}
      <CityPresetsBar
        selectedCity={currentCityName}
        onSelectCity={handleSelectCityPreset}
      />

      {/* Route Comparison Panel */}
      <RoutePanel
        quietRoute={quietRoute}
        fastestRoute={fastestRoute}
        selectedType={selectedRouteType}
        onSelectType={setSelectedRouteType}
        onClearRoute={handleClearRoute}
        originName={originName || 'Origin A'}
        destinationName={destinationName || 'Destination B'}
      />

      {/* Time of Day Cycle Slider */}
      <TimeOfDaySlider
        timeOfDay={timeOfDay}
        onChangeTimeOfDay={setTimeOfDay}
      />

      {/* Acoustic Spectrum Legend HUD */}
      <LegendHUD
        totalPaths={features.length}
        activeFilter={activeFilter}
        onToggleFilter={(f) => setActiveFilter(activeFilter === f ? null : f)}
      />

      {/* Decibel Meter Modal */}
      <DecibelMeterModal
        isOpen={isDecibelMeterOpen}
        onClose={() => setIsDecibelMeterOpen(false)}
        onPinSpot={(measuredDb) => {
          setMeasuredDbForSpot(measuredDb);
          setIsAddSpotOpen(true);
        }}
      />

      {/* Community Spot Modal */}
      <CommunitySpotModal
        isOpen={isAddSpotOpen}
        onClose={() => setIsAddSpotOpen(false)}
        onSaveSpot={handleSaveSpot}
        defaultDb={measuredDbForSpot}
        centerCoords={center}
      />
    </div>
  );
};
