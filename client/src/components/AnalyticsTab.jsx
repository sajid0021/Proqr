import React, { useState, useEffect } from 'react';

export default function AnalyticsTab() {
  const [qrs, setQrs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [editingUrl, setEditingUrl] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQRList();
  }, []);

  const fetchQRList = async () => {
    setLoadingList(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/dynamic/list');
      if (!res.ok) throw new Error('Could not fetch list');
      const data = await res.json();
      setQrs(data);
    } catch (err) {
      setError('Could not reach backend. Verify server is running on port 5000.');
    } finally {
      setLoadingList(false);
    }
  };

  const selectQR = async (id) => {
    setSelectedId(id);
    setLoadingAnalytics(true);
    setEditMode(false);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/dynamic/${id}/analytics`);
      if (!res.ok) throw new Error('Could not fetch analytics');
      const data = await res.json();
      setAnalytics(data);
      setEditingUrl(data.qr.targetUrl);
    } catch (err) {
      setError('Could not load analytics details.');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleUpdateUrl = async (e) => {
    e.preventDefault();
    if (!editingUrl.trim()) return;
    setSaveLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/dynamic/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: editingUrl })
      });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      
      // Update local state
      setAnalytics((prev) => ({
        ...prev,
        qr: {
          ...prev.qr,
          targetUrl: data.targetUrl
        }
      }));
      setQrs((prev) => prev.map(q => q.id === selectedId ? { ...q, targetUrl: data.targetUrl } : q));
      setEditMode(false);
    } catch (err) {
      setError('Failed to update destination link.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteQR = async () => {
    if (!window.confirm('Are you sure you want to delete this dynamic QR code and all its scan logs?')) return;
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/dynamic/${selectedId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');
      
      // Remove from states
      setQrs((prev) => prev.filter(q => q.id !== selectedId));
      setSelectedId(null);
      setAnalytics(null);
    } catch (err) {
      setError('Failed to delete QR code.');
    }
  };

  // Helper to draw clean SVG charts
  const renderTimelineChart = (timeline) => {
    const dates = Object.keys(timeline).sort();
    if (dates.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: '#9ca3af', fontSize: '0.78rem' }}>
          No scans recorded yet. Share your code to gather timeline data!
        </div>
      );
    }

    // Keep last 7 days of scan dates
    const displayDates = dates.slice(-7);
    const counts = displayDates.map(d => timeline[d]);
    const maxVal = Math.max(...counts, 5); // scale height base

    const width = 380;
    const height = 140;
    const padding = 20;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    const barWidth = Math.floor(chartWidth / displayDates.length) - 12;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={140}>
        {/* Draw horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
          <line
            key={idx}
            x1={padding}
            y1={padding + ratio * chartHeight}
            x2={width - padding}
            y2={padding + ratio * chartHeight}
            stroke="rgba(0,0,0,0.04)"
            strokeWidth="1"
          />
        ))}

        {/* Draw bars */}
        {displayDates.map((date, idx) => {
          const count = timeline[date];
          const barHeight = (count / maxVal) * chartHeight;
          const x = padding + idx * (chartWidth / displayDates.length) + 6;
          const y = height - padding - barHeight;

          // Format Date Label (MM-DD)
          const dateLabel = date.substring(5);

          return (
            <g key={date}>
              {/* Animated Gradient Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill="url(#bar-gradient)"
                style={{ transition: 'all 0.5s' }}
              />
              {/* Scan Count Value */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="0.68rem"
                fontWeight="700"
                fill="#6366f1"
              >
                {count}
              </text>
              {/* Date Label */}
              <text
                x={x + barWidth / 2}
                y={height - padding + 14}
                textAnchor="middle"
                fontSize="0.6rem"
                fontWeight="600"
                fill="#9ca3af"
              >
                {dateLabel}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // Render horizontal progress bars for categories
  const renderBreakdownBars = (dataMap) => {
    const entries = Object.entries(dataMap || {});
    if (entries.length === 0) {
      return <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>No logs recorded</p>;
    }

    const total = entries.reduce((acc, [_, count]) => acc + count, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entries.sort((a,b) => b[1] - a[1]).map(([key, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 600, color: '#4b5563', marginBottom: 3 }}>
                <span>{key}</span>
                <span>{count} ({pct}%)</span>
              </div>
              <div style={{ height: 6, borderRadius: 10, background: 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: 10,
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loadingList && qrs.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
        <div className="spinner" />
        <p style={{ marginTop: 16, fontSize: '0.85rem', color: '#6b7280' }}>Loading dynamic codes list…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.78rem' }}>
          ⚠️ {error}
        </div>
      )}

      {qrs.length === 0 ? (
        /* ── Empty State ── */
        <div style={{
          textAlign: 'center',
          padding: '52px 20px',
          background: 'white',
          borderRadius: 20,
          border: '1px solid rgba(99,102,241,0.12)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.01)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>📊</div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1f2937', marginBottom: 6 }}>No Dynamic QR Codes Found</h3>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', maxWidth: 380, margin: '0 auto 16px auto', lineHeight: 1.5 }}>
            Dynamic QR codes support scan analytics and let you modify redirect links anytime without changing the QR image!
          </p>
          <p style={{ fontSize: '0.74rem', color: '#a5b4fc', fontWeight: 600 }}>
            Go to the "Content" tab and enable "Dynamic QR Code" to create one.
          </p>
        </div>
      ) : (
        /* ── Split Panel Dashboard ── */
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          
          {/* Left panel: List of codes */}
          <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="label-xs">Active Dynamic Codes ({qrs.length})</span>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: '70vh',
              overflowY: 'auto',
              paddingRight: 6
            }}>
              {qrs.map((q) => {
                const isSelected = selectedId === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => selectQR(q.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      padding: '12px 14px',
                      borderRadius: 14,
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(30,30,46,0.06)',
                      background: isSelected ? 'rgba(99,102,241,0.06)' : 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? '#6366f1' : '#1f2937', wordBreak: 'break-all' }}>
                        {q.name}
                      </span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, fontFamily: 'monospace', padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.05)', color: '#4b5563' }}>
                        {q.id}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', width: '100%' }}>
                      → {q.targetUrl}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>
                      Created: {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Details Dashboard */}
          <div style={{ flex: '2 2 460px', minWidth: 0 }}>
            {loadingAnalytics ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 320, background: 'white', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="spinner" />
                <p style={{ marginTop: 12, fontSize: '0.78rem', color: '#6b7280' }}>Loading charts and analytics data…</p>
              </div>
            ) : analytics ? (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* ── Info Card (Edit Target) ── */}
                <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid rgba(99,102,241,0.12)', boxShadow: '0 4px 16px rgba(0,0,0,0.01)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', margin: '0 0 4px 0' }}>{analytics.qr.name}</h3>
                      <p style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#9ca3af', margin: 0 }}>
                        Redirection Link: <a href={analytics.qr.redirectUrl} target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none' }}>{analytics.qr.redirectUrl}</a>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDeleteQR}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: '#ef4444',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      Delete QR
                    </button>
                  </div>

                  {/* Target link editor */}
                  <div style={{ background: '#f9fafb', borderRadius: 12, padding: 12, border: '1px solid rgba(0,0,0,0.03)' }}>
                    {editMode ? (
                      <form onSubmit={handleUpdateUrl} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input
                          type="url"
                          required
                          value={editingUrl}
                          onChange={(e) => setEditingUrl(e.target.value)}
                          className="p-input"
                          style={{ flex: 1, padding: '8px 12px', minWidth: 200, borderRadius: 10, background: 'white' }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="submit"
                            disabled={saveLoading}
                            style={{
                              padding: '8px 14px', borderRadius: 10, border: 'none', background: '#6366f1', color: 'white',
                              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            {saveLoading ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUrl(analytics.qr.targetUrl);
                              setEditMode(false);
                            }}
                            style={{
                              padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(30,30,46,0.1)', background: 'white',
                              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', color: '#4b5563'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 10 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', display: 'block' }}>Destination Link</span>
                          <span style={{ fontSize: '0.8rem', color: '#4b5563', wordBreak: 'break-all' }}>{analytics.qr.targetUrl}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditMode(true)}
                          style={{
                            padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)', background: 'white',
                            color: '#6366f1', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
                          }}
                        >
                          ✏️ Edit Destination
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Main Metrics Grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  
                  {/* Total Scan Count Widget */}
                  <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid rgba(99,102,241,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.01)' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Scans</span>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, background: 'linear-gradient(135deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '6px 0', textShadow: '0 2px 10px rgba(99,102,241,0.15)' }}>
                      {analytics.totalScans}
                    </h2>
                    <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'ping 1.2s infinite' }} />
                      Tracking live redirects
                    </span>
                    <style dangerouslySetInnerHTML={{__html: `
                      @keyframes ping {
                        0% { transform: scale(1); opacity: 1; }
                        100% { transform: scale(2.2); opacity: 0; }
                      }
                    `}} />
                  </div>

                  {/* Device Breakdown Widget */}
                  <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid rgba(99,102,241,0.12)', boxShadow: '0 4px 16px rgba(0,0,0,0.01)' }}>
                    <p className="label-xs" style={{ marginBottom: 12 }}>Device Types</p>
                    {renderBreakdownBars(analytics.deviceBreakdown)}
                  </div>
                </div>

                {/* ── Timeline Chart Widget ── */}
                <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.01)' }}>
                  <p className="label-xs" style={{ marginBottom: 12 }}>Timeline (Last 7 Active Days)</p>
                  {renderTimelineChart(analytics.timeline)}
                </div>

                {/* ── Browser & OS breakdown row ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid rgba(0,0,0,0.06)' }}>
                    <p className="label-xs" style={{ marginBottom: 12 }}>Browsers</p>
                    {renderBreakdownBars(analytics.browserBreakdown)}
                  </div>
                  <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid rgba(0,0,0,0.06)' }}>
                    <p className="label-xs" style={{ marginBottom: 12 }}>Operating Systems</p>
                    {renderBreakdownBars(analytics.osBreakdown)}
                  </div>
                </div>

                {/* ── Scan Log Table ── */}
                <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <p className="label-xs" style={{ marginBottom: 12 }}>Recent Scan Activities (Last 15)</p>
                  
                  {analytics.recentScans.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, textAlign: 'center', padding: '16px 0' }}>No scans recorded yet</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', minWidth: 420 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', color: '#9ca3af', textAlign: 'left' }}>
                            <th style={{ padding: '6px 4px', fontWeight: 600 }}>Time</th>
                            <th style={{ padding: '6px 4px', fontWeight: 600 }}>IP Address</th>
                            <th style={{ padding: '6px 4px', fontWeight: 600 }}>Device</th>
                            <th style={{ padding: '6px 4px', fontWeight: 600 }}>Browser</th>
                            <th style={{ padding: '6px 4px', fontWeight: 600 }}>OS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.recentScans.map((scan, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)', color: '#4b5563' }}>
                              <td style={{ padding: '8px 4px', fontWeight: 500 }}>{new Date(scan.timestamp).toLocaleString()}</td>
                              <td style={{ padding: '8px 4px', fontFamily: 'monospace' }}>{scan.ip}</td>
                              <td style={{ padding: '8px 4px' }}>{scan.device}</td>
                              <td style={{ padding: '8px 4px' }}>{scan.browser}</td>
                              <td style={{ padding: '8px 4px' }}>{scan.os}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* ── Select Code Placeholder ── */
              <div style={{
                height: '100%',
                minHeight: 320,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 30,
                background: 'white',
                border: '1px dashed rgba(30,30,46,0.12)',
                borderRadius: 20
              }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>📈</div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>Select a Dynamic Code</h3>
                <p style={{ fontSize: '0.78rem', color: '#6b7280', maxWidth: 280, margin: 0, lineHeight: 1.5 }}>
                  Click on any dynamic QR code from the list on the left to load charts and redirection logs.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
