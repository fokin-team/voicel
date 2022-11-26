import { shallowRef } from 'vue';
import { defineStore } from 'pinia';

import { URL_WS } from '@/config';

import { WebSocketProvider } from '@/utils/WebSocket';

export const useWebSocketStore = defineStore('webSocketStore', () => {
  const ws = shallowRef<WebSocketProvider>(
    (new WebSocketProvider(URL_WS)),
  );

  return {
    ws,
  };
});
