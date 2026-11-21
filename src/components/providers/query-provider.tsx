'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiError } from '@/services/api/http-client';

function shouldRetry(failureCount: number, error: unknown): boolean {
  // 4xx responses won't change on retry; network blips and 5xx might.
  if (error instanceof ApiError && error.statusCode !== null && error.statusCode < 500) {
    return false;
  }
  return failureCount < 2;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // One client per browser session; useState keeps it stable across re-renders.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: shouldRetry,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
