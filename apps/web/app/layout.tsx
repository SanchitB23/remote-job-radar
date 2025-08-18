import "./globals.css";

import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import type { JSX } from "react";
import { Toaster } from "react-hot-toast";

import JobAlerts from "@/components/jobAlertToast";
import { ReactQueryProvider } from "@/components/providers";

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
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ReactQueryProvider>
            <header className="border-b p-4">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <Link
                    href="/"
                    className="text-xl font-bold hover:text-blue-600 transition-colors"
                  >
                    Remote Job Radar
                  </Link>
                  <SignedIn>
                    <nav className="flex gap-4">
                      <Link
                        href="/jobs"
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        Jobs
                      </Link>
                      <Link
                        href="/kanban"
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        Kanban
                      </Link>
                      <Link
                        href="/status"
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        Server Status
                      </Link>
                    </nav>
                  </SignedIn>
                </div>
                <div className="flex items-center gap-4">
                  <SignedOut>
                    <SignInButton />
                    <SignUpButton />
                  </SignedOut>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                </div>
              </div>
            </header>
            <main className="max-w-7xl mx-auto p-4">{children}</main>
            <JobAlerts />
            <Toaster position="top-right" />
          </ReactQueryProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
