import { OwnerHomeFrame } from "@/components/HomeService/owner/OwnerHomeFrame";
import { SettingsForm } from "@/components/HomeService/owner/SettingsForm";

export const metadata = { title: "Home Service settings" };

/** /dashboard/home-service/settings: radius, fees, buffer and home hours. */
export default function HomeSettingsPage() {
  return (
    <OwnerHomeFrame tab="settings">
      {(home) => <SettingsForm key={home.profile.updatedAt} home={home} />}
    </OwnerHomeFrame>
  );
}
