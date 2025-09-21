"use client";

import { UserProfile } from "@clerk/nextjs";
import { Settings } from "lucide-react";
import type { JSX } from "react";

// Custom panels
import { PersonalizationPanel } from "./PersonalizationPanel";

/**
 * Full-screen User Profile page with 1:3 layout split
 * Fixed sidebar, scrollable content area only
 */
export default function ClerkUserProfilePage(): JSX.Element {
  return (
    <div className="h-screen bg-background overflow-hidden">
      <UserProfile
        routing="path"
        path="/user-profile"
        appearance={{
          variables: {
            colorPrimary: "hsl(var(--primary))",
            colorText: "hsl(var(--foreground))",
            colorTextSecondary: "hsl(var(--muted-foreground))",
            colorBackground: "hsl(var(--background))",
            colorInputBackground: "hsl(var(--background))",
            colorInputText: "hsl(var(--foreground))",
            borderRadius: "var(--radius)",
            fontSize: "14px",
            fontFamily: "var(--font-sans)",
          },
          elements: {
            // Full screen layout - no scrolling on main container
            rootBox: "w-full h-screen bg-background",
            card: "bg-background border-0 shadow-none w-full h-screen flex overflow-hidden",

            // Fixed left sidebar - exactly 1/4 width, no scrolling
            navbar:
              "w-1/4 min-w-[320px] border-r border-border bg-card/30 flex-shrink-0 flex flex-col overflow-hidden",
            navbarMobileMenuButton: "hidden",

            // Sidebar header area
            userButtonBox: "p-6 border-b border-border flex-shrink-0",
            userButtonAvatarBox: "h-10 w-10",
            userButtonAvatarImage: "rounded-full",

            // Navigation area within sidebar - fixed, no scrolling
            navbarButtons: "flex-1 p-6 space-y-2 overflow-hidden",
            navbarButton:
              "w-full justify-start gap-3 h-12 px-4 text-sm font-medium transition-all duration-200 rounded-lg data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-muted/60 hover:text-foreground text-muted-foreground",
            navbarButtonIcon: "h-5 w-5 flex-shrink-0",

            // Right content area - 3/4 width, ONLY this area scrolls
            pageScrollBox: "flex-1 overflow-auto bg-background",
            page: "p-8 w-full min-h-full",

            // Content headers
            headerTitle: "text-2xl font-bold text-foreground mb-2",
            headerSubtitle: "text-sm text-muted-foreground mb-6",

            // Form styling
            formButtonPrimary:
              "h-10 px-6 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors",
            formButtonSecondary:
              "h-10 px-6 rounded-md border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors",
            formFieldInput:
              "h-10 px-3 rounded-md border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
            formFieldLabel: "text-sm font-medium text-foreground mb-2",
            formFieldAction: "text-sm text-primary hover:text-primary/80 transition-colors",

            // Content sections
            profileSection: "bg-card rounded-lg border border-border p-6 shadow-sm mb-6",
            profileSection__account: "bg-card rounded-lg border border-border p-6 shadow-sm mb-6",
            profileSection__security: "bg-card rounded-lg border border-border p-6 shadow-sm mb-6",

            // UI elements
            avatarBox: "ring-2 ring-border rounded-full",
            dividerRow: "bg-border",
            modalCloseButton: "rounded-md hover:bg-muted/60 transition-colors",
            badge: "rounded-md bg-muted text-muted-foreground px-2 py-1 text-xs font-medium",
            breadcrumb: "text-sm text-muted-foreground",
          },
        }}
      >
        <UserProfile.Page
          label="Personalization"
          url="personalization"
          labelIcon={<Settings className="h-4 w-4" />}
        >
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-lg font-semibold text-foreground">Personalization Settings</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Customize your job search experience by adding your skills and preferences.
              </p>
            </div>

            <PersonalizationPanel />
          </div>
        </UserProfile.Page>
      </UserProfile>
    </div>
  );
}
