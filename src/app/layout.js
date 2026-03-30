import "./globals.css";
import { JetBrains_Mono, Playfair_Display } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import { SpeedInsights } from "@vercel/speed-insights/next";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair"
});

export const metadata = {
  title: "Rolemate",
  description: "An honest-first AI career assistant for resume tailoring without fabricated experience."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${mono.variable} ${playfair.variable} font-mono`}>
        <div className="app-shell min-h-screen w-full">
          <div className="noise-overlay" />
          <div className="orb orb-left" />
          <div className="orb orb-right" />
          <SiteHeader />
          {children}
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}
