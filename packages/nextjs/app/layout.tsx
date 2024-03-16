import { IBM_Plex_Mono } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import { Metadata } from "next";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import "~~/styles/globals.css";

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : `http://localhost:${process.env.PORT}`;
const imageUrl = `${baseUrl}/thumbnail.jpg`;

const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["100", "200"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Lightning <> Botanix",
    template: "%s | Lightning <> Botanix",
  },
  description: "Lightning <> Botanix",
  openGraph: {
    title: {
      default: "Lightning <> Botanix",
      template: "%s | Lightning <> Botanix",
    },
    description: "Lightning <> Botanix",
    images: [
      {
        url: imageUrl,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [imageUrl],
    title: {
      default: "Lightning <> Botanix",
      template: "%s | Lightning <> Botanix",
    },
    description: "Lightning <> Botanix",
  },
  icons: {
    icon: [{ url: "/logo.svg", sizes: "32x32", type: "image/psvg" }],
  },
};

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html className={ibmPlexMono.className}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />

      <body>
        <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
