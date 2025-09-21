import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <>
      <main className="overflow-x-hidden">
        <section>
          <div className="py-24 md:pb-32 lg:pb-36 lg:pt-72">
            <div className="relative mx-auto flex max-w-7xl flex-col px-6 lg:block lg:px-12">
              <div className="mx-auto max-w-lg text-center lg:ml-0 lg:max-w-full lg:text-left">
                <h1 className="mt-8 max-w-2xl text-balance text-5xl md:text-6xl lg:mt-16 xl:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-chart-3 bg-clip-text text-transparent">
                  Remote Job
                  <br />
                  <span className="text-foreground">Radar</span>
                </h1>
                <p className="mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
                  Discover your perfect remote opportunity with AI-powered skill matching. Connect
                  with global companies and find work that fits your lifestyle.
                </p>

                <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-full px-8 py-6 text-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Link href="/jobs">
                      <span className="text-nowrap">Get Started Free</span>
                      <ChevronRight className="ml-1" />
                    </Link>
                  </Button>
                  <Button
                    key={2}
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full px-8 py-6 text-lg border-2 text-primary hover:bg-muted hover:text-foreground transition-all duration-300"
                  >
                    <Link href="/jobs">
                      <span className="text-nowrap">Browse All Jobs</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            <div className="aspect-2/3 absolute inset-1 -z-10 overflow-hidden rounded-3xl border border-black/10 lg:aspect-video lg:rounded-[3rem] dark:border-white/5">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="size-full object-cover opacity-50 invert dark:opacity-35 dark:invert-0 dark:lg:opacity-75"
                src="https://ik.imagekit.io/lrigu76hy/tailark/dna-video.mp4?updatedAt=1745736251477"
              />
              {/* Overlay for better text visibility */}
              <div className="absolute inset-0 bg-black/60 dark:bg-black/70" />
            </div>
            <div className="flex justify-center items-center space-x-8 text-sm text-muted-foreground mt-8">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-chart-4 rounded-full"></div>
                <span>500+ Remote Jobs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>AI-Powered Matching</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span>Global Companies</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
