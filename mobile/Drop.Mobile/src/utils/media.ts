import { env } from '@/config/env';

/** Public URL of an uploaded image; images never change, so it caches forever. */
export const mediaUrl = (id: string) => `${env.apiUrl}/api/media/${id}`;
