import React from 'react';
import { TimeOfDay } from '../types';
import { Clock, Sun, Moon, CloudSun, Flame } from 'lucide-react';
import { getTimeOfDayDelta } from '../services/acousticEngine';

interface TimeOfDaySliderProps {
  timeOfDay: TimeOfDay;
  onChangeTimeOfDay: (time: TimeOfDay) => void;
}

export const TimeOfDaySlider: React.FC<TimeOfDaySliderProps> = ({
  timeOfDay,
  onChangeTimeOfDay
}) => {
  const delta = getTimeOfDayDelta(timeOfDay);

  const presets: { id: TimeOfDay; label: string; icon: any }[] = [
    { id: 'live', label: 'Live Now', icon: Clock },
    { id: 'morning', label: '07:00 Morning', icon: CloudSun },
    { id: 'rush', label: '09:00 Rush Hour', icon: Flame },
    { id: 'afternoon', label: '14:00 Midday', icon: Sun },
    { id: 'night', label: '23:00 Night Calm', icon: Moon }
  ];

  return (
    <div className="glass-panel time-slider-widget interactive-layer">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={16} style={{ color: '#38bdf8' }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Acoustic Cycle:</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {presets.map((p) => {
          const Icon = p.icon;
          const isSelected = timeOfDay === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onChangeTimeOfDay(p.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                border: `1px solid ${isSelected ? '#38bdf8' : 'transparent'}`,
                background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={12} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: delta < 0 ? '#34d399' : (delta > 0 ? '#f59e0b' : 'var(--text-dim)'),
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'rgba(0,0,0,0.25)'
        }}
      >
        {delta > 0 ? `+${delta} dB Rush` : (delta < 0 ? `${delta} dB Calm` : 'Baseline')}
      </div>
    </div>
  );
};
