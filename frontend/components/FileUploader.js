"use client";
import { useState } from 'react';

export default function FileUploader({ onFilesSelected, label, id }) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

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
        setPreview({
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            type: file.type
        });
        onFilesSelected(file);
    };

    return (
        <div
            className={`glass ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                padding: '2rem',
                textAlign: 'center',
                borderRadius: 'var(--radius)',
                border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'var(--transition-slow)',
                backgroundColor: isDragging ? 'var(--primary-light)' : 'var(--glass-bg)',
                position: 'relative',
                flex: 1
            }}
        >
            <input
                type="file"
                id={id}
                onChange={handleFileChange}
                style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer'
                }}
                accept="image/*,application/pdf"
            />

            <div style={{ marginBottom: '1rem' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 15V16C3 18.2091 4.79086 20 7 20H17C19.2091 20 21 18.2091 21 16V15M3 9V8C3 5.79086 4.79086 4 7 4H17C19.2091 4 21 5.79086 21 8V9" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            <h4 style={{ marginBottom: '0.25rem' }}>{label}</h4>
            <p style={{ opacity: 0.7, fontSize: '0.8rem', marginBottom: '1rem' }}>Click or drag to upload</p>

            {preview && (
                <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                    <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.name}</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '0.5rem' }}>{preview.size}</span>
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>MATCH</span>
                    </div>
                </div>
            )}
        </div>
    );
}
