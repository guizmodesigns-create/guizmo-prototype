import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Guizmo Designs — AI Vehicle Wrap Studio | Charlotte, NC',
  description:
    "Charlotte's bold vehicle wrap studio. Design your wrap concept with AI in under 5 minutes — then we make it real.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
