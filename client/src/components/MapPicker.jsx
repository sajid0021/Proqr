// Static imports MUST come first in ES modules
import React, { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';

// ── Fix Leaflet marker icons broken by Vite's asset hashing ────────
// Must be done synchronously, before any map renders
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Flies the map to new coords when lat/lng change (manual input) ──
function FlyTo({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    const la = parseFloat(lat);
    const lo = parseFloat(lng);
    if (!isNaN(la) && !isNaN(lo)) {
      map.flyTo([la, lo], Math.max(map.getZoom(), 12), { duration: 0.8 });
    }
  }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ── Captures map click and returns lat/lng strings ──────────────────
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(
        e.latlng.lat.toFixed(6),
        e.latlng.lng.toFixed(6),
      );
    },
  });
  return null;
}

// ── Main component ──────────────────────────────────────────────────
export default function MapPicker({ lat, lng, onChange }) {
  const hasCoords = lat !== '' && lng !== '' && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
  const center    = hasCoords ? [parseFloat(lat), parseFloat(lng)] : [20, 0];

  return (
    <div>
      {/* Map container */}
      <div style={{
        borderRadius: '14px 14px 0 0',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        borderBottom: 'none',
      }}>
        <MapContainer
          center={center}
          zoom={hasCoords ? 12 : 2}
          style={{ height: 240, width: '100%' }}
          attributionControl={false}
        >
          {/* Dark CartoDB tiles — no API key, matches dark theme */}
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <ClickHandler onPick={onChange} />
          <FlyTo lat={lat} lng={lng} />
          {hasCoords && (
            <Marker position={[parseFloat(lat), parseFloat(lng)]} />
          )}
        </MapContainer>
      </div>

      {/* Coordinates bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0 0 14px 14px',
      }}>
        <span style={{ fontSize: '0.85rem' }}>📍</span>
        <span style={{
          fontSize: '0.75rem', fontFamily: 'monospace',
          color: hasCoords ? '#a5b4fc' : 'rgba(255,255,255,0.28)',
        }}>
          {hasCoords ? `${lat},  ${lng}` : 'Click on the map to drop a pin'}
        </span>
      </div>
    </div>
  );
}
