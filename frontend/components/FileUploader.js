"use client";
import { useState } from 'react';

export default function FileUploader({ onFilesSelected }) {
    const [isDragging, setIsDragging] = useState(false);
    const [previews, setPreviews] = useState([]);

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
        processFiles(files);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        processFiles(files);
    };

    const processFiles = (files) => {
        const newPreviews = files.map(file => ({
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            type: file.type
        }));
        setPreviews(newPreviews);
        onFilesSelected(files);
    };

    return (
        <div
            className={`glass ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                padding: '3rem',
                textAlign: 'center',
                borderRadius: 'var(--radius)',
                border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'var(--transition-slow)',
                backgroundColor: isDragging ? 'var(--primary-light)' : 'var(--glass-bg)',
                position: 'relative'
            }}
        >
            <input
                type="file"
                multiple
                onChange={handleFileChange}
                style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer'
                }}
                accept="image/*,application/pdf"
            />

            <div style={{ marginBottom: '1.5rem' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 15V16C3 18.2091 4.79086 20 7 20H17C19.2091 20 21 18.2091 21 16V15M3 9V8C3 5.79086 4.79086 4 7 4H17C19.2091 4 21 5.79086 21 8V9" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            <h3 style={{ marginBottom: '0.5rem' }}>Upload Answer Sheets</h3>
            <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>Drag & drop PDFs or images here, or click to browse</p>

            {previews.length > 0 && (
                <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Selected Files:</p>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {previews.map((file, i) => (
                            <div key={i} className="card" style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem' }}>{file.name}</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{file.size}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
