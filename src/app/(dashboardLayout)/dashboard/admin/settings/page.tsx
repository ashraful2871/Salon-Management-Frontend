import type { Metadata } from "next";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getSettings } from "@/services/admin/settings/getSettings";
import { SettingsClient } from "@/components/Admin/settings/SettingsClient";

export const metadata: Metadata = { title: "Platform settings | Admin" };

export default async function PlatformSettingsPage() {
  const [response, me] = await Promise.all([getSettings(), getAdminMe()]);
  return <SettingsClient response={response} permissions={me.data?.permissions ?? []} />;
}
