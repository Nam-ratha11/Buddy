"use client";
import { useState } from 'react';

const T = {
  green: '#1E3A8A', gMid: '#2563EB', gLight: '#EFF6FF', gRing: '#BFDBFE',
  cardBg: '#FFFFFF', zoneBg: '#F1F5F9', ink: '#0F172A', sub: '#475569',
  hint: '#94A3B8', line: '#E2E8F0',
};

export default function FileUploader({ onFilesSelected, label, id }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processFile(files[0]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) processFile(files[0]);
  };

  const processFile = (file) => {
    setPreview({ name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB', type: file.type });
    onFilesSelected(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        padding: '2rem', textAlign: 'center', borderRadius: 16, flex: 1,
        border: `2px dashed ${isDragging ? T.gMid : T.line}`,
        background: isDragging ? T.gLight : T.zoneBg,
        cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative',
      }}
    >
      <input
        type="file" id={id} onChange={handleFileChange}
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
        accept="image/*,application/pdf"
      />
      <div style={{ marginBottom: '1rem' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke={T.gMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 15V16C3 18.2091 4.79086 20 7 20H17C19.2091 20 21 18.2091 21 16V15M3 9V8C3 5.79086 4.79086 4 7 4H17C19.2091 4 21 5.79086 21 8V9" stroke={T.gMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: T.ink, marginBottom: 4 }}>{label}</h4>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.hint, marginBottom: '1rem' }}>Click or drag to upload</p>

      {preview && (
        <div style={{ marginTop: '1rem', textAlign: 'left' }}>
          <div style={{
            padding: '8px 14px', borderRadius: 10, background: T.cardBg,
            border: `1px solid ${T.gRing}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.name}</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.hint, flexShrink: 0 }}>{preview.size}</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: T.green, flexShrink: 0 }}>MATCH</span>
          </div>
        </div>
      )}
    </div>
  );
}
