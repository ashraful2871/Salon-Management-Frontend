// Neighbourhood centres offered as one-tap starting points: in the location
// dialog (which geocodes the name first and falls back to these) and on the
// home page's "Find salons near you" banner (which uses them as they are).
export type PopularArea = { name: string; lat: number; lng: number };

export const POPULAR_AREAS: PopularArea[] = [
  { name: "Dhanmondi", lat: 23.746, lng: 90.374 },
  { name: "Gulshan", lat: 23.793, lng: 90.414 },
  { name: "Uttara", lat: 23.874, lng: 90.39 },
  { name: "Mirpur", lat: 23.807, lng: 90.368 },
  { name: "Banani", lat: 23.794, lng: 90.404 },
  { name: "Mohammadpur", lat: 23.766, lng: 90.359 },
];
