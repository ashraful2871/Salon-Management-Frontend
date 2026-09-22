import { Badge } from "@/components/ui/badge";
import type { LocationAccuracy } from "@/lib/api-types";

// Exact / Approximate / <emptyLabel>, from a salon's location columns.
export function LocationAccuracyBadge({
  latitude,
  locationAccuracy,
  emptyLabel = "No location",
}: {
  latitude?: number | null;
  locationAccuracy?: LocationAccuracy | null;
  emptyLabel?: string;
}) {
  if (latitude == null) {
    return (
      <Badge variant="outline" className="border-destructive/40 text-destructive">
        {emptyLabel}
      </Badge>
    );
  }
  if (locationAccuracy === "EXACT") {
    return <Badge className="border-transparent bg-sage text-white">Exact</Badge>;
  }
  return (
    <Badge className="border-transparent bg-gold/15 text-gold-dark">
      Approximate
    </Badge>
  );
}
