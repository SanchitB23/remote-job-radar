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
            className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-colors duration-200 group-hover:text-emerald-200 group-hover:dark:text-emerald-200"
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
            className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-colors duration-200 group-hover:text-amber-300 group-hover:dark:text-amber-200"
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
            className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-colors duration-200 group-hover:text-sky-400 group-hover:dark:text-sky-200"
            fill="currentColor"
          />
        }
      >
        <PrivacyPanel />
      </UserButton.UserProfilePage> */}
    </UserButton>
  );
}
