import React from 'react';
import { LOGO_PRESETS } from '../utils/logoPresets';

const PRESETS = [
  {
    name: 'Royal Indigo',
    options: {
      dotsOptions: { color: '#6366f1', type: 'rounded', gradient: { type: 'linear', color1: '#6366f1', color2: '#8b5cf6', rotation: 45 } },
      cornersSquareOptions: { color: '#4f46e5', type: 'extra-rounded' },
      cornersDotOptions: { color: '#4f46e5', type: 'dot' },
      backgroundOptions: { color: '#ffffff' }
    }
  },
  {
    name: 'Sunset Glow',
    options: {
      dotsOptions: { color: '#f97316', type: 'extra-rounded', gradient: { type: 'linear', color1: '#f97316', color2: '#ec4899', rotation: 135 } },
      cornersSquareOptions: { color: '#db2777', type: 'rounded' },
      cornersDotOptions: { color: '#ea580c', type: 'rounded' },
      backgroundOptions: { color: '#ffffff' }
    }
  },
  {
    name: 'Forest Mint',
    options: {
      dotsOptions: { color: '#10b981', type: 'classy-rounded', gradient: { type: 'none' } },
      cornersSquareOptions: { color: '#047857', type: 'extra-rounded' },
      cornersDotOptions: { color: '#059669', type: 'dot' },
      backgroundOptions: { color: '#f0fdf4' }
    }
  },
  {
    name: 'Ocean Wave',
    options: {
      dotsOptions: { color: '#0284c7', type: 'classy', gradient: { type: 'linear', color1: '#0284c7', color2: '#06b6d4', rotation: 90 } },
      cornersSquareOptions: { color: '#0369a1', type: 'square' },
      cornersDotOptions: { color: '#0891b2', type: 'square' },
      backgroundOptions: { color: '#ffffff' }
    }
  },
  {
    name: 'Classic Dark',
    options: {
      dotsOptions: { color: '#000000', type: 'square', gradient: { type: 'none' } },
      cornersSquareOptions: { color: '#000000', type: 'square' },
      cornersDotOptions: { color: '#000000', type: 'square' },
      backgroundOptions: { color: '#ffffff' }
    }
  },
  {
    name: 'Midnight Rose',
    options: {
      dotsOptions: { color: '#f43f5e', type: 'dots', gradient: { type: 'radial', color1: '#fb7185', color2: '#312e81' } },
      cornersSquareOptions: { color: '#e11d48', type: 'rounded' },
      cornersDotOptions: { color: '#f43f5e', type: 'dot' },
      backgroundOptions: { color: '#faf5ff' }
    }
  }
];

const DOT_TYPES = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'dots', label: 'Dots' },
  { id: 'classy', label: 'Classy' },
  { id: 'classy-rounded', label: 'Classy Rnd' },
  { id: 'extra-rounded', label: 'Extra Rnd' }
];

const CORNER_SQUARE_TYPES = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'extra-rounded', label: 'Extra Rnd' },
  { id: 'dot', label: 'Dot' }
];

const CORNER_DOT_TYPES = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'dot', label: 'Dot' }
];

const EC_LEVELS = [
  { id: 'L', label: 'L', desc: 'Low (7%)' },
  { id: 'M', label: 'M', desc: 'Medium (15%)' },
  { id: 'Q', label: 'Q', desc: 'Quality (25% - Recommended for logos)' },
  { id: 'H', label: 'H', desc: 'High (30%)' }
];

