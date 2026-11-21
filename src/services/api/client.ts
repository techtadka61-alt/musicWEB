import { publicEnv } from '@/lib/env';
import { createHttpClient } from './http-client';

export const apiClient = createHttpClient({ baseUrl: publicEnv.NEXT_PUBLIC_API_BASE_URL });
