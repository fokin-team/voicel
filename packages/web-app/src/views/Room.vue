<script lang="ts" setup>
import { onBeforeMount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useWebRtcStore } from '@/stores/webRtcStore';
import { WebRtc } from '@/utils/WebRTC';

import VButton from '@/components/kit/VButton.vue';
import { useWebSocketStore } from '@/stores/webSocketStore';
import { WebSocketProvider } from '@/utils/WebSocket';

const route = useRoute();

const roomId = route.params.id as string;

const { ws } = useWebSocketStore();
const webRtcStore = useWebRtcStore();

const webRtcCreate = () => {
  const webRtcValue = new WebRtc(
    (ws as WebSocketProvider),
    '',
  );

  webRtcStore.setWebRtc(webRtcValue);
};

const localVideoNode = ref<HTMLElement | null>(null);
const remoteVideoNode = ref<HTMLElement | null>(null);
const remoteAudioNode = ref<HTMLElement | null>(null);

const audioInputs: InputDeviceInfo[] = [];

let isEnumerateDevices = false;

const enumerateDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  if (devices.length > 0) {
    isEnumerateDevices = true;
  }
  devices.forEach((device) => {
    switch (device.kind) {
      case 'audioinput':
        audioInputs.push(device);
        break;
      default:
        break;
    }
  });
};

const initEnumerateDevices = async () => {
  // Many browsers, without the consent of getUserMedia, cannot enumerate the devices.
  if (isEnumerateDevices) {
    return;
  }

  const constraints = {
    audio: true,
    video: true,
  };

  const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
  try {
    stream.getTracks().forEach((track) => { track.stop(); });
  } catch (e) {
    console.error('Access denied for audio/video: ', e);
  }
};

onMounted(async () => {
  if (localVideoNode.value && remoteVideoNode.value && remoteAudioNode.value) {
    if (typeof webRtcStore.webRtc === 'undefined') {
      webRtcCreate();
    }

    await enumerateDevices();
    await initEnumerateDevices();

    if (typeof webRtcStore.webRtc === 'undefined') {
      throw new Error('web rtc is undefined');
    }

    await webRtcStore.webRtc.join(
      roomId,
      localVideoNode.value,
      remoteVideoNode.value,
      remoteAudioNode.value,
    );
    await webRtcStore.webRtc.initTransports();
    webRtcStore.webRtc.initSockets();
  }
});

const onMicrophoneTurnOnButtonClickHandler = async () => {
  if (audioInputs.length > 0) {
    if (typeof webRtcStore.webRtc === 'undefined') {
      throw new Error('web rtc is undefined');
    }

    await webRtcStore.webRtc.produce('audio', audioInputs[0].deviceId);
  } else {
    alert('audio inputs not found');
  }
};
</script>

<template>
  <div class="room">
    <h1>Конференция</h1>
    <v-button type="primary" @click="onMicrophoneTurnOnButtonClickHandler">
      Включить микрофон
    </v-button>
    <div ref="localVideoNode" class="local-video-node" />
    <div ref="remoteVideoNode" class="remote-video-node" />
    <div ref="remoteAudioNode" class="remote-audio-node" />
  </div>
</template>

<style lang="scss" scoped>

</style>
