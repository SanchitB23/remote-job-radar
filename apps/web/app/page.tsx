import type { Metadata } from "next";
import type { JSX } from "react";

import HeroSection from "@/components/hero-section";
import { getServicesStatusApi } from "@/services/api-client";

export const metadata: Metadata = {
  title: "Home | Remote Job Radar",
  description: "Discover remote jobs and opportunities with Remote Job Radar.",
};

export default function Home(): JSX.Element {
  getServicesStatusApi()
    .then((status) => {
      console.log("Services status:", status);
    })
    .catch((error) => {
      console.error("Error fetching services status:", error);
    });

  return (
    <div className="min-h-screen">
      <HeroSection />
    </div>
  );
}
