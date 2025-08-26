import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DAHLIA Listings Lister",
  description: "Browse available housing units on housing.sfgov.org",
  icons: {
    apple: [
      { url: "https://housing.sfgov.org/assets/apple-icon-57x57-eef66c96a8981b32eb57f2b255039e266b19a4216e394836ae6a2fe5cffa9c41.png", sizes: "57x57", type: "image/png" },
      { url: "https://housing.sfgov.org/assets/apple-icon-60x60-49705a0212e718476a8c7ccd873675d5f6ebf7ac4d63ab1754341d4130c7cc57.png", sizes: "60x60", type: "image/png" },
      { url: "https://housing.sfgov.org/assets/apple-icon-72x72-706996c7ff6ffba3ee09f4eb27dacb1a4e1855c031cc48fe11219d662a94dba4.png", sizes: "72x72", type: "image/png" },
      { url: "https://housing.sfgov.org/assets/apple-icon-76x76-061af0c95cdf9071a9942bded1be7b680e70ce7722dd406a1389809453de3483.png", sizes: "76x76", type: "image/png" },
      { url: "https://housing.sfgov.org/assets/apple-icon-114x114-82ff4db1d77f3aab5eca24f37d050f67bf3305e6cd8050ce7e5d6bd8b7fe07fb.png", sizes: "114x114", type: "image/png" },
      { url: "https://housing.sfgov.org/assets/apple-icon-120x120-cdfb924084699589e69f2c9829737dc4b82242bd0b170a616529f5394e9895ea.png", sizes: "120x120", type: "image/png" },
      { url: "https://housing.sfgov.org/assets/apple-icon-144x144-33fbd3b27a33b0d15d71b1a90dfc50d82518f643dbf79d0cdd27d7579eba703d.png", sizes: "144x144", type: "image/png" },
      { url: "https://housing.sfgov.org/assets/apple-icon-152x152-dd4a30f6370f2fc39a2e0ee0012e81c9b746276ed3f0079e91a51baa0a347272.png", sizes: "152x152", type: "image/png" },
      { url: "https://housing.sfgov.org/assets/apple-icon-180x180-81c3e0bc9c8324c1a8ea6be1b616bb081fbee977fbae19dc66f7462c1bacbab9.png", sizes: "180x180", type: "image/png" },
    ],
    icon: [
      { url: "https://housing.sfgov.org/assets/android-icon-192x192-5c3bdc0fedcc3fd6d393735077f40f8912bea5c328ce69c99221ea63c456de33.png", sizes: "192x192", type: "image/png" },
      { url: "https://housing.sfgov.org/assets/favicon-32x32-c7697ffee1e31d810b8063feaf8c67c7b2c906b489f13fabf69d59a386a9c9d0.png", sizes: "32x32", type: "image/png" },
      { url: "https://housing.sfgov.org/assets/favicon-96x96-a0efa58fa4aecb817d51b35dad3b9ee0b60dbf4a9c6e63aeade28fcd68279181.png", sizes: "96x96", type: "image/png" },
      { url: "https://housing.sfgov.org/assets/favicon-16x16-8de0f549bfb4909109b447a121b278e98dea91c11eab9d3491f470db91e26cb9.png", sizes: "16x16", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
