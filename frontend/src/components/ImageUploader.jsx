import React, { useState, useRef } from 'react';
import { UploadCloud, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function ImageUploader({ onImageSelected, isAnalyzing }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = (file) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageSelected(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  return (
    <div className="glass-panel" style={{ textAlign: 'center' }}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '40px 20px',
          cursor: 'pointer',
          background: dragActive ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {previewUrl ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={previewUrl}
              alt="Leaf Preview"
              style={{ maxHeight: '240px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
            />
            {isAnalyzing && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.65)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <Loader2 size={36} color="var(--primary-500)" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Evaluating Leaf Lesions (ONNX)...</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <UploadCloud size={32} color="var(--primary-500)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
              Drop Crop Leaf Photo or Tap to Browse
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 16px auto' }}>
              Supports Tomato, Potato, Apple, Corn and more. High-contrast leaf photos give optimal results.
            </p>
            <div style={{ display: 'inline-flex', gap: '8px' }}>
              <button type="button" className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                <Camera size={14} /> Open Camera
              </button>
              <button type="button" className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                <ImageIcon size={14} /> Photo Gallery
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
