import { shallowRef, triggerRef } from 'vue';
import { defineStore } from 'pinia';

import { WebRtc } from '@/utils/WebRTC';

export const useWebRtcStore = defineStore('webRtcStore', () => {
  const webRtc = shallowRef<WebRtc | undefined>(undefined);

  const setWebRtc = (webRtcValue: WebRtc) => {
    webRtc.value = webRtcValue;
    triggerRef(webRtc);
  };

  return {
    webRtc,
    setWebRtc,
  };
});
