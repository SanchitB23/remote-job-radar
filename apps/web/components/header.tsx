"use client";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { motion, useScroll } from "motion/react";
import Link from "next/link";
import React from "react";

import { cn } from "@/lib/utils";

import { AvatarMenu } from "./account/AvatarMenu";
import { Logo } from "./logo";
import { AnimatedThemeToggler } from "./magicui/animated-theme-toggler";
import { AuroraText } from "./magicui/aurora-text";

const navLinks = [
  { name: "Jobs", href: "/jobs" },
  { name: "Kanban", href: "/kanban" },
  { name: "Server Status", href: "/status" },
];

export function Header() {
  const [menuState, setMenuState] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { scrollYProgress } = useScroll();

  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setScrolled(latest > 0.05);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <header>
      <nav data-state={menuState && "active"} className="fixed z-20 w-full pt-2">
        <div
          className={cn(
            "mx-auto max-w-7xl rounded-3xl px-6 transition-all duration-300 lg:px-12",
            scrolled && "bg-background/50 backdrop-blur-2xl",
          )}
        >
          <motion.div
            key={1}
            className={cn(
              "relative flex flex-wrap items-center justify-between gap-6 py-3 duration-200 lg:gap-0 lg:py-6",
              scrolled && "lg:py-4",
            )}
          >
            <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-2 text-xl font-bold hover:text-primary transition-colors"
              >
                <Logo />
                <AuroraText>Remote Job Radar</AuroraText>
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu
                  className={cn(
                    "m-auto size-6 duration-200",
                    menuState && "rotate-180 scale-0 opacity-0",
                  )}
                />
                <X
                  className={cn(
                    "absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200",
                    menuState && "rotate-0 scale-100 opacity-100",
                  )}
                />
              </button>

              <div className="hidden lg:block">
                <SignedIn>
                  <ul className="flex gap-8 text-sm">
                    {navLinks.map((item, index) => (
                      <li key={index}>
                        <Link
                          href={item.href}
                          className="text-muted-foreground hover:text-primary transition-colors block duration-150"
                        >
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </SignedIn>
              </div>
            </div>

            <div
              className={cn(
                "bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent",
                menuState && "block",
              )}
            >
              <div className="lg:hidden w-full">
                <SignedIn>
                  <ul className="space-y-6 text-base mb-6">
                    {navLinks.map((item, index) => (
                      <li key={index}>
                        <Link
                          href={item.href}
                          className="text-muted-foreground hover:text-primary transition-colors block duration-150"
                        >
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </SignedIn>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit items-center justify-end">
                <AnimatedThemeToggler />
                <SignedOut>
                  <SignInButton />
                  <SignUpButton />
                </SignedOut>
                <SignedIn>
                  <AvatarMenu />
                </SignedIn>
              </div>
            </div>
          </motion.div>
        </div>
      </nav>
    </header>
  );
}
