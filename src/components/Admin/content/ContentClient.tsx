"use client";

import { ErrorState } from "@/components/Shared/ErrorState";
import { PageHeader } from "@/components/Shared/PageHeader";
import type { ApiResponse } from "@/lib/api-types";
import type {
  AdminContent,
  ContentKey,
  ContentSetting,
} from "@/services/admin/content/types";
import type { Announcement } from "@/services/settings/getPublicSettings";
import { AnnouncementEditor, checkAnnouncement, tidyAnnouncement } from "./AnnouncementEditor";
import { ContentSection } from "./ContentSection";
import { FeaturedEditor, type FeaturedRow } from "./FeaturedEditor";
import { ChipsEditor, checkChips, tidyChips, type ChipDraft } from "./ChipsEditor";
import { TilesEditor, checkTiles, tidyTiles } from "./TilesEditor";

const settingOf = <K extends ContentKey>(data: AdminContent, key: K) =>
  data.settings.find((s) => s.key === key) as ContentSetting<K> | undefined;

/** Remount on a new version, so a save replaces the draft with the server's value. */
const versionKey = (s: ContentSetting) => `${s.key}:${s.version}`;

export function ContentClient({ response }: { response: ApiResponse<AdminContent> }) {
  const data = response.success ? response.data : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content"
        description="What the home page features, changed without a deploy. The public site picks up a save within about a minute."
      />
      {!data ? (
        <ErrorState title="Couldn't load the site content" message={response.message} />
      ) : (
        <ContentSections data={data} />
      )}
    </div>
  );
}

function ContentSections({ data }: { data: AdminContent }) {
  const announcement = settingOf(data, "content.announcement");
  const featured = settingOf(data, "content.featuredSalonIds");
  const chips = settingOf(data, "content.homeChips");
  const tiles = settingOf(data, "content.categoryTiles");
  const known = new Map(data.featuredSalons.map((s) => [s.id, s]));

  return (
    <>
      {announcement && (
        <ContentSection
          key={versionKey(announcement)}
          setting={announcement}
          title="Announcement"
          description="A bar at the top of every public page, shown only inside its time window."
          toDraft={(v) => v}
          toValue={(d: Announcement | null) => {
            const a = tidyAnnouncement(d);
            const error = checkAnnouncement(a);
            return error ? { error } : { value: a };
          }}
          describe={(v) => (v ? `“${v.message}”` : "No announcement")}
        >
          {(draft, setDraft) => <AnnouncementEditor value={draft} onChange={setDraft} disabled={false} />}
        </ContentSection>
      )}

      {featured && (
        <ContentSection
          key={versionKey(featured)}
          setting={featured}
          title="Featured salons"
          description={`Shown first in the home page's top-rated row, labelled "Featured". Up to ${data.maxFeatured}; a salon that stops being ACTIVE drops off the site by itself.`}
          toDraft={(ids): FeaturedRow[] =>
            ids.map((id) => {
              const s = known.get(id);
              return s
                ? { ...s }
                : { id, name: "Unknown salon", area: "", rating: 0, totalReviews: 0, cover: null, status: "DELETED", isDeleted: true, isTest: false };
            })
          }
          toValue={(rows) => {
            const blocked = rows.find((r) => r.status !== "ACTIVE" || r.isDeleted);
            if (blocked) return { error: `${blocked.name} is not ACTIVE: remove it to save` };
            if (rows.length > data.maxFeatured) return { error: `At most ${data.maxFeatured} salons` };
            return { value: rows.map((r) => r.id) };
          }}
          describe={(ids) =>
            ids.length
              ? `${ids.length} featured salon${ids.length === 1 ? "" : "s"}`
              : "No featured salons"
          }
        >
          {(draft, setDraft) => (
            <FeaturedEditor rows={draft} max={data.maxFeatured} onChange={setDraft} />
          )}
        </ContentSection>
      )}

      {chips && (
        <ContentSection
          key={versionKey(chips)}
          setting={chips}
          title="Popular search chips"
          description="The chips under the home search box: each runs a search or opens a category. Empty shows the built-in five."
          toDraft={(list): ChipDraft[] =>
            list.map((c) => ({
              label: c.label,
              mode: c.category ? "category" : "query",
              query: c.query ?? "",
              category: c.category ?? "",
            }))
          }
          toValue={(d) => {
            const error = checkChips(d);
            return error ? { error } : { value: tidyChips(d) };
          }}
          describe={(list) => (list.length ? list.map((c) => c.label).join(", ") : "The built-in chips")}
        >
          {(draft, setDraft) => <ChipsEditor rows={draft} onChange={setDraft} />}
        </ContentSection>
      )}

      {tiles && (
        <ContentSection
          key={versionKey(tiles)}
          setting={tiles}
          title="Category tiles"
          description='The home page "Browse by service" tiles, in this order. "All salons" is always last.'
          toDraft={(list) => [...list].sort((a, b) => a.order - b.order)}
          toValue={(d) => {
            const error = checkTiles(d);
            return error ? { error } : { value: tidyTiles(d) };
          }}
          describe={(list) => {
            const shown = list.filter((t) => t.visible).length;
            return `${shown} of ${list.length} tiles shown`;
          }}
        >
          {(draft, setDraft) => <TilesEditor rows={draft} icons={data.icons} onChange={setDraft} />}
        </ContentSection>
      )}
    </>
  );
}
