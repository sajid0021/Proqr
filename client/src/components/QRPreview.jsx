import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { getQRCodeStylingOptions } from '../utils/qrHelper';

export default function QRPreview({ qrData, textOverride, loading }) {
  const containerRef = useRef(null);
  const qrCodeRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('png');
  const [showFormats, setShowFormats] = useState(false);

  // Initialize and update QR code renderer
  useEffect(() => {
    const options = getQRCodeStylingOptions(qrData, textOverride);
    
    // Always enforce canvas type in preview
    options.type = 'canvas';
    // Match container dimensions
    options.width = 240;
    options.height = 240;

    if (!qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling(options);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        qrCodeRef.current.append(containerRef.current);
      }
    } else {
      qrCodeRef.current.update(options);
    }
  }, [qrData, textOverride]);

  const handleDownload = () => {
    if (!qrCodeRef.current) return;
    
    // Request a high-resolution render when downloading
    const originalWidth = qrData.options?.width || 500;
    
    // Create temporary styled object for download to prevent UI scaling issues
    const dlOptions = getQRCodeStylingOptions(qrData, textOverride);
    dlOptions.width = originalWidth;
    dlOptions.height = originalWidth;
    dlOptions.type = downloadFormat === 'svg' ? 'svg' : 'canvas';

    const downloader = new QRCodeStyling(dlOptions);
    downloader.download({
      name: `proqr-${Date.now()}`,
      extension: downloadFormat
    });
    setShowFormats(false);
  };

  const handleCopy = async () => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          // Fallback if writing image is not supported by browser
          const dataUrl = canvas.toDataURL('image/png');
          await navigator.clipboard.writeText(dataUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Could not copy image:', err);
    }
  };

  const hasData = Boolean((textOverride || qrData.text || '').trim());

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div className="spinner" />
        <p style={{ fontSize: '0.82rem', color: '#6366f1', fontWeight: 500 }}>Generating QR Canvas…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
      
      {/* ── QR Container Card ── */}
      <div className="qr-card-container" style={{ position: 'relative' }}>
        <div 
          ref={containerRef} 
          style={{ 
            width: 240, 
            height: 240, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 14,
            padding: 8,
            background: qrData.options?.backgroundOptions?.color || '#ffffff',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            opacity: hasData ? 1 : 0.28,
            filter: hasData ? 'none' : 'grayscale(1)',
            transition: 'all 0.3s'
          }} 
        />
        
        {/* Placeholder info when QR has no content */}
        {!hasData && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 20,
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(4px)',
            borderRadius: 14,
          }}>
            <svg width="24" height="24" fill="none" stroke="#6366f1" strokeWidth="2" viewBox="0 0 24 24" style={{ marginBottom: 10 }}>
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M14 14h1m3 0h3m-3 3v3m-3-3v3"/>
            </svg>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', margin: '0 0 4px 0' }}>Enter QR Content</p>
            <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>Live preview will display automatically</p>
          </div>
        )}

        {/* Decorative scan framing corners (only when content loaded) */}
        {hasData && (
          <>
            <div style={{ position: 'absolute', width: 20, height: 20, top: -4, left: -4, borderTop: '3px solid #6366f1', borderLeft: '3px solid #6366f1', borderRadius: '4px 0 0 0' }} />
            <div style={{ position: 'absolute', width: 20, height: 20, top: -4, right: -4, borderTop: '3px solid #ec4899', borderRight: '3px solid #ec4899', borderRadius: '0 4px 0 0' }} />
            <div style={{ position: 'absolute', width: 20, height: 20, bottom: -4, left: -4, borderBottom: '3px solid #ec4899', borderLeft: '3px solid #6366f1', borderRadius: '0 0 0 4px' }} />
            <div style={{ position: 'absolute', width: 20, height: 20, bottom: -4, right: -4, borderBottom: '3px solid #6366f1', borderRight: '3px solid #ec4899', borderRadius: '0 0 4px 0' }} />
          </>
        )}
      </div>

      {hasData ? (
        <div className="fade-up" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {/* Action Row */}
          <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 280, position: 'relative' }}>
            
            {/* Download Button Group */}
            <div style={{ display: 'flex', flex: 1, borderRadius: 12, overflow: 'visible', position: 'relative' }}>
              <button
                type="button"
                onClick={handleDownload}
                className="btn-grad"
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px 0 0 12px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderRight: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Get {downloadFormat.toUpperCase()}
              </button>
              
              {/* Dropdown selector */}
              <button
                type="button"
                onClick={() => setShowFormats(!showFormats)}
                className="btn-grad"
                style={{
                  padding: '11px 12px',
                  borderRadius: '0 12px 12px 0',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ▼
              </button>

              {/* Format selection popover */}
              {showFormats && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  background: 'white',
                  border: '1px solid rgba(99,102,241,0.18)',
                  borderRadius: 10,
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.12)',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  width: 110,
                  overflow: 'hidden',
                  marginBottom: 6
                }}>
                  {['png', 'jpeg', 'svg'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => {
                        setDownloadFormat(fmt);
                        setShowFormats(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        background: downloadFormat === fmt ? 'rgba(99,102,241,0.08)' : 'transparent',
                        color: downloadFormat === fmt ? '#6366f1' : '#374151',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.78rem',
                        fontWeight: downloadFormat === fmt ? 600 : 500,
                        transition: 'background 0.2s'
                      }}
                    >
                      {fmt.toUpperCase()} Format
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '11px 16px',
                borderRadius: 12,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: copied ? 'rgba(74,222,128,0.08)' : 'rgba(30,30,46,0.03)',
                border: copied ? '1px solid rgba(74,222,128,0.22)' : '1px solid rgba(30,30,46,0.08)',
                color: copied ? '#22c55e' : '#4b5563',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.25s'
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                {copied
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                }
              </svg>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          
          <span style={{ fontSize: '0.68rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            High-DPI download ready ({qrData.options?.width || 500}px)
          </span>
        </div>
      ) : (
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <p style={{ fontSize: '0.74rem', color: '#6b7280' }}>Customize styles in the next step</p>
        </div>
      )}
    </div>
  );
}
