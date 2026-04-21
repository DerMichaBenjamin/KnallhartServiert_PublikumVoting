import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Knallhart Serviert – Release Voting',
  description: 'Jury-Voting für aktuelle Musik-Releases',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
