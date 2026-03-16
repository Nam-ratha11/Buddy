"use client";
import { useState } from 'react';

export default function RecentSubmissions({ history, onLoadSubmission, onDeleteSubmission }) {
    const [confirmDelete, setConfirmDelete] = useState(null); // stores timestamp to delete

    if (!history || history.length === 0) {
        return (
            <div className="card glass" s   tyle={{ textAlign: 'center', padding: '4rem', animation: 'fadeIn 0.5s ease' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.3 }}>HISTORY</div>
                <h2>No Submissions Yet</h2>
                <p style={{ opacity: 0.7, maxWidth: '400px', margin: '0 auto 2rem' }}>
                    Your analyzed answer sheets will appear here so you can track your progress over time.
                </p>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
            {/* Custom Confirmation Modal */}
            {confirmDelete && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 2000,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.15s ease'
                }} onClick={() => setConfirmDelete(null)}>
                    <div className="card glass" style={{
                        padding: '2rem',
                        maxWidth: '380px',
                        width: '90%',
                        textAlign: 'center',
                        animation: 'fadeIn 0.2s ease'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Delete Submission?</h3>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            This action cannot be undone. The submission will be permanently removed from your history.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="glass"
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: '30px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    background: 'transparent',
                                    color: 'var(--foreground)'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onDeleteSubmission(confirmDelete);
                                    setConfirmDelete(null);
                                }}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    border: 'none',
                                    borderRadius: '30px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    background: 'hsl(0, 80%, 55%)',
                                    color: 'white'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <h2 style={{ marginBottom: '2rem' }}>Recent Submissions</h2>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {history.map((item, index) => (
                    <div
                        key={item.id || index}
                        className="card glass"
                        style={{
                            padding: '1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'var(--transition-fast)'
                        }}
                        onClick={() => onLoadSubmission(item)}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <span style={{
                                    padding: '0.25rem 0.5rem',
                                    background: 'var(--primary-light)',
                                    color: 'var(--primary)',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700
                                }}>
                                    {item.data.studentClass || "6th CBSE"}
                                </span>
                                <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>
                                    {new Date(item.timestamp).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                Evaluation for {item.data.questions?.[0]?.subject || "Subject"}
                            </h3>
                            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                                Scored {item.data.overallScore}/{item.data.totalMarks} • {item.data.questions?.length || 0} Questions
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <button
                                className="btn-primary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLoadSubmission(item);
                                }}
                            >
                                View Report
                            </button>
                            <button
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'hsl(0, 100%, 65%)',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    padding: '0.5rem',
                                    transition: 'transform 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDelete(item.timestamp);
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                title="Delete from history"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .card:hover {
                    border-color: var(--primary);
                    transform: translateX(4px);
                }
            `}</style>
        </div>
    );
}
