import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  Compass,
  PlusCircle,
  Sun,
  Moon,
  Search,
  X,
  Navigation2
} from 'lucide-react';
import { searchLocations, SearchResult } from '../services/geocoding';

interface NavbarProps {
  onSelectLocation: (lat: number, lng: number, name: string) => void;
  onLocateUser: () => void;
  onOpenDecibelMeter: () => void;
  onOpenAddSpot: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentCityName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSelectLocation,
  onLocateUser,
  onOpenDecibelMeter,
  onOpenAddSpot,
  isAudioPlaying,
  onToggleAudio,
  theme,
  onToggleTheme,
  currentCityName
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const res = await searchLocations(query);
      setResults(res);
      setIsSearching(false);
      setShowDropdown(res.length > 0);
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    setShowDropdown(false);
    setQuery('');
    onSelectLocation(item.lat, item.lng, item.displayName.split(',')[0]);
  };

  return (
    <header className="top-nav interactive-layer">
      {/* Brand logo & tagline */}
      <div className="brand-badge" onClick={onLocateUser} title="QuietPath: Urban Acoustic & Peaceful Route Intelligence">
        <div className="brand-icon-wrap">
          <Navigation2 size={18} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-title brand-font">QuietPath</span>
            <span className="brand-tag">v2.0 Beta</span>
          </div>
        </div>
      </div>

      {/* Global search bar */}
      <div className="search-container">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon-left" />
          <input
            type="text"
            className="search-input"
            placeholder={`Search any address or city anywhere (e.g. Paris, Tokyo, Brooklyn)...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
          />
          {query && (
            <button
              className="search-clear-btn"
              onClick={() => {
                setQuery('');
                setShowDropdown(false);
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && (
          <div className="search-dropdown">
            {results.map((r, idx) => (
              <div
                key={idx}
                className="search-item"
                onClick={() => handleSelect(r)}
              >
                <Compass size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 600 }}>{r.displayName.split(',')[0]}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {r.displayName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="nav-actions">
        {/* GPS Locate Me */}
        <button
          className="btn-pill"
          onClick={onLocateUser}
          title="Teleport to your current live location"
        >
          <Compass size={17} style={{ color: '#38bdf8' }} />
          <span>My GPS</span>
        </button>

        {/* Ambient Sound Synthesizer */}
        <button
          className={`btn-pill ${isAudioPlaying ? 'active' : ''}`}
          onClick={onToggleAudio}
          title={isAudioPlaying ? 'Mute ambient soundscape' : 'Listen to ambient sound simulation'}
        >
          {isAudioPlaying ? (
            <>
              <Volume2 size={17} style={{ color: '#10b981' }} />
              <span>Auditioning</span>
            </>
          ) : (
            <>
              <VolumeX size={17} />
              <span>Soundscape</span>
            </>
          )}
        </button>

        {/* Real-time Decibel Meter */}
        <button
          className="btn-pill primary"
          onClick={onOpenDecibelMeter}
          title="Measure ambient sound with live microphone meter"
        >
          <Mic size={17} />
          <span>dB Meter</span>
        </button>

        {/* Add Spot */}
        <button
          className="btn-pill"
          onClick={onOpenAddSpot}
          title="Contribute a quiet sanctuary or report noise"
        >
          <PlusCircle size={17} style={{ color: '#34d399' }} />
          <span>Report Spot</span>
        </button>

        {/* Dark/Light mode */}
        <button
          className="btn-pill"
          onClick={onToggleTheme}
          style={{ width: '42px', padding: 0, justifyContent: 'center' }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
};
