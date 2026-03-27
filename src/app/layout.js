import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: "Rolemate",
  description: "An honest-first AI career assistant for resume tailoring without fabricated experience."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <Analytics />
      </body>
    </html>
  );
}

