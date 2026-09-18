import Settings from "@/components/Dashboard/Settings";
import React from "react";
import { getMySalon } from "@/services/salon/getMySalon";

const SettingsPage = async () => {
  const res = await getMySalon();
  const salon = res.success && res.data && res.data.length > 0 ? res.data[0] : null;

  return (
    <div>
      <Settings salon={salon} />
    </div>
  );
};

export default SettingsPage;
