import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { JSX } from "react";
import { Toaster } from "react-hot-toast";

import { ClerkProvider } from "@/components/clerk-provider";
import { Header } from "@/components/header";
import JobAlerts from "@/components/jobAlertToast";
import { ReactQueryProvider } from "@/components/ReactQueryProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CLERK_PUBLISHABLE_KEY } from "@/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Remote Job Radar",
  description: "Find remote jobs that match your skills",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{
        cssLayerName: "clerk",
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ReactQueryProvider>
              <Header />
              <main className="max-w-7xl mx-auto p-4">{children}</main>
              <JobAlerts />
              <Toaster position="top-right" />
            </ReactQueryProvider>
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
