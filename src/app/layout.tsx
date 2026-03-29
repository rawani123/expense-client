import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Expanse",
  description: "Track your expenses",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {/* Offset content for sidebar on desktop, bottom bar on mobile */}
        <div style={{ paddingLeft: "200px" }} className="main-content">
          {children}
        </div>
        <style>{`
          @media (max-width: 768px) {
            .main-content { padding-left: 0 !important; padding-bottom: 80px; }
          }
        `}</style>
      </body>
    </html>
  );
}