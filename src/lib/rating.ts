// Salon ratings arrive as a raw average (e.g. 3.7272727). Show one decimal,
// the same way the map popup and the AI search reasons already do.
export const formatRating = (rating?: number | null) =>
  (Number(rating) || 0).toFixed(1);
