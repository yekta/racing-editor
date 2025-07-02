import type { Metadata } from "next";

import "./globals.css";
import { geistMono, geistSans } from "@/components/constants";
import Providers from "@/components/providers";
import { siteDescription, siteTitle } from "@/lib/constants";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
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
