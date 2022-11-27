<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { NSelect } from 'naive-ui';

import { useWebRtcStore } from '@/stores/webRtcStore';
import { useWebSocketStore } from '@/stores/webSocketStore';
import { WebSocketProvider } from '@/utils/WebSocket';
import { Events, WebRtc } from '@/utils/WebRTC';

import VIcon from '@/components/kit/VIcon.vue';
import VButton from '@/components/kit/VButton.vue';
import { useGetCSSVariable } from '@/hooks/useCssVariables';

const route = useRoute();

const roomId = route.params.id as string;

const { ws } = useWebSocketStore();
const webRtcStore = useWebRtcStore();

const colorPrimary = useGetCSSVariable('--color-primary');

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

const isConnected = ref(false);

const audioInputs = ref<InputDeviceInfo[]>([]);
const audioInputsOptions = computed(() => audioInputs.value.map((audioInput) => ({
  value: audioInput.deviceId,
  label: audioInput.label,
})));
const activeAudioInputId = ref<string | null>(null);

const videoInputs = ref<InputDeviceInfo[]>([]);
const videoInputsOptions = computed(() => videoInputs.value.map((audioInput) => ({
  value: audioInput.deviceId,
  label: audioInput.label,
})));
const activeVideoInputId = ref<string | null>(null);

let isEnumerateDevices = false;

const enumerateDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  console.log(devices);

  devices.forEach((device) => {
    switch (device.kind) {
      case 'audioinput':
        audioInputs.value.push(device);
        break;
      case 'videoinput':
        videoInputs.value.push(device);
        break;
      default:
        break;
    }
  });

  if (devices.length > 0) {
    isEnumerateDevices = true;
  }

  if (audioInputs.value.length > 0) {
    // eslint-disable-next-line prefer-destructuring
    activeAudioInputId.value = audioInputs.value[0].deviceId;
  }

  if (videoInputs.value.length > 0) {
    // eslint-disable-next-line prefer-destructuring
    activeVideoInputId.value = videoInputs.value[0].deviceId;
  }
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

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  await enumerateDevices();
  try {
    stream.getTracks().forEach((track) => { track.stop(); });
  } catch (e) {
    console.error('Access denied for audio/video: ', e);
  }
};

onMounted(async () => {
  if (typeof webRtcStore.webRtc === 'undefined') {
    webRtcCreate();
  }

  await initEnumerateDevices();

  // if (typeof webRtcStore.webRtc === 'undefined') {
  //   throw new Error('web rtc is undefined');
  // }
  //
  // await webRtcStore.webRtc.join(
  //   roomId,
  //   localVideoNode.value,
  //   remoteVideoNode.value,
  //   remoteAudioNode.value,
  // );
  // await webRtcStore.webRtc.initTransports();
  // webRtcStore.webRtc.initSockets();
});

const microActive = ref(false);
const cameraActive = ref(false);
const onConnectToRoom = async () => {
  if (typeof webRtcStore.webRtc === 'undefined') {
    throw new Error('web rtc is undefined');
  }

  webRtcStore.webRtc.emitter.addListener(Events.startAudio, () => {
    microActive.value = true;
  });

  webRtcStore.webRtc.emitter.addListener(Events.stopVideo, () => {
    microActive.value = false;
  });

  webRtcStore.webRtc.emitter.addListener(Events.startVideo, () => {
    cameraActive.value = true;
  });

  webRtcStore.webRtc.emitter.addListener(Events.stopVideo, () => {
    cameraActive.value = true;
  });

  await webRtcStore.webRtc.join(
    roomId,
    localVideoNode.value,
    remoteVideoNode.value,
    remoteAudioNode.value,
  );
  await webRtcStore.webRtc.initTransports();
  webRtcStore.webRtc.initSockets();

  isConnected.value = true;
};

const onMicrophoneTurnOnButtonClickHandler = async () => {
  if (activeVideoInputId.value) {
    if (typeof webRtcStore.webRtc === 'undefined') {
      throw new Error('web rtc is undefined');
    }

    await webRtcStore.webRtc.produce('audio', activeVideoInputId.value);
  } else {
    alert('audio inputs not found');
  }
};

const onWebCamTurnOnButtonClickHandler = async () => {
  if (activeVideoInputId.value) {
    if (typeof webRtcStore.webRtc === 'undefined') {
      throw new Error('web rtc is undefined');
    }

    await webRtcStore.webRtc.produce('video', activeVideoInputId.value);
  } else {
    alert('audio inputs not found');
  }
};
</script>

<template>
  <div v-show="!isConnected" class="connect">
    <header>
      <v-icon
        name="logo"
        :size="50"
        :fill="colorPrimary"
      />
      <span class="title">voicel</span>
    </header>
    <div class="connect-body">
      <v-button type="primary" @click="onConnectToRoom">
        Подключиться к конференции
      </v-button>
    </div>
  </div>
  <div v-show="isConnected" class="room">
    <header>
      <v-icon
        name="logo"
        :size="50"
        :fill="colorPrimary"
      />
      <span class="title">voicel</span>
    </header>
    <div class="room-body">
      <div class="room-content">
        <div ref="localVideoNode" class="local-video-node" />
        <div ref="remoteVideoNode" class="remote-video-node" />
      </div>
      <div class="room-actions">
        <v-button
          type="default"
          quaternary
          circle
          @click="!microActive ? onMicrophoneTurnOnButtonClickHandler() : () => {}"
        >
          <template #icon>
            <v-icon
              v-if="!microActive"
              name="micro-on"
              :size="28"
              :fill="colorPrimary"
            />
            <v-icon
              v-else
              name="micro-off"
              :size="28"
              :fill="colorPrimary"
            />
          </template>
        </v-button>
        <v-button
          type="default"
          quaternary
          circle
          @click="!cameraActive ? onWebCamTurnOnButtonClickHandler() : () => {}"
        >
          <template #icon>
            <v-icon
              v-if="!cameraActive"
              name="camera-on"
              :size="28"
              :fill="colorPrimary"
            />
            <v-icon
              v-else
              name="camera-off"
              :size="28"
              :fill="colorPrimary"
            />
          </template>
        </v-button>
        <v-button
          type="error"
          quaternary
          circle
          @click="() => {}"
        >
          <template #icon>
            <v-icon
              name="exit"
              :size="28"
            />
          </template>
        </v-button>
      </div>
    </div>

    <div ref="remoteAudioNode" class="remote-audio-node" />
  </div>
</template>

<style lang="scss" scoped>
header {
  display: flex;
  align-items: center;
  gap: 1rem;

  .title {
    color: var(--color-primary);
    font-size: 2.5rem;
    font-weight: 500;
  }
}

.connect {
  height: 100%;
  width: 100%;
  padding: 1.5rem 0.5rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  overflow-y: auto;

  .connect-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
}

.room {
  height: 100%;
  width: 100%;
  padding: 1.5rem 0.5rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  overflow-y: auto;

  .room-body {
    display: flex;
    flex-direction: column;
    height: 100%;

    .room-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 2rem;

      .local-video-node {
        display: flex;
        flex-wrap: wrap;

        :deep(video) {
          border-radius: 1rem;
          max-width: 400px;
        }
      }

      .remote-video-node {
        display: flex;
        flex-wrap: wrap;

        :deep(video) {
          border-radius: 1rem;
          max-width: 300px;
        }
      }
    }

    .room-actions {
      display: flex;
      margin: 0 auto;
      gap: 1rem;
      padding: 1rem 0;
    }
  }
}
</style>
