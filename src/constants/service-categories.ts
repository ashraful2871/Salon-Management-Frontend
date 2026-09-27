import {
  Brush,
  Feather,
  Flower2,
  Footprints,
  Hand,
  HeartHandshake,
  Palette,
  Scissors,
  Smile,
  Sparkles,
  Wind,
  type LucideIcon,
} from "lucide-react";

// The API's ServiceCategory enum (prisma/schema/enum.prisma) minus OTHER.
export const SERVICE_CATEGORIES = [
  { value: "HAIRCUT", label: "Haircut", icon: Scissors },
  { value: "STYLING", label: "Styling", icon: Wind },
  { value: "COLORING", label: "Hair colour", icon: Palette },
  { value: "TREATMENT", label: "Hair treatment", icon: Sparkles },
  { value: "FACIAL", label: "Facial", icon: Smile },
  { value: "MAKEUP", label: "Makeup", icon: Brush },
  { value: "MANICURE", label: "Manicure", icon: Hand },
  { value: "PEDICURE", label: "Pedicure", icon: Footprints },
  { value: "WAXING", label: "Waxing", icon: Feather },
  { value: "MASSAGE", label: "Massage", icon: HeartHandshake },
  { value: "SPA", label: "Spa", icon: Flower2 },
] as const satisfies readonly {
  value: string;
  label: string;
  icon: LucideIcon;
}[];

export type ServiceCategoryValue = (typeof SERVICE_CATEGORIES)[number]["value"];

export const isServiceCategory = (v?: string): v is ServiceCategoryValue =>
  SERVICE_CATEGORIES.some((c) => c.value === v);

// Known values get their label; anything else is humanised
// ("HAIR COLOR" -> "Hair Color").
export const categoryLabel = (value: string) =>
  SERVICE_CATEGORIES.find((c) => c.value === value)?.label ??
  value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
