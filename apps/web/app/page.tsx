import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import type { JSX } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home(): JSX.Element {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/50 to-muted py-20">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,black,rgba(0,0,0,0.6))] -z-10" />
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
            🚀 Now with AI-Powered Job Matching
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-chart-3 bg-clip-text text-transparent leading-tight">
            Remote Job
            <br />
            <span className="text-foreground">Radar</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Discover your perfect remote opportunity with AI-powered skill matching. Connect with
            global companies and find work that fits your lifestyle.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <SignedOut>
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Get Started Free
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Button
                asChild
                size="lg"
                className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/jobs">View Your Matches</Link>
              </Button>
            </SignedIn>

            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 h-auto border-2 hover:bg-muted transition-all duration-300"
            >
              <Link href="/jobs">Browse All Jobs</Link>
            </Button>
          </div>

          <div className="flex justify-center items-center space-x-8 text-sm text-muted-foreground">
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

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose Remote Job Radar?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We combine cutting-edge AI technology with human expertise to deliver the best remote
              job opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary/5 to-chart-3/5">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-xl text-foreground">AI-Powered Matching</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">
                  Our intelligent algorithm analyzes job requirements against your skills,
                  experience, and preferences to find the perfect matches. Get personalized
                  recommendations that actually fit.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-secondary/5 to-chart-1/5">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-secondary to-secondary/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-xl text-foreground">Remote-First Focus</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">
                  We specialize exclusively in remote and distributed work opportunities. Connect
                  with companies worldwide that understand and embrace the future of work.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-chart-4/5 to-chart-4/10">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-chart-4 to-chart-4/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-xl text-foreground">Real-Time Updates</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">
                  Never miss an opportunity with real-time job alerts and updates. We monitor
                  multiple platforms and notify you as soon as relevant positions become available.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in just three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Create Your Profile</h3>
              <p className="text-muted-foreground">
                Sign up and build your professional profile with skills, experience, and
                preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Get AI Matches</h3>
              <p className="text-muted-foreground">
                Our AI analyzes thousands of jobs and finds the best matches for your profile.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-chart-4 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Apply & Connect</h3>
              <p className="text-muted-foreground">
                Apply to your matches and connect with companies that align with your goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Remote Jobs Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">50+</div>
              <div className="text-muted-foreground">Global Companies</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-chart-4 mb-2">95%</div>
              <div className="text-muted-foreground">Match Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-chart-3 mb-2">24/7</div>
              <div className="text-muted-foreground">Job Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Find Your Dream Remote Job?
          </h2>
          <p className="text-xl text-primary-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have already discovered their perfect remote
            opportunity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignedOut>
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 h-auto bg-white text-primary hover:bg-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start Your Journey
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Button
                asChild
                size="lg"
                className="text-lg px-8 py-6 h-auto bg-white text-primary hover:bg-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/jobs">Explore Jobs</Link>
              </Button>
            </SignedIn>

            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 h-auto border-white text-white hover:bg-white hover:text-primary transition-all duration-300"
            >
              <Link href="/jobs">Browse All</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted dark:bg-slate-900 text-muted-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-2">Remote Job Radar</h3>
            <p className="text-muted-foreground">
              Connecting talented professionals with amazing remote opportunities worldwide.
            </p>
          </div>

          <Separator className="my-6 bg-border" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Remote Job Radar. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <SignedIn>
                <Link href="/jobs" className="hover:text-foreground transition-colors">
                  Jobs
                </Link>
                <Link href="/kanban" className="hover:text-foreground transition-colors">
                  Pipeline
                </Link>
              </SignedIn>
              <Link href="/status" className="hover:text-foreground transition-colors">
                Server Status
              </Link>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">Built with ❤️ for remote workers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
