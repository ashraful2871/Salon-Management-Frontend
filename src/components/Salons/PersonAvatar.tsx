import SafeImage from "@/components/Shared/SafeImage";
import { cn } from "@/lib/utils";

import { initials } from "./salon-view";

/** A round photo, or the person's initials on the soft brand tone. */
export default function PersonAvatar({
  name,
  photo,
  className,
}: {
  name: string;
  photo?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary-hover",
        className,
      )}
    >
      {photo ? <SafeImage src={photo} alt="" fill sizes="64px" className="object-cover" /> : initials(name)}
    </span>
  );
}
