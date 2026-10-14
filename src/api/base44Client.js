import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  // Remove `serverUrl: ''` which overrides the SDK default with an invalid origin.
  // If you need a custom server URL, set it to a full URL (e.g. serverUrl: appBaseUrl).
  appBaseUrl
});
