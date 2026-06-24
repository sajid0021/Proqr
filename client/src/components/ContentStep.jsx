import React, { useState } from 'react';
import FileUpload from './FileUpload';
import MapPicker from './MapPicker';

// ── Type definitions ───────────────────────────────────────────────
const TYPES = [
  { id: 'url',   label: 'URL',   icon: '🔗', desc: 'Website link'    },
  { id: 'text',  label: 'Text',  icon: '📝', desc: 'Plain message'   },
  { id: 'audio', label: 'Audio', icon: '🎵', desc: 'MP3 / WAV / OGG' },
  { id: 'pdf',   label: 'PDF',   icon: '📄', desc: 'Document'        },
  { id: 'image', label: 'Image', icon: '🖼️', desc: 'JPG / PNG / WebP' },
  { id: 'map',   label: 'Map',   icon: '📍', desc: 'Location pin'    },
  { id: 'wifi',  label: 'WiFi',  icon: '📶', desc: 'Network creds'   },
  { id: 'email', label: 'Email', icon: '✉️', desc: 'Email address'   },
  { id: 'phone', label: 'Phone', icon: '📞', desc: 'Phone number'    },
  { id: 'sms',   label: 'SMS',   icon: '💬', desc: 'Text message'    },
];

// ── Shared label style ─────────────────────────────────────────────
const LBL = { fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(30,30,46,0.38)', marginBottom: 10, display: 'block' };

function UrlTextInput({ data, setData }) {
  return (
    <textarea
      rows="3"
      value={data.text}
      onChange={(e) => setData({ ...data, text: e.target.value })}
      placeholder={data.type === 'url' ? 'https://example.com' : 'Type your message here…'}
      className="p-input"
    />
  );
}

function WifiInput({ data, setData }) {
  const ssid = data.text.match(/WIFI:S:(.*?);/)?.[1]  ?? '';
  const pass = data.text.match(/;P:(.*?);;/)?.[1]      ?? '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input type="text" placeholder="Network Name (SSID)" className="p-input"
        defaultValue={ssid}
        onChange={(e) => {
          const p = data.text.match(/;P:(.*?);;/)?.[1] ?? '';
          setData({ ...data, text: `WIFI:S:${e.target.value};T:WPA;P:${p};;` });
        }}
      />
      <input type="password" placeholder="Password" className="p-input"
        defaultValue={pass}
        onChange={(e) => {
          const s = data.text.match(/WIFI:S:(.*?);/)?.[1] ?? '';
          setData({ ...data, text: `WIFI:S:${s};T:WPA;P:${e.target.value};;` });
        }}
      />
    </div>
  );
}

function MapInput({ data, setData }) {
  const [tab, setTab]  = useState('pin');   // 'pin' | 'gmap'
  const [lat, setLat]  = useState('');
  const [lng, setLng]  = useState('');

  const updateCoords = (newLat, newLng) => {
    setLat(newLat); setLng(newLng);
    setData({ ...data, text: `https://www.google.com/maps?q=${newLat},${newLng}` });
  };

  const TAB_BTN = (id, label) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      style={{
        flex: 1, padding: '8px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
        background: tab === id ? 'rgba(99,102,241,0.08)'    : 'rgba(30,30,46,0.03)',
        border:     tab === id ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(30,30,46,0.08)',
        color:      tab === id ? '#6366f1' : '#6b7280',
        cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
      }}
    >{label}</button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {TAB_BTN('pin',  '📍 Drop a Pin')}
        {TAB_BTN('gmap', '🗺️ Google Maps URL')}
      </div>

      {tab === 'gmap' ? (
        <input
          type="url"
          placeholder="https://maps.google.com/maps?q=..."
          className="p-input"
          onChange={(e) => setData({ ...data, text: e.target.value })}
        />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="number" step="any" placeholder="Latitude"
              className="p-input" value={lat}
              style={{ flex: 1 }}
              onChange={(e) => updateCoords(e.target.value, lng)}
            />
            <input
              type="number" step="any" placeholder="Longitude"
              className="p-input" value={lng}
              style={{ flex: 1 }}
              onChange={(e) => updateCoords(lat, e.target.value)}
            />
          </div>
          <MapPicker lat={lat} lng={lng} onChange={(la, lo) => updateCoords(la, lo)} />
        </>
      )}
    </div>
  );
}

