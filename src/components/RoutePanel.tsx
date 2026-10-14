import React from 'react';
import { RouteOption } from '../types';
import {
  Navigation,
  Sparkles,
  Zap,
  Volume2,
  TreeDeciduous,
  ArrowRight,
  Download,
  X,
  Footprints,
  ShieldCheck
} from 'lucide-react';
import { exportToGpx } from '../services/routingService';

interface RoutePanelProps {
  quietRoute: RouteOption | null;
  fastestRoute: RouteOption | null;
  selectedType: 'quiet' | 'fastest';
  onSelectType: (type: 'quiet' | 'fastest') => void;
  onClearRoute: () => void;
  originName: string;
  destinationName: string;
}

export const RoutePanel: React.FC<RoutePanelProps> = ({
  quietRoute,
  fastestRoute,
  selectedType,
  onSelectType,
  onClearRoute,
  originName,
  destinationName
}) => {
  if (!quietRoute || !fastestRoute) return null;

  const currentRoute = selectedType === 'quiet' ? quietRoute : fastestRoute;

  const handleDownloadGpx = () => {
    const xml = exportToGpx(currentRoute);
    const blob = new Blob([xml], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quietpath-${selectedType}-route.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDistance = (m: number) => {
    if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
    return `${m} m`;
  };

  const formatDuration = (s: number) => {
    const mins = Math.round(s / 60);
    return `${mins} min walk`;
  };

  return (
    <div className="glass-panel route-panel interactive-layer">
      {/* Route Header */}
      <div className="route-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Navigation size={18} style={{ color: '#10b981' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Acoustic Navigation</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Comparing Tranquil vs Arterial Corridors
            </div>
          </div>
        </div>
        <button
          onClick={onClearRoute}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
          title="Clear Route"
        >
          <X size={18} />
        </button>
      </div>

      {/* Route Switcher & Cards */}
      <div className="route-body">
        {/* Origin / Dest preview */}
        <div style={{ fontSize: '0.8rem', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }}></span>
            <span style={{ color: 'var(--text-muted)' }}>From:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{originName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            <span style={{ color: 'var(--text-muted)' }}>To:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{destinationName}</span>
          </div>
        </div>

        {/* Quiet Path Choice */}
        <div
          className={`route-card ${selectedType === 'quiet' ? 'selected-quiet' : ''}`}
          onClick={() => onSelectType('quiet')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#34d399' }}>
                  QuietPath (Recommended)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Low-decibel parks & pedestrian havens
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                padding: '4px 8px',
                borderRadius: '999px'
              }}
            >
              -{quietRoute.noiseReductionPercent}% Sound
            </span>
          </div>

          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#34d399' }}>{quietRoute.averageDb} dB</div>
              <div className="stat-label">Avg Noise</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatDuration(quietRoute.durationSeconds)}</div>
              <div className="stat-label">{formatDistance(quietRoute.distanceMeters)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#38bdf8' }}>{quietRoute.tranquilityScore}%</div>
              <div className="stat-label">Serenity</div>
            </div>
          </div>
        </div>

        {/* Fastest Arterial Choice */}
        <div
          className={`route-card ${selectedType === 'fastest' ? 'selected-fastest' : ''}`}
          onClick={() => onSelectType('fastest')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                <Zap size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Fastest Arterial</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Shortest distance via main roads
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Direct</span>
          </div>

          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#f59e0b' }}>{fastestRoute.averageDb} dB</div>
              <div className="stat-label">Avg Noise</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatDuration(fastestRoute.durationSeconds)}</div>
              <div className="stat-label">{formatDistance(fastestRoute.distanceMeters)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--text-muted)' }}>{fastestRoute.tranquilityScore}%</div>
              <div className="stat-label">Serenity</div>
            </div>
          </div>
        </div>

        {/* Acoustic Dosage Advantage Banner */}
        {selectedType === 'quiet' && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <ShieldCheck size={20} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <strong>Sound Dose Protection:</strong> Cuts acoustic stress by <strong>{quietRoute.noiseReductionPercent}%</strong> for just an extra 2 minutes of walking.
            </div>
          </div>
        )}

        {/* Turn-by-Turn Steps */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Footprints size={15} style={{ color: '#10b981' }} />
            <span>Turn-by-Turn Acoustic Directions</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '8px 12px' }}>
            {currentRoute.steps.map((step, idx) => (
              <div key={idx} className="step-item">
                <div
                  className="step-icon-wrap"
                  style={{
                    background: step.averageDb < 50 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: step.averageDb < 50 ? '#34d399' : '#f59e0b'
                  }}
                >
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div>{step.instruction}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>{formatDistance(step.distanceMeters)}</span>
                    <span>•</span>
                    <span style={{ color: step.averageDb < 50 ? '#34d399' : '#f59e0b', fontWeight: 600 }}>
                      ~{step.averageDb} dB
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action: Export to GPX */}
        <button
          className="btn-pill primary"
          onClick={handleDownloadGpx}
          style={{ justifyContent: 'center', width: '100%' }}
        >
          <Download size={16} />
          <span>Export Route to GPX (Apple Watch / Garmin)</span>
        </button>
      </div>
    </div>
  );
};
