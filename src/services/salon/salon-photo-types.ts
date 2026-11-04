/** `POST /salons[/:id]/photo-upload-signature`: a signed direct upload to Cloudinary. */
export type SalonPhotoTicket = {
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
  /** Post exactly these (they include `signature`), plus `file` and `api_key`. */
  params: Record<string, string | number>;
  expiresAt: string;
  maxBytes: number;
  /** Photos a salon may keep; the first is the cover. */
  maxImages: number;
  formats: string[];
};

/** Mirrors the backend's SALON_MAX_IMAGES (salon.photos.ts) for the UI before a ticket is fetched. */
export const SALON_MAX_PHOTOS = 10;
