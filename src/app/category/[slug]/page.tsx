import { Suspense } from 'react';
import { Skeleton, SongListSkeleton } from '@/components/common/states';
import { CategoryView } from './category-view';

function CategorySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-48 rounded-2xl" />
      <SongListSkeleton />
    </div>
  );
}

/**
 * With Cache Components, `params` is request data and must be read inside <Suspense> so the
 * static shell (header, player bar) can be served instantly.
 */
export default function CategoryPage({ params }: PageProps<'/category/[slug]'>) {
  return (
    <Suspense fallback={<CategorySkeleton />}>
      {params.then(({ slug }) => (
        <CategoryView slug={decodeURIComponent(slug)} />
      ))}
    </Suspense>
  );
}
