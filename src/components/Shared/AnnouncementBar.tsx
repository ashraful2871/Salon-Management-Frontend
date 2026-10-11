import { createHash } from "crypto";
import { getPublicSettings, type Announcement } from "@/services/settings/getPublicSettings";
import { AnnouncementBarClient } from "./AnnouncementBarClient";

/** Inside its window now. Both ends are optional. */
const isLive = (a: Announcement, now = Date.now()) =>
  (!a.startsAt || Date.parse(a.startsAt) <= now) &&
  (!a.endsAt || now < Date.parse(a.endsAt));

/** Changes whenever the announcement does, so a new one shows again after a dismissal. */
export const announcementHash = (a: Announcement) =>
  createHash("sha256")
    .update(JSON.stringify([a.message, a.href ?? "", a.startsAt ?? "", a.endsAt ?? ""]))
    .digest("hex")
    .slice(0, 12);

/**
 * The `content.announcement` setting, as a strip on every public page. Read
 * through the cookieless public-settings fetch (60 s), so pages stay static;
 * the dismissal cookie is read on the client only.
 */
export async function AnnouncementBar() {
  const result = await getPublicSettings();
  const announcement = result.success ? result.data?.["content.announcement"] : null;
  if (!announcement || !isLive(announcement)) return null;

  return <AnnouncementBarClient announcement={announcement} hash={announcementHash(announcement)} />;
}
