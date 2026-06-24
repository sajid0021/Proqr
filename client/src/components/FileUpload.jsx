import React, { useState, useRef } from 'react';

const FORMAT_SIZE = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FileUpload({ accept, label, icon, hint, onUpload, value, filename }) {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [dragOver,  setDragOver]  = useState(false);
  const [error,     setError]     = useState(null);
  const [fileSize,  setFileSize]  = useState(null);
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(0);
    setFileSize(file.size);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // XHR for progress tracking
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            onUpload(data.url, file.name);
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('POST', 'http://localhost:5000/api/upload');
        xhr.send(formData);
      });
    } catch (e) {
      setError('Upload failed. Make sure the server is running on port 5000.');
    } finally {
      setUploading(false);
    }
  };

  const dropZoneStyle = {
    border: `2px dashed ${
      dragOver  ? 'rgba(99,102,241,0.7)' :
      value     ? 'rgba(74,222,128,0.45)' :
      error     ? 'rgba(248,113,113,0.4)' :
                  'rgba(255,255,255,0.12)'
    }`,
    borderRadius: 18,
    padding: '32px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    background: dragOver  ? 'rgba(99,102,241,0.08)' :
                value     ? 'rgba(74,222,128,0.05)'  :
                            'rgba(255,255,255,0.025)',
    transition: 'all 0.25s',
    userSelect: 'none',
  };

  return (
    <div>
      <div
        style={dropZoneStyle}
        onClick={() => !uploading && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
      >
        {uploading ? (
          /* ── Uploading ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: '2.5rem' }}>{icon}</div>
            <div style={{ width: '80%' }}>
              <div style={{
                height: 4, borderRadius: 10,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 10,
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #6366f1, #ec4899)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
                Uploading… {progress}%
              </p>
            </div>
          </div>
        ) : value ? (
          /* ── Uploaded ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(74,222,128,0.12)',
              border: '1px solid rgba(74,222,128,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
            }}>✅</div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#4ade80', marginBottom: 3 }}>
                {filename || 'File uploaded!'}
              </p>
              {fileSize && (
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
                  {FORMAT_SIZE(fileSize)}
                </p>
              )}
            </div>
            <span style={{
              fontSize: '0.72rem', padding: '4px 12px', borderRadius: 20,
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
              color: '#a5b4fc',
            }}>
              Click to replace
            </span>
          </div>
        ) : (
          /* ── Empty ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem',
            }}>{icon}</div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                Upload {label}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>
                {hint || 'Drag & drop or click to browse'}
              </p>
            </div>
            <div style={{
              padding: '7px 20px', borderRadius: 20,
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              fontSize: '0.78rem', color: '#a5b4fc',
              fontWeight: 500,
            }}>
              Browse Files
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {error && (
        <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: 8, paddingLeft: 4 }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
