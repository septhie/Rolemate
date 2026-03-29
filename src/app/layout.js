import "./globals.css";
import { Inter } from "next/font/google";
import FreeCreditsBar from "@/components/FreeCreditsBar";
import SiteHeader from "@/components/SiteHeader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata = {
  title: "Rolemate",
  description: "An honest-first AI career assistant for resume tailoring without fabricated experience."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <div className="app-shell">
          <div className="fine-grid" />
          <FreeCreditsBar />
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
