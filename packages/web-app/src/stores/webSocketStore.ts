import { shallowRef } from 'vue';
import { defineStore } from 'pinia';

import { URL_WS } from '@/config';

import { WebSocketProvider } from '@/utils/WebSocket';

export const useWebSocketStore = defineStore('webSocket', () => {
  const ws = shallowRef(
    (new WebSocketProvider(URL_WS)),
  );

  return {
    ws,
  };
});
