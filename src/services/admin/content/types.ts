import type { Announcement, CategoryTile, HomeChip } from "@/services/settings/getPublicSettings";

export type ContentKey =
  | "content.announcement"
  | "content.featuredSalonIds"
  | "content.homeChips"
  | "content.categoryTiles";

export type ContentValues = {
  "content.announcement": Announcement | null;
  "content.featuredSalonIds": string[];
  "content.homeChips": HomeChip[];
  "content.categoryTiles": CategoryTile[];
};

export type ContentSetting<K extends ContentKey = ContentKey> = {
  key: K;
  value: ContentValues[K];
  default: ContentValues[K];
  version: number;
  updatedAt: string | null;
};

/** A featured salon with its live status: the public site shows only ACTIVE, non-test ones. */
export type AdminFeaturedSalon = {
  id: string;
  name: string;
  area: string;
  rating: number;
  totalReviews: number;
  cover: string | null;
  status: string;
  isDeleted: boolean;
  isTest: boolean;
};

export type AdminContent = {
  settings: ContentSetting[];
  featuredSalons: AdminFeaturedSalon[];
  /** Lucide names the API accepts for a category tile. */
  icons: string[];
  maxFeatured: number;
};
