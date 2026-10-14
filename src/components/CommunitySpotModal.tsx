import React, { useState } from 'react';
import { X, MapPin, Check, Trees, Coffee, BookOpen, Home, AlertTriangle, Construction } from 'lucide-react';
import { CommunitySpot } from '../types';

interface CommunitySpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSpot: (spot: Omit<CommunitySpot, 'id' | 'timestamp' | 'upvotes'>) => void;
  defaultDb?: number;
  centerCoords: [number, number];
}

export const CommunitySpotModal: React.FC<CommunitySpotModalProps> = ({
  isOpen,
  onClose,
  onSaveSpot,
  defaultDb = 42,
  centerCoords
}) => {
  const [name, setName] = useState('');
  const [dbLevel, setDbLevel] = useState(defaultDb);
  const [category, setCategory] = useState<CommunitySpot['category']>('park');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveSpot({
      name: name.trim(),
      lat: centerCoords[0] + (Math.random() - 0.5) * 0.002, // slight jitter around current viewport center
      lng: centerCoords[1] + (Math.random() - 0.5) * 0.002,
      dbLevel: Number(dbLevel),
      category,
      notes: notes.trim()
    });

    setName('');
    setNotes('');
    onClose();
  };

  const categories = [
    { id: 'park', label: 'Park / Garden', icon: Trees },
    { id: 'cafe', label: 'Quiet Café', icon: Coffee },
    { id: 'library', label: 'Library / Study', icon: BookOpen },
    { id: 'residential', label: 'Quiet Mews', icon: Home },
    { id: 'construction', label: 'Loud Construction', icon: Construction }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content interactive-layer" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <MapPin size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Report Acoustic Spot</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Contribute to the global quiet map
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Spot Name or Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bamboo Grove Courtyard, Sunny Reading Bench"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="search-input"
              style={{ borderRadius: '8px', padding: '0 14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {categories.map((c) => {
                const Icon = c.icon;
                const isSelected = category === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCategory(c.id as any)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isSelected ? '#10b981' : 'var(--border-subtle)'}`,
                      color: isSelected ? '#34d399' : 'var(--text-main)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Icon size={15} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Estimated or Measured Decibels
              </label>
              <span style={{ fontWeight: 700, color: '#34d399' }}>{dbLevel} dB</span>
            </div>
            <input
              type="range"
              min="30"
              max="95"
              value={dbLevel}
              onChange={(e) => setDbLevel(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10b981' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Notes & Acoustic Impressions
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Hidden behind stone walls, very peaceful in mornings..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="search-input"
              style={{ borderRadius: '8px', padding: '10px 14px', height: 'auto', resize: 'none' }}
            />
          </div>

          <button type="submit" className="btn-pill primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
            <Check size={16} />
            <span>Pin Spot to Live Map</span>
          </button>
        </form>
      </div>
    </div>
  );
};
