# QuietPath 🌿🔊
> **Ambient Acoustic Navigation & Urban Soundscape Intelligence Platform**

QuietPath is a modern, real-world startup application designed to discover serene, low-decibel walking corridors and live urban acoustic soundscapes anywhere on Earth.

Deployed with zero-config on **Vercel**.

---

## ✨ Features

- 🌍 **Worldwide Acoustic Mapping**:
  - Live Overpass OpenStreetMap road and pedestrian network queries with real-time acoustic physics modeling (ISO 9613-2 / CNOSSOS-EU approximation).
  - High-res procedural acoustic fallback engine ensuring 100% uptime anywhere on Earth.
  - Bundled high-density acoustic dataset for Bengaluru and presets for global capitals (New York, Tokyo, London, Paris, San Francisco, Amsterdam, Singapore).

- 🚶‍♂️ **Dual-Engine Quiet Routing**:
  - Point-to-point walking route calculation.
  - Compares **QuietPath (Tranquil Route)** vs **Fastest Arterial Route**.
  - Calculates average dB, peak loudness, acoustic dose reduction (**-% sound pollution**), and serenity index.
  - Turn-by-turn walking directions with ambient noise alerts.
  - ⌚ **Export to GPX**: One-click download of `.gpx` routes for Apple Watch, Garmin, Strava, and Google Maps.

- 🎙️ **Live Microphone Decibel Meter (SoundPrint-Style Citizen Science)**:
  - Real-time Web Audio API decibel capture (LAeq sound pressure calibration).
  - Live canvas frequency spectrum analyzer.
  - Pin measured acoustic spots directly to the interactive community map.

- 🎵 **Ambient Soundscape Auditioning**:
  - Web Audio API pure procedural synthesizer allowing users to preview what 40 dB serene park ambiance feels like vs 75 dB urban traffic.

- 🕒 **Dynamic Time-of-Day Acoustic Simulator**:
  - Real-time sync with local hour or manual dial between Morning calm, Rush hour (+7 dB), Midday, Evening, and Midnight tranquility (-13 dB).

- 🎨 **Startup-Grade Dark Obsidian Glassmorphism**:
  - High-contrast neon acoustic heatmap vectors.
  - Responsive floating HUD panels, interactive legend filters, and light/dark theme toggle.

---

## 🚀 Hosting on Vercel

This project is fully configured for seamless, zero-config deployment on **Vercel**:

### Option 1: Deploy with Git (Recommended)
1. Push this repository to GitHub or GitLab.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your repository.
4. Vercel automatically detects the Vite framework and applies the settings from [`vercel.json`](./vercel.json):
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**!

### Option 2: Deploy with Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local Vite dev server
npm run dev

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Mapping & GIS**: Leaflet, OpenStreetMap, CartoDB Positron / Voyager / Dark Matter
- **Routing**: Open Source Routing Machine (OSRM) Walk API & Acoustic Cost Minimizer
- **Geocoding**: OpenStreetMap Nominatim Geocoding API
- **Audio Processing**: Web Audio API (MediaStreamAnalyser, BiquadFilter Synthesizer)
- **Deployment**: Vercel CDN Edge Hosting
