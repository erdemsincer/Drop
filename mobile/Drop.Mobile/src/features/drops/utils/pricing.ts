type Priced = { originalPrice?: number | null; dealPrice?: number | null };

export type Deal = { original: number; deal: number; percent: number; saving: number };

/** The before/after price, when the drop has one. */
export const dealOf = ({ originalPrice, dealPrice }: Priced): Deal | null => {
  if (originalPrice == null || dealPrice == null || originalPrice <= 0) return null;

  return {
    original: originalPrice,
    deal: dealPrice,
    percent: Math.round((1 - dealPrice / originalPrice) * 100),
    saving: originalPrice - dealPrice,
  };
};
