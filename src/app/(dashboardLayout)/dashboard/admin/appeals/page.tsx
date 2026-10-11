import type { Metadata } from "next";
import { getAdminAppeals } from "@/services/admin/appeals/getAdminAppeals";
import { AppealsClient } from "./AppealsClient";

export const metadata: Metadata = {
  title: "No-show appeals | Admin",
  description: "Decide no-show appeals within 48 hours",
};

export default async function AdminAppealsPage() {
  const response = await getAdminAppeals();
  return <AppealsClient response={response} />;
}
