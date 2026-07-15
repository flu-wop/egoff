import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EGOFF Essentials | Luxury Natural Handcrafted Soap",
  description:
    "EGOFF Essentials — luxury handcrafted natural soaps by Ericka A. Goff. Rooted in Jamaican heritage, born in New Orleans.",
  keywords: [
    "EGOFF Essentials",
    "natural handmade soap",
    "Jamaican soap",
    "New Orleans soap",
    "luxury natural soap",
    "Ericka Goff",
    "Alma's Grace",
    "Jamaican Ruby",
  ],
  openGraph: {
    title: "EGOFF Essentials | Luxury Natural Handcrafted Soap",
    description:
      "Handcrafted soaps rooted in Jamaican heritage and New Orleans love. Essentially Rooted.",
    type: "website",
    url: "https://egoff.vercel.app",
    images: ["https://egoff.vercel.app/egoff-new-logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Lato:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
