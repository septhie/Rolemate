import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
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
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <div className="app-shell">
          <div className="pointer-events-none fixed inset-5 z-20 rounded-[28px] border-2 border-[#d4a85c]/20 shadow-[0_0_40px_rgba(212,168,92,0.12)]" />
          <div className="fine-grid" />
          <SiteHeader />
          <div className="min-h-screen pl-[92px]">{children}</div>
        </div>
      </body>
    </html>
  );
}
