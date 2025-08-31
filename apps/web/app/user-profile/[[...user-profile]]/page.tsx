"use client";

import { UserProfile } from "@clerk/nextjs";
import { UserStar } from "lucide-react";
import type { JSX } from "react";

// Optional: your custom panel embedded as a Clerk page (keeps Clerk shell)
import { PersonalizationPanel } from "@/components/account/panels/PersonalizationPanel";

/**
 * Clerk "path" must match the base route folder (/user-profile).
 * This file lives in [[...user-profile]] so Clerk can handle nested paths
 * like /user-profile, /user-profile/security, etc.
 *
 * We do NOT replace Clerk's UI/flow; we only theme it to match your tokens.
 */
export default function ClerkUserProfilePage(): JSX.Element {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <UserProfile
        routing="path"
        path="/user-profile"
        /*
         * Appearance only: keep Clerk sidebar, header, and internal pages.
         * We map colors/spacing/rounding to your Tailwind/shadcn CSS variables
         * for a native look across light/dark themes.
         */
        appearance={{
          variables: {
            // Colors
            colorPrimary: "hsl(var(--primary))",
            colorText: "hsl(var(--foreground))",
            colorTextSecondary: "hsl(var(--muted-foreground))",
            colorBackground: "hsl(var(--card))",
            colorInputBackground: "hsl(var(--background))",
            colorInputText: "hsl(var(--foreground))",
            // colorAlphaShade: "hsl(var(--muted))",
            // Shape & density
            borderRadius: "12px",
            fontSize: "14px",
            // Shadows
            // boxShadow: "0 1px 2px 0 hsl(var(--border) / 0.4), 0 8px 24px -8px hsl(var(--foreground) / 0.08)",
          },
          elements: {
            // Outer card & layout
            rootBox: "w-full",
            card: "bg-card border rounded-xl shadow-sm",
            headerTitle: "text-sm font-semibold",
            headerSubtitle: "text-xs text-muted-foreground",
            pageScrollBox: "p-0",

            // Left navbar (keep it; just align with your tokens)
            navbar: "border-r pr-2 mr-2",
            navbarButton:
              "h-9 rounded-md text-sm data-[active=true]:bg-muted data-[active=true]:text-foreground hover:bg-muted/60 hover:text-foreground",
            navbarItem__personalization: "text-sm",

            // Forms/buttons/inputs
            formButtonPrimary:
              "h-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90",
            formButtonSecondary:
              "h-9 rounded-md border bg-background text-foreground hover:bg-muted",
            formFieldInput:
              "h-9 rounded-md border bg-background focus-visible:ring-2 focus-visible:ring-primary/30",
            formFieldLabel: "text-xs",
            formFieldAction: "text-xs text-muted-foreground hover:text-foreground",

            // Specific sections (account/security look like cards)
            profileSection__account: "rounded-lg border bg-background p-4 sm:p-5",
            profileSection__security: "rounded-lg border bg-background p-4 sm:p-5",

            // Misc polish
            avatarBox: "ring-1 ring-border",
            dividerRow: "bg-border/60",
            modalCloseButton: "rounded-md",
            badge: "rounded-md",
            breadcrumb: "text-xs",
          },
        }}
      >
        {/* Optional: keep Clerk shell and add a custom page inside it */}
        <UserProfile.Page
          label="Personalization"
          url="personalization"
          labelIcon={
            <UserStar
              className="h-4 w-4 text-muted-foreground group-data-[active=true]:text-primary"
              fill="currentColor"
            />
          }
        >
          <div className="space-y-6">
            {/* Header with icon + text */}
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <UserStar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Personalization</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customize your experience with skills and résumé data to get better job
                  recommendations.
                </p>
              </div>
            </div>

            {/* Main panel content */}
            <div className="rounded-lg border bg-background p-4 sm:p-5 shadow-sm">
              <PersonalizationPanel />
            </div>
          </div>
        </UserProfile.Page>
      </UserProfile>
    </div>
  );
}
