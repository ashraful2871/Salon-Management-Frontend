import Settings from "@/components/Dashboard/Settings";
import React from "react";
import { getMySalon } from "@/services/salon/getMySalon";
import { getSessionUser } from "@/services/auth/session";
import { getMe } from "@/services/auth/getMe";
import { getNotificationPrefs } from "@/services/notifications/getNotificationPrefs";
import { NotificationPrefsCard } from "@/components/Notifications/NotificationPrefsCard";

const BUSINESS_ROLES = ["SALON_OWNER", "BRANCH_MANAGER", "STAFF"];

const SettingsPage = async () => {
  const [res, user, me] = await Promise.all([
    getMySalon(),
    getSessionUser(),
    getMe(),
  ]);
  const salon = res.success && res.data && res.data.length > 0 ? res.data[0] : null;
  const signIn =
    me.success && me.data
      ? {
          hasPassword: me.data.hasPassword,
          signInMethods: me.data.signInMethods ?? [],
        }
      : null;
  // Business accounts get the event × channel table (the bell's preferences).
  const prefs = user && BUSINESS_ROLES.includes(user.role) ? await getNotificationPrefs() : null;

  return (
    <div>
      <Settings
        salon={salon}
        currentEmail={user?.email ?? ""}
        signIn={signIn}
        notifications={prefs?.success && prefs.data ? <NotificationPrefsCard initial={prefs.data} /> : null}
      />
    </div>
  );
};

export default SettingsPage;
