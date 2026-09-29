import { getMe, type AuthMe } from "@/services/auth/getMe";
import type { User } from "@/lib/api-types";
import React from "react";
import MyProfile from "@/components/Dashboard/MyProfile";

export const metadata = {
  title: "My Profile | SalonKhuji",
};

export default async function CommonProfilePage() {
  const getMeProfile = await getMe();
  const profile = getMeProfile.data as unknown as (AuthMe & User);

  if (!getMeProfile.success || !profile) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <p className="font-medium text-destructive">
            {getMeProfile.message || "Failed to load profile."}
          </p>
        </div>
      </div>
    );
  }

  return <MyProfile profile={profile} />;
}
