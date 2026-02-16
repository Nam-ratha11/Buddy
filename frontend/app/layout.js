import "./globals.css";

export const metadata = {
  title: "Sprout AI | Feedback & Improvement Coach",
  description: "Transform corrected answer sheets into personalized learning journeys.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="glass" style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, cursor: 'pointer' }}>
            <span style={{ color: 'var(--primary)' }}>Sprout</span>
            <span style={{ color: 'var(--foreground)' }}>AI</span>
          </div>
          <button className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
            Login
          </button>
        </nav>
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <footer style={{
          padding: '2rem',
          textAlign: 'center',
          borderTop: '1px solid var(--border)',
          marginTop: '4rem',
          color: 'var(--foreground)',
          opacity: 0.7,
          fontSize: '0.9rem'
        }}>
          © 2026 Sprout AI Feedback & Improvement Coach. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
