import * as WebBrowser from 'expo-web-browser';

import { env } from '@/config/env';
import { colors } from '@/ui';

export type LegalPage = 'privacy' | 'terms';

/** Opens the privacy notice or the terms, served by the API so the store listings can link the same page. */
export const openLegal = (page: LegalPage) =>
  WebBrowser.openBrowserAsync(`${env.apiUrl}/legal/${page}`, {
    controlsColor: colors.primary,
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
