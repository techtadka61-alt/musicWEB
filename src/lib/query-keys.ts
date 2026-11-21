export const queryKeys = {
  categories: ['categories'] as const,
  category: (slug: string) => ['categories', slug] as const,
  categorySongs: (slug: string) => ['songs', 'category', slug] as const,
  mostPlayed: ['songs', 'most-played'] as const,
};
