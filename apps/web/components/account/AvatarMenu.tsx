"use client";

import { UserButton } from "@clerk/nextjs";
import { UserStar } from "lucide-react";

import { PersonalizationPanel } from "@/components/account/panels/PersonalizationPanel";

/**
 * Renders Clerk's UserButton and injects custom pages inside the modal UserProfile.
 * You can also render as a full page (see /app/user-profile route below).
 */
export function AvatarMenu() {
  return (
    <UserButton userProfileMode="modal">
      <UserButton.UserProfilePage
        label="Personalization"
        url="personalization"
        labelIcon={
          <UserStar
            className="w-4 h-4 text-muted-foreground transition-colors duration-200 group-hover:text-chart-4"
            fill="currentColor"
          />
        }
      >
        <PersonalizationPanel />
      </UserButton.UserProfilePage>

      {/*       <UserButton.UserProfilePage
        label="Notifications"
        url="notifications"
        labelIcon={
          <Bell
            className="w-4 h-4 text-muted-foreground transition-colors duration-200 group-hover:text-chart-5"
            fill="currentColor"
          />
        }
      >
        <NotificationsPanel />
      </UserButton.UserProfilePage>

      <UserButton.UserProfilePage
        label="Privacy & Data"
        url="privacy"
        labelIcon={
          <KeySquare
            className="w-4 h-4 text-muted-foreground transition-colors duration-200 group-hover:text-primary"
            fill="currentColor"
          />
        }
      >
        <PrivacyPanel />
      </UserButton.UserProfilePage> */}
    </UserButton>
  );
}
