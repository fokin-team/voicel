import { shallowRef } from 'vue';
import { defineStore } from 'pinia';

import { WebRtc } from '@/utils/WebRTC';

export const useWebRtcStore = defineStore('webRtcStore', () => {
  const webRtc = shallowRef<WebRtc | undefined>(undefined);

  return {
    webRtc,
  };
});