export default function DesignStep({ data, setData }) {
  const updateOption = (section, key, val) => {
    setData((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        [section]: {
          ...prev.options[section],
          [key]: val
        }
      }
    }));
  };

  const updateRootOption = (key, val) => {
    setData((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        [key]: val
      }
    }));
  };

  const applyPreset = (preset) => {
    setData((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        dotsOptions: { ...prev.options.dotsOptions, ...preset.options.dotsOptions },
        cornersSquareOptions: { ...prev.options.cornersSquareOptions, ...preset.options.cornersSquareOptions },
        cornersDotOptions: { ...prev.options.cornersDotOptions, ...preset.options.cornersDotOptions },
        backgroundOptions: { ...prev.options.backgroundOptions, ...preset.options.backgroundOptions }
      }
    }));
  };

  const handleLogoPreset = (presetName) => {
    const logoUrl = presetName === 'none' ? '' : LOGO_PRESETS[presetName] || '';
    setData((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        logo: {
          ...prev.options.logo,
          preset: presetName,
          url: logoUrl
        }
      }
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setData((prev) => ({
        ...prev,
        options: {
          ...prev.options,
          logo: {
            ...prev.options.logo,
            preset: 'custom',
            url: event.target.result
          }
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const dots = data.options.dotsOptions || {};
  const grad = dots.gradient || { type: 'none', color1: '#6366f1', color2: '#ec4899', rotation: 0 };
  const cornersSquare = data.options.cornersSquareOptions || {};
  const cornersDot = data.options.cornersDotOptions || {};
  const bg = data.options.backgroundOptions || { color: '#ffffff' };
  const logo = data.options.logo || { url: '', preset: 'none', size: 0.3, margin: 5, hideBackgroundDots: true };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
      
      {/* ── Visual Presets ── */}
      <div>
        <p className="label-xs" style={{ marginBottom: 10 }}>Design Presets</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {PRESETS.map((p) => {
            const isSelected = dots.gradient?.color1 === p.options.dotsOptions.gradient?.color1 && dots.type === p.options.dotsOptions.type;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                style={{
                  padding: '10px 8px',
                  borderRadius: 12,
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(30,30,46,0.1)',
                  background: isSelected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.7)',
                  color: isSelected ? '#6366f1' : '#4b5563',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                <div style={{ display: 'flex', gap: 3 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: p.options.dotsOptions.gradient?.color1 || p.options.dotsOptions.color }} />
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: p.options.backgroundOptions.color, border: '1px solid rgba(0,0,0,0.1)' }} />
                </div>
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Dots Configuration ── */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 16 }}>
        <p className="label-xs" style={{ marginBottom: 10 }}>Dots Style</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
          {DOT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => updateOption('dotsOptions', 'type', t.id)}
              style={{
                padding: '8px 4px',
                borderRadius: 8,
                fontSize: '0.72rem',
                fontWeight: dots.type === t.id ? 700 : 500,
                cursor: 'pointer',
                border: dots.type === t.id ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(30,30,46,0.06)',
                background: dots.type === t.id ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.6)',
                color: dots.type === t.id ? '#6366f1' : '#4b5563'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="label-xs" style={{ marginBottom: 8, fontSize: '0.62rem' }}>Dots Fill Type</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {['none', 'linear', 'radial'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => updateOption('dotsOptions', 'gradient', { ...grad, type })}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 8,
                fontSize: '0.72rem',
                textTransform: 'capitalize',
                cursor: 'pointer',
                border: grad.type === type ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(0,0,0,0.06)',
                background: grad.type === type ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.6)',
                color: grad.type === type ? '#6366f1' : '#4b5563'
              }}
            >
              {type === 'none' ? 'Solid' : `${type} Gradient`}
            </button>
          ))}
        </div>

        {grad.type === 'none' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="color"
              value={dots.color || '#6366f1'}
              onChange={(e) => updateOption('dotsOptions', 'color', e.target.value)}
              style={{ width: 32, height: 32 }}
            />
            <div>
              <p style={{ fontSize: '0.7rem', color: '#888', marginBottom: 2 }}>Dots Color</p>
              <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 600 }}>{dots.color || '#6366f1'}</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={grad.color1 || '#6366f1'}
                  onChange={(e) => updateOption('dotsOptions', 'gradient', { ...grad, color1: e.target.value })}
                  style={{ width: 28, height: 28 }}
                />
                <div>
                  <p style={{ fontSize: '0.62rem', color: '#888' }}>Start</p>
                  <p style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>{grad.color1}</p>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={grad.color2 || '#ec4899'}
                  onChange={(e) => updateOption('dotsOptions', 'gradient', { ...grad, color2: e.target.value })}
                  style={{ width: 28, height: 28 }}
                />
                <div>
                  <p style={{ fontSize: '0.62rem', color: '#888' }}>End</p>
                  <p style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>{grad.color2}</p>
                </div>
              </div>
            </div>

            {grad.type === 'linear' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#888', marginBottom: 4 }}>
                  <span>Gradient Angle</span>
                  <span>{grad.rotation || 0}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={grad.rotation || 0}
                  onChange={(e) => updateOption('dotsOptions', 'gradient', { ...grad, rotation: parseInt(e.target.value) })}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Corners Configuration ── */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 16 }}>
        <p className="label-xs" style={{ marginBottom: 10 }}>Corners styling</p>
        
        {/* Corner Square (Outer Frame) */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>Outer Frame Shape & Color</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 8 }}>
            {CORNER_SQUARE_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => updateOption('cornersSquareOptions', 'type', t.id)}
                style={{
                  padding: '6px 2px',
                  borderRadius: 6,
                  fontSize: '0.68rem',
                  fontWeight: cornersSquare.type === t.id ? 700 : 500,
                  cursor: 'pointer',
                  border: cornersSquare.type === t.id ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(0,0,0,0.05)',
                  background: cornersSquare.type === t.id ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.6)',
                  color: cornersSquare.type === t.id ? '#6366f1' : '#4b5563'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={cornersSquare.color || '#6366f1'}
              onChange={(e) => updateOption('cornersSquareOptions', 'color', e.target.value)}
              style={{ width: 24, height: 24 }}
            />
            <span style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>{cornersSquare.color || '#6366f1'}</span>
          </div>
        </div>

        {/* Corner Dot (Inner Fill) */}
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>Inner Dot Shape & Color</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 8 }}>
            {CORNER_DOT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => updateOption('cornersDotOptions', 'type', t.id)}
                style={{
                  padding: '6px 2px',
                  borderRadius: 6,
                  fontSize: '0.68rem',
                  fontWeight: cornersDot.type === t.id ? 700 : 500,
                  cursor: 'pointer',
                  border: cornersDot.type === t.id ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(0,0,0,0.05)',
                  background: cornersDot.type === t.id ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.6)',
                  color: cornersDot.type === t.id ? '#6366f1' : '#4b5563'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={cornersDot.color || '#6366f1'}
              onChange={(e) => updateOption('cornersDotOptions', 'color', e.target.value)}
              style={{ width: 24, height: 24 }}
            />
            <span style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>{cornersDot.color || '#6366f1'}</span>
          </div>
        </div>
      </div>

      {/* ── Background Color ── */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 16 }}>
        <p className="label-xs" style={{ marginBottom: 10 }}>Background</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="color"
            value={bg.color || '#ffffff'}
            onChange={(e) => updateOption('backgroundOptions', 'color', e.target.value)}
            style={{ width: 32, height: 32 }}
          />
          <div>
            <p style={{ fontSize: '#0.7rem', color: '#888', marginBottom: 2 }}>Background Color</p>
            <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 600 }}>{bg.color || '#ffffff'}</p>
          </div>
        </div>
      </div>

      {/* ── Logo Overlays ── */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 16 }}>
        <p className="label-xs" style={{ marginBottom: 10 }}>Center Logo Branding</p>
        
        {/* Preset Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
          {[
            { id: 'none', label: 'None', icon: '❌' },
            { id: 'link', label: 'Link', icon: '🔗' },
            { id: 'wifi', label: 'WiFi', icon: '📶' },
            { id: 'github', label: 'GitHub', icon: '🐈' },
            { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
            { id: 'youtube', label: 'YouTube', icon: '📺' },
            { id: 'instagram', label: 'Insta', icon: '📸' }
          ].map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => handleLogoPreset(l.id)}
              style={{
                padding: '8px 4px',
                borderRadius: 8,
                fontSize: '0.7rem',
                fontWeight: logo.preset === l.id ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                border: logo.preset === l.id ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(0,0,0,0.05)',
                background: logo.preset === l.id ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.6)',
                color: logo.preset === l.id ? '#6366f1' : '#4b5563'
              }}
            >
              <span style={{ fontSize: '1rem' }}>{l.icon}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>

        {/* Custom Upload */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>Or Upload Custom Logo</p>
          <label style={{
            display: 'block',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px dashed rgba(99,102,241,0.3)',
            background: logo.preset === 'custom' ? 'rgba(99,102,241,0.04)' : 'rgba(0,0,0,0.02)',
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: '0.78rem',
            color: '#6366f1',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}>
            {logo.preset === 'custom' ? '✅ Custom logo loaded' : '📁 Choose Image (PNG/JPG)'}
            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
          </label>
        </div>

        {logo.url && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Logo Size */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#888', marginBottom: 4 }}>
                <span>Logo Scale</span>
                <span>{Math.round(logo.size * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.4"
                step="0.05"
                value={logo.size || 0.3}
                onChange={(e) => updateOption('logo', 'size', parseFloat(e.target.value))}
              />
            </div>

            {/* Logo Margin */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#888', marginBottom: 4 }}>
                <span>Logo Padding Margin</span>
                <span>{logo.margin || 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={logo.margin ?? 5}
                onChange={(e) => updateOption('logo', 'margin', parseInt(e.target.value))}
              />
            </div>

            {/* Hide Background Dots */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.75rem', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={logo.hideBackgroundDots ?? true}
                onChange={(e) => updateOption('logo', 'hideBackgroundDots', e.target.checked)}
                style={{ width: 14, height: 14 }}
              />
              Clear QR dots behind logo
            </label>
          </div>
        )}
      </div>

      {/* ── Advanced Specifications ── */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 16, paddingBottom: 10 }}>
        <p className="label-xs" style={{ marginBottom: 10 }}>QR Specifications</p>
        
        {/* Output Width */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#888', marginBottom: 4 }}>
            <span>Output Size</span>
            <span>{data.options.width || 400}px</span>
          </div>
          <input
            type="range"
            min="200"
            max="1000"
            step="50"
            value={data.options.width || 400}
            onChange={(e) => updateRootOption('width', parseInt(e.target.value))}
          />
        </div>

        {/* Quiet Zone / Margin */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#888', marginBottom: 4 }}>
            <span>Quiet Zone (Margin)</span>
            <span>{data.options.margin ?? 4}</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={data.options.margin ?? 4}
            onChange={(e) => updateRootOption('margin', parseInt(e.target.value))}
          />
        </div>

        {/* Error Correction */}
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>Error Correction (EC)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 6 }}>
            {EC_LEVELS.map((ec) => (
              <button
                key={ec.id}
                type="button"
                onClick={() => updateRootOption('errorCorrectionLevel', ec.id)}
                title={ec.desc}
                style={{
                  padding: '6px 0',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                  fontWeight: data.options.errorCorrectionLevel === ec.id ? 700 : 500,
                  cursor: 'pointer',
                  border: data.options.errorCorrectionLevel === ec.id ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(0,0,0,0.05)',
                  background: data.options.errorCorrectionLevel === ec.id ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.6)',
                  color: data.options.errorCorrectionLevel === ec.id ? '#6366f1' : '#4b5563'
                }}
              >
                {ec.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.62rem', color: '#888' }}>
            Note: <strong>Q</strong> or <strong>H</strong> is recommended when adding logos to ensure scanning readability.
          </p>
        </div>
      </div>

    </div>
  );
}
