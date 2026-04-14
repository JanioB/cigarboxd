import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import React from "react";
import "./globals.css";
import "./reset.css";
import { AppAuthProvider } from "./components/Auth/AppAuthProvider";
import { getAppUrl } from "@/lib/runtime-env";

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Cigarboxxd | Cigarette Catalog and Reviews",
  description:
    "A Letterboxd-inspired social catalog for cigarette reviews, tasting notes, moderation, and admin curation.",
  metadataBase: new URL(appUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Cigarboxxd",
    description:
      "Cigarette cataloging, reviews, moderation, and admin curation.",
    url: appUrl,
    siteName: "Cigarboxxd",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppAuthProvider>{children}</AppAuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
