import { Device, types as MediasoupTypes } from 'mediasoup-client';

import { WebSocketProvider } from '@/utils/WebSocket';
import { Emitter } from '@/utils/shared/Emitter';

enum MediaType {
  audio = 'audio',
  video = 'video',
  screen = 'screen',
}

enum Events {
  exitRoom = 'exit-room',
  openRoom = 'open-room',
  startVideo = 'start-video',
  stopVideo = 'stop-video',
  startAudio = 'start-audio',
  stopAudio = 'stop-audio',
  startScreen = 'start-screen',
  stopScreen = 'stop-screen',
}

class WebRtc {
  public name: string;

  public localMediaNode: HTMLElement;

  public remoteVideoNode: HTMLElement;

  public remoteAudioNode: HTMLElement;

  public ws: WebSocketProvider;

  public roomId = '';

  public producerTransport: MediasoupTypes.Transport | undefined = undefined;

  public consumerTransport: MediasoupTypes.Transport | undefined = undefined;

  public consumers = new Map<string, MediasoupTypes.Consumer>();

  public producers = new Map<string, MediasoupTypes.Producer>();

  public producerLabel = new Map<string, string>();

  public device: Device | undefined = undefined;

  public isOpen = false;

  public emitter = new Emitter();

  constructor(
    localMediaNode: HTMLElement,
    remoteVideoNode: HTMLElement,
    remoteAudioNode: HTMLElement,
    ws: WebSocketProvider,
    name: string,
  ) {
    this.name = name;
    this.localMediaNode = localMediaNode;
    this.remoteVideoNode = remoteVideoNode;
    this.remoteAudioNode = remoteAudioNode;
    this.ws = ws;
  }

  async createRoom() {
    const createRoomResponse = await this.ws.emitPromised<{ roomId: string }>('create-room');
    if (!createRoomResponse.status) {
      throw new Error(createRoomResponse.errors as string);
    }

    this.roomId = createRoomResponse.data.roomId;

    return this.roomId;
  }

  async join(roomId: string) {
    const room = await this.ws.emitPromised('join', { roomId });
    const responseRtpCapabilities = await this.ws.emitPromised<MediasoupTypes.RtpCapabilities>('get-rtp-capabilities');
    if (!responseRtpCapabilities.status) {
      throw new Error(responseRtpCapabilities.errors as string);
    }

    this.device = await this.loadDevice(responseRtpCapabilities.data);
  }

  async loadDevice(routerRtpCapabilities: MediasoupTypes.RtpCapabilities) {
    let device: Device;
    try {
      device = new Device();
      await device.load({ routerRtpCapabilities });
      return device;
    } catch (e) {
      if ((e as MediasoupTypes.UnsupportedError)?.name === 'UnsupportedError') {
        console.error('[loadDevice] Browser not supported');
      }

      throw new Error((e as MediasoupTypes.UnsupportedError).message);
    }
  }

  async initTransports() {
    const responseCreateWebRtcProducerTransport = await this.ws
      .emitPromised<MediasoupTypes.TransportOptions>('create-rtc-transport', {
      forceTcp: false,
      rtpCapabilities: this.device?.rtpCapabilities,
    });

    if (!responseCreateWebRtcProducerTransport.status) {
      throw new Error(responseCreateWebRtcProducerTransport.errors as string);
    }

    this.producerTransport = this.device?.createSendTransport(responseCreateWebRtcProducerTransport.data);

    this.producerTransport?.on('connect', async ({ dtlsParameters }, callback, errorCallback) => {
      const response = await this.ws.emitPromised('connect-transport', {
        dtlsParameters,
        transportId: this.producerTransport?.id,
      });

      if (!response.status) {
        errorCallback(new Error(response.errors as string));
        throw new Error(response.errors as string);
      }

      callback();
    });

    this.producerTransport?.on('produce', async ({ kind, rtpParameters }, callback, errorCallback) => {
      const response = await this.ws.emitPromised<{ producerId: string }>('produce', {
        producerTransportId: this.producerTransport?.id,
        kind,
        rtpParameters,
      });

      if (!response.status) {
        errorCallback(new Error(response.errors as string));
        throw new Error(response.errors as string);
      }

      callback({ id: response.data.producerId });
    });

    this.producerTransport?.on('connectionstatechange', (state) => {
      switch (state) {
        case 'connecting':
          break;

        case 'connected':
          break;

        case 'failed':
          this.producerTransport?.close();
          break;

        default:
          break;
      }
    });

    const responseCreateWebRtcConsumerTransport = await this.ws
      .emitPromised<MediasoupTypes.TransportOptions>('create-rtc-transport', {
      forceTcp: false,
    });

    if (!responseCreateWebRtcConsumerTransport.status) {
      throw new Error(responseCreateWebRtcConsumerTransport.errors as string);
    }

    this.consumerTransport = this.device?.createRecvTransport(responseCreateWebRtcConsumerTransport.data);

    this.consumerTransport?.on('connect', async ({ dtlsParameters }, callback, errorCallback) => {
      const response = await this.ws.emitPromised('connect-transport', {
        dtlsParameters,
        transportId: this.consumerTransport?.id,
      });

      if (!response.status) {
        errorCallback(new Error(response.errors as string));
        throw new Error(response.errors as string);
      }

      callback();
    });

    this.consumerTransport?.on('connectionstatechange', (state) => {
      switch (state) {
        case 'connecting':
          break;

        case 'connected':
          break;

        case 'failed':
          this.consumerTransport?.close();
          break;

        default:
          break;
      }
    });
  }

