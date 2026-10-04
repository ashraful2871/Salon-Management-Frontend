export type HairStyleGroup = "short" | "medium" | "long" | "curly" | "fade";

export type HairStyle = {
  id: string;
  name: string;
  nameBn: string;
  group: HairStyleGroup;
  /** Local path under /public; the file may not exist yet. */
  thumbnail: string;
};

export type HairColor = {
  id: string;
  name: string;
  nameBn: string;
  /** CSS color, or "transparent" for "keep my colour". */
  swatch: string;
};

export type HairCatalog = {
  enabled: boolean;
  styles: HairStyle[];
  colors: HairColor[];
};

/** What the API hands back for a signed, direct-to-Cloudinary upload. */
export type UploadTicket = {
  uploadId: string;
  /** Proves this browser owns the upload. Sent back as `X-Tryon-Token`. */
  ownerToken: string;
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
  /** Signed upload fields, `signature` included. Post them unchanged. */
  params: Record<string, string | number>;
};

export type TryOnJobStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED";

export type TryOnJob = {
  jobId?: string;
  status: TryOnJobStatus;
  errorCode?: string | null;
  styleId: string;
  colorId: string;
  beforeUrl: string;
  resultUrl?: string;
  /** Watermarked, served as an attachment. */
  downloadUrl?: string;
};
