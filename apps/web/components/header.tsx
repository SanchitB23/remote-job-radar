import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

import { AvatarMenu } from "./account/AvatarMenu";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="border-b p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold hover:text-blue-600 transition-colors">
            Remote Job Radar
          </Link>
          <SignedIn>
            <nav className="flex gap-4">
              <Link href="/jobs" className="text-gray-600 hover:text-blue-600 transition-colors">
                Jobs
              </Link>
              <Link href="/kanban" className="text-gray-600 hover:text-blue-600 transition-colors">
                Kanban
              </Link>
              <Link href="/status" className="text-gray-600 hover:text-blue-600 transition-colors">
                Server Status
              </Link>
            </nav>
          </SignedIn>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <AvatarMenu />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
