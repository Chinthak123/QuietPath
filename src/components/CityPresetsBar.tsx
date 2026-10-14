import React from 'react';
import { CITY_PRESETS } from '../services/geocoding';
import { CityPreset } from '../types';
import { MapPin } from 'lucide-react';

interface CityPresetsBarProps {
  selectedCity: string;
  onSelectCity: (preset: CityPreset) => void;
}

export const CityPresetsBar: React.FC<CityPresetsBarProps> = ({
  selectedCity,
  onSelectCity
}) => {
  return (
    <div className="city-presets-container interactive-layer">
      {CITY_PRESETS.map((city) => {
        const isSelected = selectedCity.toLowerCase() === city.name.toLowerCase();
        return (
          <button
            key={city.name}
            className={`city-chip ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectCity(city)}
            title={`${city.name}: ${city.description}`}
          >
            <MapPin size={13} style={{ color: isSelected ? '#10b981' : 'var(--text-dim)' }} />
            <span>{city.name}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>• {city.tag.split('&')[0]}</span>
          </button>
        );
      })}
    </div>
  );
};
