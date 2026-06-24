import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

// ── Helper: Classify and Parse QR Code Content ────────────────────────
function parseQRContent(text) {
  const t = text.trim();
  
  if (t.startsWith('http://') || t.startsWith('https://')) {
    return { type: 'URL', label: 'Website Link', icon: '🔗', action: 'Open Link', url: t };
  }
  if (t.startsWith('mailto:')) {
    const email = t.replace(/^mailto:/i, '').split('?')[0];
    return { type: 'Email', label: 'Send Email', icon: '✉️', action: 'Draft Email', url: t, detail: email };
  }
  if (t.startsWith('tel:')) {
    const num = t.replace(/^tel:/i, '');
    return { type: 'Phone', label: 'Phone Number', icon: '📞', action: 'Call Number', url: t, detail: num };
  }
  if (t.startsWith('SMSTO:')) {
    const parts = t.split(':');
    const num = parts[1] || '';
    const msg = parts.slice(2).join(':') || '';
    return { type: 'SMS', label: 'SMS Message', icon: '💬', action: 'Send SMS', url: `sms:${num}?body=${encodeURIComponent(msg)}`, detail: `To: ${num}\nMessage: ${msg}` };
  }
  if (t.toUpperCase().startsWith('WIFI:')) {
    const ssid = t.match(/S:(.*?);/i)?.[1] || 'Unknown';
    const pass = t.match(/P:(.*?);/i)?.[1] || '';
    const enc = t.match(/T:(.*?);/i)?.[1] || 'WPA';
    return { type: 'WiFi', label: 'WiFi Credentials', icon: '📶', action: 'Copy Password', copyText: pass, detail: `SSID: ${ssid}\nSecurity: ${enc}\nPassword: ${pass ? '••••••••' : 'None'}` };
  }
  if (t.startsWith('geo:') || t.includes('google.com/maps')) {
    return { type: 'Location', label: 'Map Pin Location', icon: '📍', action: 'Open Map', url: t.startsWith('geo:') ? `https://www.google.com/maps?q=${t.replace('geo:', '')}` : t };
  }
  
  return { type: 'Text', label: 'Plain Text', icon: '📝', action: 'Copy Text', copyText: t };
}

