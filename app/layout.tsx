import type { Metadata } from "next";
import { Orbitron } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/components/zenith/contexts/LangContext";
import { UserProvider } from "@/components/zenith/contexts/UserContext";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-zenith" });

export const metadata: Metadata = {
  title: "Zenith — Local SEO Agency Platform",
  description: "The only local SEO tool built for how Americans actually search. Manage GBP audits, semantic optimization, and citations for all your clients.",
  keywords: "local SEO, Google Business Profile, GBP, LSA, local search, agency, Zenith",
  openGraph: {
    title: "Zenith — Local SEO Agency Platform",
    description: "AI-powered GBP audit and optimization platform for agencies.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={orbitron.variable}>
      <body style={{ margin: 0, padding: 0, background: "#050a14" }}>
        <UserProvider><LangProvider>{children}</LangProvider></UserProvider>
      </body>
    </html>
  );
}
