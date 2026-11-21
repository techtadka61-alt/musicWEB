import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.url().transform((url) => url.replace(/\/+$/, '')),
});

/**
 * Next.js only inlines `process.env.NEXT_PUBLIC_*` when accessed by its literal name,
 * so each variable is listed explicitly rather than passing `process.env` through.
 */
export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});
