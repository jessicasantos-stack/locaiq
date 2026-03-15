import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Locaiq — Local SEO Agency Platform",
  description: "The only local SEO tool that stops human error before it happens. Manage GBP, LSA, and Citations for all your clients.",
  keywords: "local SEO, Google Business Profile, GBP, LSA, local search, agency",
  openGraph: {
    title: "Locaiq — Local SEO Agency Platform",
    description: "Validate, monitor and sync your clients' data across GBP, LSA and directories.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#050a14" }}>
        {children}
      </body>
    </html>
  );
}
