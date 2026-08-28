import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-code-face",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Clyde | Practical Cloud, Support, and Web Systems",
  description: "Portfolio for Clyde, a practical cloud, infrastructure, support, and web systems professional focused on reliable solutions for real operations.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#111315",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