export default function ContentStep({ data, setData }) {
  const [uploadedFilename, setUploadedFilename] = useState('');

  const handleTypeChange = (type) => {
    setData((prev) => ({
      ...prev,
      type,
      text: '',
      isDynamic: false,
      dynamicName: ''
    }));
    setUploadedFilename('');
  };

  const handleUpload = (url, name) => {
    setData((prev) => ({ ...prev, text: url }));
    setUploadedFilename(name);
  };

  // Only link-based types support Dynamic redirects
  const dynamicSupported = ['url', 'pdf', 'audio', 'image', 'map'].includes(data.type);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Type Grid ── */}
      <div>
        <span style={LBL}>QR Code Type</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {TYPES.map(({ id, label, icon, desc }) => {
            const active = data.type === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTypeChange(id)}
                title={desc}
                style={{
                  padding: '10px 4px',
                  borderRadius: 12,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  border:     active ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(30,30,46,0.06)',
                  background: active ? 'rgba(99,102,241,0.06)'            : 'rgba(30,30,46,0.03)',
                  color:      active ? '#6366f1' : '#4b5563',
                  cursor: 'pointer',
                  transform: active ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{icon}</span>
                <span style={{ fontSize: '0.64rem', fontWeight: 600 }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Dynamic QR Toggle (Only shown for supported types) ── */}
      <div style={{
        padding: 14,
        borderRadius: 14,
        background: data.isDynamic ? 'rgba(99,102,241,0.05)' : 'rgba(30,30,46,0.02)',
        border: data.isDynamic ? '1px solid rgba(99,102,241,0.22)' : '1px solid rgba(30,30,46,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        opacity: dynamicSupported ? 1 : 0.55,
        transition: 'all 0.2s'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1f2937', margin: '0 0 2px 0' }}>Dynamic QR Code</h4>
            <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: 0 }}>
              {dynamicSupported 
                ? 'Enable editable link destination & scan analytics' 
                : 'Not supported for locally-resolved types'}
            </p>
          </div>
          {dynamicSupported && (
            <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.isDynamic || false}
                onChange={(e) => setData((prev) => ({ ...prev, isDynamic: e.target.checked, dynamicName: e.target.checked ? `Campaign - ${new Date().toLocaleDateString()}` : '' }))}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', inset: 0, borderRadius: 20,
                background: data.isDynamic ? '#6366f1' : '#d1d5db',
                transition: '0.25s'
              }} />
              <span style={{
                position: 'absolute', left: 3, bottom: 3, width: 16, height: 16, borderRadius: '50%',
                background: 'white',
                transform: data.isDynamic ? 'translateX(18px)' : 'translateX(0)',
                transition: '0.25s'
              }} />
            </label>
          )}
        </div>
        
        {data.isDynamic && dynamicSupported && (
          <input
            type="text"
            placeholder="QR Label / Campaign Name"
            className="p-input"
            style={{ background: 'white', padding: '8px 12px', fontSize: '0.78rem', borderRadius: 10 }}
            value={data.dynamicName || ''}
            onChange={(e) => setData((prev) => ({ ...prev, dynamicName: e.target.value }))}
          />
        )}
      </div>

      {/* ── Input Area ── */}
      <div>
        <span style={LBL}>
          {data.type === 'url'   ? 'Website URL'
          : data.type === 'text'  ? 'Your Text'
          : data.type === 'audio' ? 'Audio File'
          : data.type === 'pdf'   ? 'PDF Document'
          : data.type === 'image' ? 'Image File'
          : data.type === 'map'   ? 'Location'
          : data.type === 'wifi'  ? 'Network Details'
          : data.type === 'email' ? 'Email Address'
          : data.type === 'phone' ? 'Phone Number'
          :                         'SMS Details'}
        </span>

        {(data.type === 'url' || data.type === 'text') && (
          <UrlTextInput data={data} setData={setData} />
        )}

        {data.type === 'email' && (
          <input type="email" placeholder="hello@example.com" className="p-input"
            value={data.text.replace(/^mailto:/i, '')}
            onChange={(e) => setData((prev) => ({ ...prev, text: `mailto:${e.target.value}` }))}
          />
        )}

        {data.type === 'phone' && (
          <input type="tel" placeholder="+1 (555) 000-0000" className="p-input"
            value={data.text.replace(/^tel:/i, '')}
            onChange={(e) => setData((prev) => ({ ...prev, text: `tel:${e.target.value}` }))}
          />
        )}

        {data.type === 'sms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="tel" placeholder="+1 (555) 000-0000" className="p-input"
              onChange={(e) => {
                const msg = data.text.split(':')[2] ?? '';
                setData((prev) => ({ ...prev, text: `SMSTO:${e.target.value}:${msg}` }));
              }}
            />
            <textarea rows="2" placeholder="Message (optional)" className="p-input"
              onChange={(e) => {
                const num = data.text.replace(/^SMSTO:/i, '').split(':')[0] ?? '';
                setData((prev) => ({ ...prev, text: `SMSTO:${num}:${e.target.value}` }));
              }}
            />
          </div>
        )}

        {data.type === 'wifi'  && <WifiInput data={data} setData={setData} />}
        {data.type === 'map'   && <MapInput  data={data} setData={setData} />}

        {data.type === 'audio' && (
          <FileUpload
            accept="audio/*"
            label="Audio File" icon="🎵"
            hint="MP3, WAV, OGG, M4A · Max 50 MB"
            value={data.text} filename={uploadedFilename}
            onUpload={handleUpload}
          />
        )}

        {data.type === 'pdf' && (
          <FileUpload
            accept="application/pdf"
            label="PDF Document" icon="📄"
            hint="PDF only · Max 50 MB"
            value={data.text} filename={uploadedFilename}
            onUpload={handleUpload}
          />
        )}

        {data.type === 'image' && (
          <FileUpload
            accept="image/*"
            label="Image" icon="🖼️"
            hint="JPG, PNG, WebP, GIF · Max 50 MB"
            value={data.text} filename={uploadedFilename}
            onUpload={handleUpload}
          />
        )}

        {data.text && !['audio','pdf','image','map'].includes(data.type) && (
          <p style={{ fontSize: '0.65rem', color: 'rgba(30,30,46,0.3)', marginTop: 6, textAlign: 'right' }}>
            {data.text.length} characters
          </p>
        )}
      </div>

    </div>
  );
}
