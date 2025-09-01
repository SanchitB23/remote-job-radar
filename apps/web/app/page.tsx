import type { Metadata } from "next";
import type { JSX } from "react";

import HeroSection from "@/components/hero-section";
import { WEB_URL } from "@/constants";

export const metadata: Metadata = {
  title: "Home | Remote Job Radar",
  description: "Discover remote jobs and opportunities with Remote Job Radar.",
};

export default function Home(): JSX.Element {
  fetch(`${WEB_URL}/api/health`)
    .then((response) => {
      console.log("Health check response:", response);
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching health check:", error, WEB_URL);
    });

  return (
    <div className="min-h-screen">
      <HeroSection />
    </div>
  );
}
