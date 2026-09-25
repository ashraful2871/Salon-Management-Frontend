import Settings from "@/components/Dashboard/Settings";
import React from "react";
import { getMySalon } from "@/services/salon/getMySalon";
import { getSessionUser } from "@/services/auth/session";
import { getMe } from "@/services/auth/getMe";

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

  return (
    <div>
      <Settings salon={salon} currentEmail={user?.email ?? ""} signIn={signIn} />
    </div>
  );
};

export default SettingsPage;
