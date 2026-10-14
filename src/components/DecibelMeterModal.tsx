import React, { useEffect, useState, useRef } from 'react';
import { LiveDecibelMeter } from '../services/decibelMeter';
import { Mic, X, MapPin, AlertCircle, Sparkles, Volume2 } from 'lucide-react';
import { getSoundCategory } from '../services/acousticEngine';

interface DecibelMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPinSpot: (measuredDb: number) => void;
}

export const DecibelMeterModal: React.FC<DecibelMeterModalProps> = ({
  isOpen,
  onClose,
  onPinSpot
}) => {
  const [currentDb, setCurrentDb] = useState(42);
  const [peakDb, setPeakDb] = useState(42);
  const [averageDb, setAverageDb] = useState(42);
  const [isSimulated, setIsSimulated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const meterRef = useRef<LiveDecibelMeter | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (meterRef.current) {
        meterRef.current.stop();
        meterRef.current = null;
      }
      return;
    }

    const meter = new LiveDecibelMeter();
    meterRef.current = meter;

    meter.start(({ currentDb, peakDb, averageDb, frequencyData }) => {
      setCurrentDb(currentDb);
      setPeakDb(peakDb);
      setAverageDb(averageDb);

      // Draw spectrum on canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const barWidth = (canvas.width / 40);
          let x = 0;

          for (let i = 0; i < 40; i++) {
            const val = frequencyData[i * 4] || 0;
            const barHeight = (val / 255) * canvas.height;

            const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
            grad.addColorStop(0, '#10b981');
            grad.addColorStop(0.6, '#06b6d4');
            grad.addColorStop(1, '#f59e0b');

            ctx.fillStyle = grad;
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            x += barWidth;
          }
        }
      }
    }).then((res) => {
      setIsSimulated(res.simulated);
    });

    return () => {
      if (meterRef.current) {
        meterRef.current.stop();
        meterRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const category = getSoundCategory(currentDb);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content interactive-layer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Mic size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Live Decibel Acoustic Meter</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Citizen Science Real-time Sound Sensor
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Meter Gauge Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {isSimulated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 12px', borderRadius: '999px', marginBottom: '16px' }}>
              <AlertCircle size={14} />
              <span>Microphone simulated demo mode (Allow mic access for real ambient measurement)</span>
            </div>
          )}

          {/* Big Circular Decibel Display */}
          <div
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(17,24,39,0.9) 60%, ${category.glow} 100%)`,
              border: `3px solid ${category.color}`,
              boxShadow: `0 0 35px ${category.glow}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            <div style={{ fontSize: '3.2rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: category.color, lineHeight: 1 }}>
              {currentDb}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: '4px' }}>
              DECIBELS (dBA)
            </div>
          </div>

          {/* Sound Category Pill */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: `${category.color}20`,
                color: category.color,
                border: `1px solid ${category.color}50`,
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              {category.label}
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '320px' }}>
            {category.description}
          </p>

          {/* Real-time spectrum canvas */}
          <div style={{ width: '100%', height: '50px', marginTop: '18px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden', padding: '4px' }}>
            <canvas ref={canvasRef} width={380} height={42} style={{ width: '100%', height: '100%' }} />
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', width: '100%', marginTop: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Average LAeq</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>{averageDb} dB</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Peak Loudness</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>{peakDb} dB</div>
            </div>
          </div>

          {/* Pin Button */}
          <button
            className="btn-pill primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}
            onClick={() => {
              onClose();
              onPinSpot(currentDb);
            }}
          >
            <MapPin size={17} />
            <span>Pin This Reading to Community Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
