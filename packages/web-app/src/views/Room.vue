<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useWebSocketStore } from '@/stores/webSocketStore';
import { useWebRtcStore } from '@/stores/webRtcStore';
import { WebRtc } from '@/utils/WebRTC';
import { WebSocketProvider } from '@/utils/WebSocket';

const { ws } = useWebSocketStore();

const webRtcStore = useWebRtcStore();

const localVideoNode = ref<HTMLElement | null>(null);
const remoteVideoNode = ref<HTMLElement | null>(null);
const remoteAudioNode = ref<HTMLElement | null>(null);

onMounted(async () => {
  if (localVideoNode.value && remoteVideoNode.value && remoteAudioNode.value) {
    const webRtc = new WebRtc(
      localVideoNode.value,
      remoteVideoNode.value,
      remoteAudioNode.value, (
        ws as WebSocketProvider),
      '',
    );

    const roomId = await webRtc.createRoom();
    await webRtc.join(roomId);
    await webRtc.initTransports();
    webRtc.initSockets();
  }
});
</script>

<template>
  <div class="room">
    <h1>Конференция</h1>
    <div ref="localVideoNode" class="local-video-node" />
    <div ref="remoteVideoNode" class="remote-video-node" />
    <div ref="remoteAudioNode" class="remote-audio-node" />
  </div>
</template>

<style lang="scss" scoped>

</style>
