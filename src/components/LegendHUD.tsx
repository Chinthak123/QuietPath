import React from 'react';
import { Filter, Eye, Layers } from 'lucide-react';

interface LegendHUDProps {
  totalPaths: number;
  activeFilter: string | null;
  onToggleFilter: (category: string) => void;
}

export const LegendHUD: React.FC<LegendHUDProps> = ({
  totalPaths,
  activeFilter,
  onToggleFilter
}) => {
  const levels = [
    { id: 'serene', label: 'Serene Sanctuary', range: '< 45 dB', color: '#10b981' },
    { id: 'quiet', label: 'Tranquil & Pleasant', range: '45 - 55 dB', color: '#06b6d4' },
    { id: 'moderate', label: 'Urban Hum', range: '55 - 65 dB', color: '#f59e0b' },
    { id: 'loud', label: 'High Traffic', range: '65 - 75 dB', color: '#f97316' },
    { id: 'severe', label: 'Extreme Noise', range: '> 75 dB', color: '#ef4444' }
  ];

  return (
    <div className="glass-panel legend-widget interactive-layer">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={15} style={{ color: '#10b981' }} />
          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Acoustic Spectrum</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
          {totalPaths} Paths Analyzed
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {levels.map((lvl) => {
          const isActive = activeFilter === lvl.id || activeFilter === null;
          return (
            <div
              key={lvl.id}
              onClick={() => onToggleFilter(lvl.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: activeFilter === lvl.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                opacity: isActive ? 1 : 0.35,
                transition: 'all 0.15s ease'
              }}
              title="Click to isolate this acoustic level"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: lvl.color,
                    boxShadow: `0 0 6px ${lvl.color}`
                  }}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>{lvl.label}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {lvl.range}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Tip: Click map to set Quiet Route</span>
        {activeFilter && (
          <button
            onClick={() => onToggleFilter(activeFilter)}
            style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.7rem', textDecoration: 'underline' }}
          >
            Reset Filter
          </button>
        )}
      </div>
    </div>
  );
};