export default function ScannerTab() {
  const [scanTab, setScanTab] = useState('camera'); // 'camera' | 'file'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      if (devices.length > 0) {
        // Prefer back camera
        const back = devices.find(d => d.label.toLowerCase().includes('back'));
        setSelectedCamera(back ? back.id : devices[0].id);
      } else {
        setError('No cameras found on this device.');
      }
    } catch (err) {
      setError('Camera permission denied or unavailable.');
    }
  };

  const startCamera = async (cameraId) => {
    setError('');
    setScanResult(null);
    try {
      if (!cameraId && cameras.length === 0) {
        await getCameras();
      }
      
      const targetCameraId = cameraId || selectedCamera;
      if (!targetCameraId) return;

      if (scannerRef.current) {
        await stopCamera();
      }

      scannerRef.current = new Html5Qrcode('camera-reader-preview');
      await scannerRef.current.start(
        targetCameraId,
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.65;
            return { width: size, height: size };
          }
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
          stopCamera();
        },
        (errorMessage) => {
          // Verbose frame failures - silent
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      setError('Could not start camera feed.');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
    }
    scannerRef.current = null;
    setCameraActive(false);
  };

  const handleCameraChange = (e) => {
    const id = e.target.value;
    setSelectedCamera(id);
    if (cameraActive) {
      startCamera(id);
    }
  };

  const handleScanSuccess = (text) => {
    // Play a friendly scan success tone
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      /* Silent if AudioContext blocked */
    }
    
    setScanResult({
      text,
      parsed: parseQRContent(text),
      scannedAt: new Date().toLocaleTimeString()
    });
    setError('');

    // Save to Local History
    try {
      const hist = JSON.parse(localStorage.getItem('proqr_scan_history') || '[]');
      const newEntry = {
        text,
        scannedAt: new Date().toISOString(),
        parsedType: parseQRContent(text).type
      };
      // Keep unique items
      const filtered = hist.filter(h => h.text !== text);
      localStorage.setItem('proqr_scan_history', JSON.stringify([newEntry, ...filtered].slice(0, 50)));
    } catch (e) {
      console.error('Error writing scan history:', e);
    }
  };

  // Image Upload Scanning
  const handleFileScan = (file) => {
    if (!file) return;
    setError('');
    setScanResult(null);
    setLoading(true);

    // Create a temporary element to read the file
    const tempScanner = new Html5Qrcode('camera-reader-preview');
    tempScanner
      .scanFile(file, true)
      .then((decodedText) => {
        handleScanSuccess(decodedText);
        setLoading(false);
      })
      .catch((err) => {
        setError('No valid QR code detected in this image. Try a sharper file.');
        setLoading(false);
      });
  };

  const executeAction = (parsed) => {
    if (parsed.url) {
      window.open(parsed.url, '_blank', 'noopener,noreferrer');
    } else if (parsed.copyText) {
      navigator.clipboard.writeText(parsed.copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Sub Tabs ── */}
      <div style={{
        display: 'flex',
        background: 'rgba(30,30,46,0.04)',
        padding: 4,
        borderRadius: 12,
        border: '1px solid rgba(30,30,46,0.06)'
      }}>
        {[
          { id: 'camera', label: '📷 Scan via Camera' },
          { id: 'file', label: '🖼️ Scan from Image' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setScanTab(t.id);
              setError('');
              if (t.id === 'file') stopCamera();
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: scanTab === t.id ? '#ffffff' : 'transparent',
              color: scanTab === t.id ? '#6366f1' : '#6b7280',
              boxShadow: scanTab === t.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Scanning Main Area ── */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        
        {/* Left Panel: Scanner Feed / Upload */}
        <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {scanTab === 'camera' ? (
            /* ── Camera Scanner View ── */
            <div style={{
              position: 'relative',
              borderRadius: 18,
              background: '#0a0a1a',
              overflow: 'hidden',
              minHeight: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(99,102,241,0.18)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
            }}>
              
              {/* Target Reader Container */}
              <div 
                id="camera-reader-preview" 
                style={{ 
                  width: '100%', 
                  maxHeight: 350,
                  display: cameraActive ? 'block' : 'none'
                }} 
              />

              {/* Camera Beam Indicator */}
              {cameraActive && (
                <div style={{
                  position: 'absolute',
                  left: '10%',
                  right: '10%',
                  height: 3,
                  background: 'linear-gradient(90deg, transparent, #ec4899, #6366f1, transparent)',
                  boxShadow: '0 0 10px #6366f1',
                  animation: 'beam 2.2s infinite ease-in-out',
                  zIndex: 100,
                  pointerEvents: 'none'
                }} />
              )}

              {/* Style for beam animation */}
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes beam {
                  0%, 100% { top: 18%; }
                  50% { top: 82%; }
                }
              `}} />

              {/* Start Screen Overlay */}
              {!cameraActive && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  padding: 30,
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem'
                  }}>📷</div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'white', marginBottom: 6 }}>Webcam QR Scanner</h3>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.6 }}>
                      Align any QR code inside the camera frame.<br />Requires camera access permission.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="btn-grad"
                    style={{ padding: '12px 28px', borderRadius: 12, fontSize: '0.85rem' }}
                  >
                    ⚡ Enable Camera
                  </button>
                </div>
              )}

              {/* Stop camera floating button */}
              {cameraActive && (
                <button
                  type="button"
                  onClick={stopCamera}
                  style={{
                    position: 'absolute',
                    bottom: 16,
                    padding: '8px 16px',
                    borderRadius: 10,
                    background: 'rgba(239, 68, 68, 0.85)',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    zIndex: 120,
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  🔴 Disable Camera
                </button>
              )}
            </div>
          ) : (
            /* ── File Scan View ── */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileScan(e.dataTransfer.files[0]); }}
              onClick={() => !loading && fileInputRef.current.click()}
              style={{
                borderRadius: 18,
                border: `2px dashed ${dragOver ? '#6366f1' : 'rgba(30, 30, 46, 0.12)'}`,
                background: dragOver ? 'rgba(99, 102, 241, 0.04)' : 'rgba(255, 255, 255, 0.6)',
                padding: '52px 30px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                minHeight: 320,
                justifyContent: 'center',
                boxShadow: '0 4px 18px rgba(0,0,0,0.02)'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileScan(e.target.files[0])}
              />
              {loading ? (
                <>
                  <div className="spinner" />
                  <p style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 500 }}>Decoding image file…</p>
                </>
              ) : (
                <>
                  <div style={{
                    width: 68, height: 68, borderRadius: 16,
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.8rem'
                  }}>🖼️</div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>Decode from File</h3>
                    <p style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5 }}>
                      Drag and drop an image containing a QR code,<br />or click to browse local files.
                    </p>
                  </div>
                  <span style={{
                    padding: '8px 18px', borderRadius: 20,
                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
                    fontSize: '#0.78rem', color: '#6366f1', fontWeight: 600
                  }}>
                    Browse Files
                  </span>
                </>
              )}
            </div>
          )}

          {/* Hidden utility container required for file decoding */}
          <div id="camera-reader-preview" style={{ display: 'none' }} />

          {/* Camera Selection dropdown (only in camera tab when active/available) */}
          {scanTab === 'camera' && cameras.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>Select Camera:</span>
              <select
                value={selectedCamera}
                onChange={handleCameraChange}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 10,
                  fontSize: '0.78rem',
                  border: '1px solid rgba(30, 30, 46, 0.1)',
                  background: 'white',
                  outline: 'none',
                  color: '#4b5563'
                }}
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${cam.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Panel: Scanned Results */}
        <div style={{ flex: '1 1 350px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          
          <div style={{
            background: 'white',
            borderRadius: 18,
            border: '1px solid rgba(99,102,241,0.12)',
            padding: 24,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 320,
            boxShadow: '0 8px 24px rgba(0,0,0,0.02)'
          }}>
            
            {scanResult ? (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Result Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem'
                  }}>
                    {scanResult.parsed.icon}
                  </div>
                  <div>
                    <span style={{
                      fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: '#9ca3af', display: 'block'
                    }}>
                      Detected Format
                    </span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1f2937' }}>
                      {scanResult.parsed.label}
                    </span>
                  </div>
                </div>

                {/* Scanned Text Content */}
                <div style={{ flex: 1, marginBottom: 18 }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>
                    Scanned Content
                  </p>
                  
                  <div style={{
                    background: '#f9fafb',
                    border: '1px solid rgba(30, 30, 46, 0.06)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    color: '#374151',
                    maxHeight: 120,
                    overflowY: 'auto',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {scanResult.text}
                  </div>

                  {scanResult.parsed.detail && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>
                        Details
                      </p>
                      <p style={{ fontSize: '0.74rem', color: '#4b5563', whiteSpace: 'pre-wrap', lineHeight: 1.4, margin: 0 }}>
                        {scanResult.parsed.detail}
                      </p>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <p style={{ fontSize: '0.68rem', color: '#9ca3af', margin: '0 0 16px 0', textAlign: 'right' }}>
                  Scanned at {scanResult.scannedAt}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => executeAction(scanResult.parsed)}
                    className="btn-grad"
                    style={{
                      flex: 1.2,
                      padding: '12px',
                      borderRadius: 12,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    {scanResult.parsed.url ? (
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                      </svg>
                    )}
                    {scanResult.parsed.action}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyText(scanResult.text)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 12,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: copied ? 'rgba(74,222,128,0.08)' : 'rgba(30,30,46,0.03)',
                      border: copied ? '1px solid rgba(74,222,128,0.22)' : '1px solid rgba(30,30,46,0.08)',
                      color: copied ? '#22c55e' : '#4b5563',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.25s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4
                    }}
                  >
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 10px', color: 'rgba(30,30,46,0.38)' }}>
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 12, opacity: 0.6 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15h.008v.008H15V15zm0 3h.008v.008H15V18zm-3-3h.008v.008H12V15zm0 3h.008v.008H12V18zm-3 0h.008v.008H9V18zm0-3h.008v.008H9V15zm6-6h.008v.008H15V9zm0 3h.008v.008H15V12zm-3-3h.008v.008H12V9zm0 3h.008v.008H12V12zm-3-3h.008v.008H9V9z"/>
                </svg>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: '0 0 6px 0' }}>Scan Pending</p>
                <p style={{ fontSize: '0.72rem', lineHeight: 1.5, margin: 0 }}>
                  Start your camera or drag in an image file.<br />Decoded results will show up here.
                </p>
              </div>
            )}

            {error && (
              <p style={{
                color: '#ef4444',
                fontSize: '0.74rem',
                fontWeight: 500,
                textAlign: 'center',
                marginTop: 14,
                padding: '6px 10px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239,68,68,0.15)',
                margin: '14px 0 0 0'
              }}>
                ⚠️ {error}
              </p>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
