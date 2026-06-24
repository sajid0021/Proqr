import React, { useState, useEffect } from 'react';
import ContentStep from './components/ContentStep';
import DesignStep from './components/DesignStep';
import QRPreview from './components/QRPreview';
import ScannerTab from './components/ScannerTab';
import AnalyticsTab from './components/AnalyticsTab';

const SIDEBAR_ITEMS = [
  { id: 'generator', label: 'QR Generator', icon: '✨' },
  { id: 'scanner', label: 'QR Scanner', icon: '📷' },
  { id: 'analytics', label: 'Scan Analytics', icon: '📊' },
  { id: 'history', label: 'My History', icon: '📜' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('generator');
  const [step, setStep] = useState(0); // Generator sub-steps
  const [serverOnline, setServerOnline] = useState(false);
  const [checkingServer, setCheckingServer] = useState(true);

  // QR Design and Content State
  const [qrData, setQrData] = useState({
    text: '',
    type: 'url',
    isDynamic: false,
    dynamicName: '',
    options: {
      width: 400,
      margin: 4,
      errorCorrectionLevel: 'Q',
      dotsOptions: {
        color: '#6366f1',
        type: 'rounded',
        gradient: {
          type: 'none',
          color1: '#6366f1',
          color2: '#ec4899',
          rotation: 0
        }
      },
      cornersSquareOptions: {
        color: '#6366f1',
        type: 'extra-rounded'
      },
      cornersDotOptions: {
        color: '#6366f1',
        type: 'dot'
      },
      backgroundOptions: {
        color: '#ffffff'
      },
      logo: {
        url: '',
        preset: 'none',
        size: 0.25,
        margin: 5,
        hideBackgroundDots: true
      }
    }
  });

  const [textOverride, setTextOverride] = useState(''); // Holds redirect URL for dynamic QR
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // History States (LocalStorage)
  const [genHistory, setGenHistory] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);

  // Check connection to Express server
  useEffect(() => {
    checkServerStatus();
    loadLocalHistory();
  }, []);

  const checkServerStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/dynamic/list');
      if (res.ok) setServerOnline(true);
    } catch {
      setServerOnline(false);
    } finally {
      setCheckingServer(false);
    }
  };

  const loadLocalHistory = () => {
    try {
      const gen = JSON.parse(localStorage.getItem('proqr_generation_history') || '[]');
      const scn = JSON.parse(localStorage.getItem('proqr_scan_history') || '[]');
      setGenHistory(gen);
      setScanHistory(scn);
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
  };

  const clearHistory = (type) => {
    try {
      if (type === 'gen') {
        localStorage.removeItem('proqr_generation_history');
        setGenHistory([]);
      } else {
        localStorage.removeItem('proqr_scan_history');
        setScanHistory([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (!qrData.text.trim()) return;
    setLoading(true);
    setError(null);
    setTextOverride('');

    // If Dynamic is checked, submit details to backend database
    if (qrData.isDynamic) {
      try {
        const res = await fetch('http://localhost:5000/api/dynamic/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUrl: qrData.text,
            type: qrData.type,
            name: qrData.dynamicName || `Campaign ${Date.now()}`,
            options: qrData.options
          })
        });
        if (!res.ok) throw new Error('Failed to save dynamic QR details');
        const data = await res.json();
        
        setTextOverride(data.redirectUrl);
        saveGenerationToHistory(data.redirectUrl, true, qrData.dynamicName);
      } catch (err) {
        setError('Server offline. Dynamic QR codes require the backend running on port 5000.');
        setLoading(false);
        return;
      }
    } else {
      // Static QR resolves completely on client side - no backend save
      saveGenerationToHistory(qrData.text, false);
    }

    setLoading(false);
  };

  const saveGenerationToHistory = (textVal, isDyn, nameVal) => {
    try {
      const hist = JSON.parse(localStorage.getItem('proqr_generation_history') || '[]');
      const newEntry = {
        text: textVal,
        type: qrData.type,
        options: qrData.options,
        isDynamic: isDyn,
        name: nameVal || `Static QR (${qrData.type.toUpperCase()})`,
        createdAt: new Date().toISOString()
      };
      const filtered = hist.filter(h => h.text !== textVal);
      const updated = [newEntry, ...filtered].slice(0, 50);
      localStorage.setItem('proqr_generation_history', JSON.stringify(updated));
      setGenHistory(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const loadFromHistory = (item) => {
    setQrData({
      text: item.text,
      type: item.type,
      isDynamic: item.isDynamic,
      dynamicName: item.name,
      options: item.options || qrData.options
    });
    if (item.isDynamic) {
      setTextOverride(item.text);
    } else {
      setTextOverride('');
    }
    setActiveTab('generator');
    setStep(1); // take them straight to design preview
  };

  const canProceed = Boolean(qrData.text.trim());

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 10% 10%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse at 90% 90%, rgba(236,72,153,0.04) 0%, transparent 60%), #f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif'
    }}>
      
      {/* ── Outer Shell ── */}
      <div style={{ display: 'flex', flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
        
        {/* ── LEFT SIDEBAR ── */}
        <aside style={{
          flex: '1 1 240px',
          maxWidth: 280,
          background: '#0a0b16',
          color: 'white',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.05)'
        }}>
          <div>
            {/* Logo Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(99,102,241,0.25)'
              }}>
                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <path d="M14 14h1m3 0h3m-3 3v3m-3-3v3"/>
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #a5b4fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                  ProQR Studio
                </h1>
                <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>v2.0 Professional</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SIDEBAR_ITEMS.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      checkServerStatus();
                      loadLocalHistory();
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.86rem',
                      fontWeight: active ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: active ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.05))' : 'transparent',
                      color: active ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                      borderLeft: active ? '3px solid #6366f1' : '3px solid transparent',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    <span style={{ fontSize: '1.15rem' }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Connection Status Footnote */}
          <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: serverOnline ? '#10b981' : '#f87171',
                boxShadow: serverOnline ? '0 0 8px #10b981' : '0 0 8px #f87171'
              }} />
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                {checkingServer ? 'Syncing status…' : serverOnline ? 'Database Connected' : 'Local Only Mode'}
              </span>
            </div>
            <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: 8, marginLine: 0 }}>
              ProQR Studio · Locally Powered
            </p>
          </div>
        </aside>

        {/* ── RIGHT CONTENT REGION ── */}
        <main style={{
          flex: '1 1 500px',
          padding: '36px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          
          {/* Active Panel Body */}
          <div className="glass-panel" style={{
            background: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(20px)',
            borderRadius: 24,
            padding: 30,
            border: '1px solid rgba(99,102,241,0.08)',
            boxShadow: '0 4px 30px rgba(0,0,0,0.01)',
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* ── TAB 1: GENERATOR ── */}
            {activeTab === 'generator' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: '0 0 4px 0' }}>QR Code Studio</h2>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Design bespoke customized dynamic and static QR codes</p>
                </div>

                <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  
                  {/* Left Generator Settings Column */}
                  <div style={{ flex: '1 1 400px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Navigation Sub-Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(99,102,241,0.08)', marginBottom: 20 }}>
                      {['1. Select Content', '2. Style Design'].map((s, i) => (
                        <button
                          key={s}
                          onClick={() => i < step + 1 && setStep(i)}
                          style={{
                            flex: 1, padding: '12px 0', fontSize: '0.8rem', fontWeight: 600,
                            background: step === i ? 'rgba(99,102,241,0.04)' : 'transparent',
                            color: step === i ? '#6366f1' : '#9ca3af',
                            border: 'none', cursor: 'pointer', position: 'relative',
                            fontFamily: 'Inter, sans-serif'
                          }}
                        >
                          {s}
                          {step === i && (
                            <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#6366f1,#ec4899)' }} />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Step Body */}
                    <div style={{ flex: 1, minHeight: 300 }}>
                      {step === 0 ? (
                        <ContentStep data={qrData} setData={setQrData} />
                      ) : (
                        <DesignStep data={qrData} setData={setQrData} />
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                      {step > 0 && (
                        <button
                          onClick={() => setStep(0)}
                          style={{
                            flex: 1, padding: '12px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600,
                            background: 'white', border: '1px solid rgba(30,30,46,0.1)', cursor: 'pointer', color: '#4b5563'
                          }}
                        >
                          ← Content
                        </button>
                      )}
                      {step === 0 ? (
                        <button
                          onClick={() => setStep(1)}
                          disabled={!canProceed}
                          className="btn-grad"
                          style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: '0.82rem' }}
                        >
                          Next: Styling Design →
                        </button>
                      ) : (
                        <button
                          onClick={handleGenerate}
                          disabled={!canProceed || loading}
                          className="btn-grad"
                          style={{ flex: 1.5, padding: '12px', borderRadius: 12, fontSize: '0.82rem' }}
                        >
                          {loading ? 'Locking config…' : '✨ Apply & Register QR'}
                        </button>
                      )}
                    </div>

                    {error && (
                      <p style={{ color: '#ef4444', fontSize: '0.74rem', textAlign: 'center', marginTop: 12 }}>
                        ⚠️ {error}
                      </p>
                    )}
                  </div>

                  {/* Right Live Preview Column */}
                  <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span className="label-xs" style={{ alignSelf: 'flex-start', marginBottom: 12 }}>Live Canvas Renderer</span>
                    
                    <div style={{
                      background: 'white',
                      border: '1px solid rgba(99,102,241,0.12)',
                      borderRadius: 20,
                      padding: 24,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.02)'
                    }}>
                      <QRPreview qrData={qrData} textOverride={textOverride} loading={loading} />
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ── TAB 2: SCANNER ── */}
            {activeTab === 'scanner' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: '0 0 4px 0' }}>QR Reader Decoder</h2>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Scan QR codes using camera stream or local picture upload</p>
                </div>
                <ScannerTab />
              </div>
            )}

            {/* ── TAB 3: ANALYTICS ── */}
            {activeTab === 'analytics' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: '0 0 4px 0' }}>Scan Analytics Dashboard</h2>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>View counts, device logs, and update redirects of active dynamic codes</p>
                </div>
                <AnalyticsTab />
              </div>
            )}

            {/* ── TAB 4: MY HISTORY ── */}
            {activeTab === 'history' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: '0 0 4px 0' }}>Activity Logs History</h2>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Re-edit your generated QR codes or review scan decodes logs</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                  
                  {/* Generated History List */}
                  <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 20, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span className="label-xs">Generated QR Codes ({genHistory.length})</span>
                      {genHistory.length > 0 && (
                        <button onClick={() => clearHistory('gen')} style={{ border: 'none', background: 'transparent', color: '#f87171', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}>
                          Clear All
                        </button>
                      )}
                    </div>

                    {genHistory.length === 0 ? (
                      <p style={{ padding: '24px 0', fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center', margin: 0 }}>No generation logs recorded</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '50vh', overflowY: 'auto', paddingRight: 4 }}>
                        {genHistory.map((item, idx) => (
                          <div key={idx} style={{
                            padding: 12, borderRadius: 12, border: '1px solid rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10
                          }}>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.name || 'Static QR'} {item.isDynamic && <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '1px 5px', borderRadius: 4, marginLeft: 4 }}>DYNAMIC</span>}
                              </p>
                              <p style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#9ca3af', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.text}
                              </p>
                              <span style={{ fontSize: '0.58rem', color: '#d1d5db' }}>{new Date(item.createdAt).toLocaleString()}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => loadFromHistory(item)}
                              style={{
                                padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.35)', background: 'white',
                                color: '#6366f1', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0
                              }}
                            >
                              Load
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Scanned History List */}
                  <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 20, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span className="label-xs">Decoded Scan Logs ({scanHistory.length})</span>
                      {scanHistory.length > 0 && (
                        <button onClick={() => clearHistory('scan')} style={{ border: 'none', background: 'transparent', color: '#f87171', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}>
                          Clear All
                        </button>
                      )}
                    </div>

                    {scanHistory.length === 0 ? (
                      <p style={{ padding: '24px 0', fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center', margin: 0 }}>No scan logs recorded</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '50vh', overflowY: 'auto', paddingRight: 4 }}>
                        {scanHistory.map((item, idx) => (
                          <div key={idx} style={{
                            padding: 12, borderRadius: 12, border: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 4
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.62rem', fontWeight: 700, background: 'rgba(0,0,0,0.05)', color: '#4b5563', padding: '2px 6px', borderRadius: 4 }}>
                                {item.parsedType || 'TEXT'}
                              </span>
                              <span style={{ fontSize: '0.58rem', color: '#9ca3af' }}>{new Date(item.scannedAt).toLocaleTimeString()}</span>
                            </div>
                            <p style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#4b5563', margin: 0, wordBreak: 'break-all' }}>
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>

        </main>

      </div>
      
    </div>
  );
}
