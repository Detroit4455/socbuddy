import { Inter } from "next/font/google";
import "./globals.css";
import PageTracker from "./components/PageTracker";
import SessionProvider from "@/providers/SessionProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "SocBuddy",
  description: "A collection of useful web tools including Base64 encoder/decoder, URL redirect grabber, and more",
  icons: {
    icon: [
      { url: '/ICON.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' }  // Fallback for browsers that don't support SVG
    ],
    shortcut: '/ICON.svg',
    apple: '/ICON.svg',
    other: {
      rel: 'apple-touch-icon',
      url: '/ICON.svg',
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/ICON.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />  {/* Fallback */}
        <link rel="apple-touch-icon" href="/ICON.svg" />  {/* For iOS devices */}
      </head>
      <body className={`${inter.variable} antialiased`}>
        <PageTracker />
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
