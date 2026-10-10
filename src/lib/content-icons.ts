import {
  Brush,
  Crown,
  Droplet,
  Feather,
  Flame,
  Flower2,
  Footprints,
  Gem,
  Hand,
  Heart,
  HeartHandshake,
  Leaf,
  Palette,
  Scissors,
  Smile,
  Sparkles,
  Star,
  Store,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";

// The API's CONTENT_ICONS allow-list (src/app/utils/settings.ts): a category
// tile stores the name, and only these names validate.
export const CONTENT_ICONS: Record<string, LucideIcon> = {
  Scissors,
  Wind,
  Palette,
  Sparkles,
  Smile,
  Brush,
  Hand,
  Footprints,
  Feather,
  HeartHandshake,
  Flower2,
  Store,
  Star,
  Gem,
  Crown,
  Droplet,
  Leaf,
  Heart,
  Flame,
  Sun,
};

export const contentIcon = (name: string, fallback: LucideIcon = Sparkles) =>
  CONTENT_ICONS[name] ?? fallback;
