import { Share } from 'react-native';

import { env } from '@/config/env';

type Shareable = { id: string; title: string; businessName: string; remainingCapacity: number };

/** Opens the system share sheet with a link anyone can open, app or not (the API's /d/{id} page). */
export const shareDrop = async (drop: Shareable) => {
  const url = `${env.apiUrl}/d/${drop.id}`;
  const hook = drop.remainingCapacity > 0 ? `Son ${drop.remainingCapacity} yer, kaçırma! ⚡️` : '';

  try {
    await Share.share({
      // iOS shows the url as a rich preview; Android only reads the message, so it carries the link too.
      message: `${drop.businessName}: ${drop.title}\n${hook}\n${url}`.replace(/\n\n/g, '\n'),
      url,
    });
  } catch {
    // The sheet failing to open is not worth an error screen.
  }
};
