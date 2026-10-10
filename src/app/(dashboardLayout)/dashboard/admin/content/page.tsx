import type { Metadata } from "next";
import { getContent } from "@/services/admin/content/getContent";
import { ContentClient } from "@/components/Admin/content/ContentClient";

export const metadata: Metadata = { title: "Content | Admin" };

export default async function ContentPage() {
  return <ContentClient response={await getContent()} />;
}
