import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://columnist.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Columnist — Ebooks for a Wiser You",
    template: "%s · Columnist",
  },
  description:
    "Columnist is a premium digital library of carefully curated eBooks for thinkers, dreamers, learners and curious minds.",
  openGraph: {
    type: "website",
    siteName: "Columnist",
    title: "Columnist — Ebooks for a Wiser You",
    description:
      "Carefully curated eBooks for thinkers, dreamers, learners and curious minds.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-ink font-sans text-cream">
        <ToastProvider>
          <Header />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
