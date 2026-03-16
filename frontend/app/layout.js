import "./globals.css";

export const metadata = {
  title: "Sprout AI | Feedback & Improvement Coach",
  description: "Transform corrected answer sheets into personalized learning journeys.",
  manifest: "/manifest.json",
  themeColor: "#00b4ff",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sprout AI",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
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
