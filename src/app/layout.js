import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import UpdateBanner from "@/components/UpdateBanner";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://archiveofmeme.fun"),
  title: "Archive of Meme - The Digital Museum of Memes",
  description: "The definitive digital museum of memes. A new iconic meme preserved as NFT every day. Own a piece of internet history.",
  keywords: ["memes", "NFT", "digital art", "internet culture", "collectibles", "OpenSea"],
  authors: [{ name: "Archive of Meme" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Archive of Meme",
  },
  openGraph: {
    title: "Archive of Meme - The Digital Museum of Memes",
    description: "The definitive digital museum of memes. A new iconic meme preserved as NFT every day.",
    url: "https://archiveofmeme.fun",
    siteName: "Archive of Meme",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Archive of Meme",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Archive of Meme - The Digital Museum of Memes",
    description: "The definitive digital museum of memes. A new iconic meme preserved as NFT every day.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a]`}
      >
        <Providers>
          <ServiceWorkerRegister />
          <UpdateBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
