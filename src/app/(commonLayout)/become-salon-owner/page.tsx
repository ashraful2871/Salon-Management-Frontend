import type { Metadata } from "next";
import PageHero from "@/components/BecomeASalonWoner/PageHero";
import OwnerSteps from "@/components/BecomeASalonWoner/OwnerSteps";
import PageFeatures from "@/components/BecomeASalonWoner/PageFeatures";
import ApplyForm from "@/components/BecomeASalonWoner/ApplyForm";
import { getUserRoles } from "@/services/get-roles/getUserRoles";

export const metadata: Metadata = {
  title: "List your salon",
  description:
    "Put your salon on SalonKhuji: take bookings online and manage your slots, services and staff in one place.",
};

export default async function BecomeSalonOwnerPage() {
  const role = await getUserRoles();

  return (
    <>
      <PageHero role={role} />
      <OwnerSteps />
      <PageFeatures />
      <ApplyForm role={role} />
    </>
  );
}
