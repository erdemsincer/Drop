import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { apiClient } from '@/api/apiClient';

const MAX_WIDTH = 1280;

/**
 * Shrinks a picked photo to at most 1280 px wide as a ~200 KB JPEG, then
 * uploads it. Returns the media id to put on the drop.
 */
export const uploadDropPhoto = async (uri: string, width: number) => {
  let context = ImageManipulator.manipulate(uri);
  if (width > MAX_WIDTH) context = context.resize({ width: MAX_WIDTH });

  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });

  const form = new FormData();
  // React Native's FormData takes a file descriptor object instead of a Blob.
  form.append('file', { uri: saved.uri, name: 'drop.jpg', type: 'image/jpeg' } as unknown as Blob);

  const response = await apiClient.post<{ id: string }>('/api/media', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30_000,
  });

  return response.data.id;
};
