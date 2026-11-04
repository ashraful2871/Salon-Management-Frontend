import { redirect } from "next/navigation";

/**
 * Home visits are booked only from a salon's page ("Book now" → "At home"),
 * so the per-side expert list is not routed; /home-service explains how it
 * works. The list itself (components/HomeService/HomeListPage) is kept.
 */
export default function HomeSideRedirect() {
  redirect("/home-service");
}