  initSockets() {
    this.ws.on('consumer-closed', (data: { consumerId: string }) => {
      console.log('[initSockets]: consumer-closed: ', data.consumerId);
    });

    this.ws.on('new-producers', (data: unknown) => {
      console.log('[initSockets]: new-producers: ', data);
    });

    this.ws.on('disconnect', () => {
      console.log('[initSockets]: disconnect');
    });

    this.isOpen = true;
  }

  async produce(mediaType: keyof typeof MediaType, deviceId = null) {
    let mediaConstraints = {};
    let audio = false;
    let screen = false;

    switch (mediaType) {
      case MediaType.audio:
        mediaConstraints = {
          audio: {
            deviceId,
          },
          video: false,
        };
        audio = true;
        break;
      case MediaType.video:
        mediaConstraints = {
          audio: false,
          video: {
            width: {
              min: 640,
              ideal: 1920,
            },
            height: {
              min: 400,
              ideal: 1080,
            },
            deviceId,
          },
        };
        break;
      case MediaType.screen:
        mediaConstraints = false;
        screen = true;
        break;
      default:
    }

    if (!this.device?.canProduce('video') && !audio) {
      throw new Error('[produce] Cannot produce video');
    }

    if (this.producerLabel.has(mediaType)) {
      throw new Error(`[produce] Producer already exists for this type ${mediaType}`);
    }

    console.log('[produce] Mediacontraints:', mediaConstraints);

    let stream: MediaStream;

    try {
      stream = screen
        ? await navigator.mediaDevices.getDisplayMedia()
        : await navigator.mediaDevices.getUserMedia(mediaConstraints);

      const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

      const params: MediasoupTypes.ProducerOptions = {
        track,
      };

      if (!audio && !screen) {
        params.encodings = [
          {
            rid: 'r0',
            maxBitrate: 100000,
            // scaleResolutionDownBy: 10.0,
            scalabilityMode: 'S1T3',
          },
          {
            rid: 'r1',
            maxBitrate: 300000,
            scalabilityMode: 'S1T3',
          },
          {
            rid: 'r2',
            maxBitrate: 900000,
            scalabilityMode: 'S1T3',
          },
        ];
        params.codecOptions = {
          videoGoogleStartBitrate: 1000,
        };
      }

      const producer = await this.producerTransport?.produce(params);

      if (typeof producer === 'undefined') {
        throw new Error('[produce] error producer create');
      }

      console.log('[produce] Producer', producer);

      this.producers.set(producer.id, producer);

      let localMediaElement: HTMLElement | undefined;

      if (!audio) {
        localMediaElement = document.createElement('video');
      }

      producer.on('trackended', () => {
        this.closeProducer(mediaType);
      });

      producer.on('transportclose', () => {
        console.log('[produce] Producer transport close');
        if (!audio) {
          // TODO: delete media element;
        }
        this.producers.delete(producer.id);
      });

      producer.on('@close', () => {
        console.log('[produce] Closing producer');
        if (!audio) {
          // TODO: delete media element;
        }
        this.producers.delete(producer.id);
      });

      this.producerLabel.set(mediaType, producer.id);

      switch (mediaType) {
        case MediaType.audio:
          this.emitter.emit(Events.startAudio);
          break;
        case MediaType.video:
          this.emitter.emit(Events.startVideo);
          break;
        case MediaType.screen:
          this.emitter.emit(Events.startScreen);
          break;
        default:
          break;
      }
    } catch (e) {
      throw new Error(e as string);
    }
  }

  async consume() {

  }

  async getConsumeStream(producerId: string) {

  }

  closeProducer(mediaType: keyof typeof MediaType) {
    if (!this.producerLabel.has(mediaType)) {
      throw new Error(`[closeProducer] producer with type ${mediaType} not exists`);
    }

    const producerId = this.producerLabel.get(mediaType) as string;

    console.log('[closeProducer] Close producer', producerId);

    this.ws.emit('producer-closed', {
      producerId,
    });

    this.producers.get(producerId)?.close();
    this.producers.delete(producerId);
    this.producerLabel.delete(mediaType);

    if (mediaType !== MediaType.audio) {
      // TODO: delete media element;
    }

    switch (mediaType) {
      case MediaType.audio:
        this.emitter.emit(Events.stopAudio);
        break;
      case MediaType.video:
        this.emitter.emit(Events.stopVideo);
        break;
      case MediaType.screen:
        this.emitter.emit(Events.stopScreen);
        break;
      default:
        break;
    }
  }

  c(mediaType: keyof typeof MediaType) {
    if (!this.producerLabel.has(mediaType)) {
      throw new Error(`[pauseProducer] producer with type ${mediaType} not exists`);
    }

    const producerId = this.producerLabel.get(mediaType) as string;

    console.log('[resumeProducer] pause producer', producerId);

    this.producers.get(producerId)?.pause();
  }

  resumeProducer(mediaType: keyof typeof MediaType) {
    if (!this.producerLabel.has(mediaType)) {
      throw new Error(`[resumeProducer] producer with type ${mediaType} not exists`);
    }

    const producerId = this.producerLabel.get(mediaType) as string;

    console.log('[resumeProducer] pause producer', producerId);

    this.producers.get(producerId)?.resume();
  }

  removeConsumer(consumerId: string) {

  }

  exit() {
  }

  async getRoomInfo() {

  }
}

export {
  WebRtc,
};
