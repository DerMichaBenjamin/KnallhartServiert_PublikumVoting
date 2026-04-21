import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Release Voting",
  description: "Jury-Voting für neue Musik-Releases"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
