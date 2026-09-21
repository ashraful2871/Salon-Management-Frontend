import Settings from "@/components/Dashboard/Settings";
import React from "react";
import { getMySalon } from "@/services/salon/getMySalon";
import { getSessionUser } from "@/services/auth/session";

const SettingsPage = async () => {
  const [res, user] = await Promise.all([getMySalon(), getSessionUser()]);
  const salon = res.success && res.data && res.data.length > 0 ? res.data[0] : null;

  return (
    <div>
      <Settings salon={salon} currentEmail={user?.email ?? ""} />
    </div>
  );
};

export default SettingsPage;
