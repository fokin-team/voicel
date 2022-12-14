import { Device, types as MediasoupTypes } from 'mediasoup-client';

import { WebSocketProvider, WsResponseMessage } from '@/utils/WebSocket';
import { Emitter } from '@/utils/shared/Emitter';

enum MediaType {
  audio = 'audio',
  video = 'video',
  screen = 'screen',
}

export enum Events {
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

  public localMediaNode: HTMLElement | undefined;

  public remoteVideoNode: HTMLElement | undefined;

  public remoteAudioNode: HTMLElement | undefined;

  public ws: WebSocketProvider;

  private wsListeners = new Map<string, string>();

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
    ws: WebSocketProvider,
    name: string,
  ) {
    this.name = name;
    this.ws = ws;
  }

  async createRoom() {
    const createRoomResponse = await this.ws.emitPromised<{ roomId: string }>('create-room');
    if (!createRoomResponse.status) {
      throw new Error(`[createRoom] create room failed ${createRoomResponse.errors.toString()}`);
    }

    this.roomId = createRoomResponse.data.roomId;

    return this.roomId;
  }

  async join(
    roomId: string,
    localMediaNode: HTMLElement,
    remoteVideoNode: HTMLElement,
    remoteAudioNode: HTMLElement,
  ) {
    this.localMediaNode = localMediaNode;
    this.remoteVideoNode = remoteVideoNode;
    this.remoteAudioNode = remoteAudioNode;

    const responseJoinToRoom = await this.ws.emitPromised<{ id: string, peers: string }>('join', { roomId });
    if (!responseJoinToRoom.status) {
      throw new Error(`[join] join to room failed ${responseJoinToRoom.errors.toString()}`);
    }

    const responseRtpCapabilities = await this.ws
      .emitPromised<MediasoupTypes.RtpCapabilities>('get-rtp-capabilities');
    if (!responseRtpCapabilities.status) {
      throw new Error(`[join] get rtp capabilities failed ${responseRtpCapabilities.errors.toString()}`);
    }

    this.device = await this.loadDevice(responseRtpCapabilities.data);
  }

  async loadDevice(routerRtpCapabilities: MediasoupTypes.RtpCapabilities) {
    let device: Device;
    try {
      device = new Device();
      console.log(routerRtpCapabilities);
      await device.load({ routerRtpCapabilities });
      return device;
    } catch (e) {
      if ((e as MediasoupTypes.UnsupportedError)?.name === 'UnsupportedError') {
        throw new Error('[loadDevice] Browser not supported');
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
      throw new Error(`[initTransports]: create rtc transport ${responseCreateWebRtcProducerTransport
        .errors.toString()}`);
    }

    this.producerTransport = this.device?.createSendTransport(responseCreateWebRtcProducerTransport.data);

    this.producerTransport?.on('connect', async ({ dtlsParameters }, callback, errorCallback) => {
      const response = await this.ws.emitPromised('connect-transport', {
        dtlsParameters,
        transportId: this.producerTransport?.id,
      });

      if (!response.status) {
        errorCallback(new Error(response.errors as string));
        throw new Error(`[initTransports]: connect transport failed ${response.errors.toString()}`);
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
        throw new Error(`[initTransports]: produce failed ${response.errors.toString()}`);
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
      throw new Error(`[initTransports]: create rtc transport ${responseCreateWebRtcConsumerTransport
        .errors.toString()}`);
    }

    this.consumerTransport = this.device?.createRecvTransport(responseCreateWebRtcConsumerTransport.data);

    this.consumerTransport?.on('connect', async ({ dtlsParameters }, callback, errorCallback) => {
      const response = await this.ws.emitPromised('connect-transport', {
        dtlsParameters,
        transportId: this.consumerTransport?.id,
      });

      if (!response.status) {
        errorCallback(new Error(response.errors as string));
        throw new Error(`[initTransports]: connect transport failed ${response.errors?.toString()}`);
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
    const consumerClosedListenerId = this.ws.on('consumer-closed', (data: { consumerId: string }) => {
      console.log('[initSockets]: consumer-closed: ', data.consumerId);
    });

    this.wsListeners.set('consumer-closed', consumerClosedListenerId);

    const newProducersListenerId = this.ws
      .on('new-producers', (data: WsResponseMessage<{ items: { producerId: string }[] }>) => { // ???????????????? ???? ???????? event
        console.log('[initSockets]: new-producers: ', data);
        if (data.status) {
          data.data.items.forEach(async (producer) => {
            await this.consume(producer.producerId);
          });
        }
      });

    this.wsListeners.set('new-producers', newProducersListenerId);

    const disconnectListenerId = this.ws.on('disconnect', () => {
      console.log('[initSockets]: disconnect');
    });

    this.wsListeners.set('disconnect', disconnectListenerId);

    this.isOpen = true;
    this.ws.emit('get-producers');
  }

  async produce(mediaType: keyof typeof MediaType, deviceId: string | null = null) {
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

      let localMediaElement: HTMLVideoElement | undefined;

      if (!audio) {
        localMediaElement = document.createElement('video');
        localMediaElement.srcObject = stream;
        localMediaElement.id = producer.id;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        localMediaElement.playsinline = false;
        localMediaElement.autoplay = true;
        localMediaElement.className = 'vid';


        console.log(this.localMediaNode);
        this.localMediaNode?.appendChild(localMediaElement);
      }

      producer.on('trackended', () => {
        console.log('[produce] Producer track close');
        this.closeProducer(mediaType);
      });

      producer.on('transportclose', () => {
        console.log('[produce] Producer transport close');
        if (!audio && localMediaElement) {
          (localMediaElement.srcObject as MediaStream).getTracks().forEach((trackValue) => {
            trackValue.stop();
          });

          localMediaElement.parentNode?.removeChild(localMediaElement);
        }
        this.producers.delete(producer.id);
      });

      producer.on('@close', () => {
        console.log('[produce] Closing producer');
        if (!audio && localMediaElement) {
          (localMediaElement.srcObject as MediaStream).getTracks().forEach((trackValue) => {
            trackValue.stop();
          });

          localMediaElement.parentNode?.removeChild(localMediaElement);
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

  async consume(producerId: string) {
    const { consumer, stream, kind } = await this.getConsumeStream(producerId);

    this.consumers.set(consumer.id, consumer);

    let htmlNode;

    if (kind === 'video') {
      htmlNode = document.createElement('video');
      htmlNode.srcObject = stream;
      htmlNode.id = consumer.id;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      htmlNode.playsinline = false;
      htmlNode.autoplay = true;
      htmlNode.className = 'vid';
      this.remoteVideoNode?.appendChild(htmlNode);
      console.log('add video');
    } else if (kind === 'audio') {
      htmlNode = document.createElement('audio');
      htmlNode.srcObject = stream;
      htmlNode.id = consumer.id;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      htmlNode.playsinline = false;
      htmlNode.autoplay = true;
      console.log('add audio');
      console.log(this.remoteAudioNode);
      this.remoteAudioNode?.appendChild(htmlNode);
    }

    consumer.on('trackended', () => {
      console.log('[consume] Consumer track close');
      this.removeConsumer(consumer.id);
    });

    consumer.on('transportclose', () => {
      console.log('[consume] Consumer transport close');
      this.removeConsumer(consumer.id);
    });
  }

  async getConsumeStream(producerId: string) {
    if (typeof this.device === 'undefined') {
      throw new Error('[getConsumeStream] device is undefined');
    }
    const { rtpCapabilities } = this.device;

    const responseConsume = await this.ws.emitPromised<MediasoupTypes.ConsumerOptions>('consume', {
      rtpCapabilities,
      consumerTransportId: this.consumerTransport?.id,
      producerId,
    });

    if (!responseConsume.status) {
      throw new Error(`[getConsumeStream] get response consume options failed ${responseConsume.errors.toString()}`);
    }

    console.log('[getConsumeStream]: Consume thread: ', responseConsume.data);

    const { id, kind, rtpParameters } = responseConsume.data;

    const consumer = await this.consumerTransport?.consume({
      id,
      producerId,
      kind,
      rtpParameters,
      appData: {},
    });

    if (typeof consumer === 'undefined') {
      throw new Error('[getConsumeStream] consumer create failed');
    }

    const stream = new MediaStream();

    stream.addTrack(consumer.track);

    return {
      consumer,
      stream,
      kind,
    };
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
      const htmlNode = document.getElementById(producerId) as HTMLVideoElement;
      if (htmlNode) {
        (htmlNode.srcObject as MediaStream).getTracks().forEach((track) => {
          track.stop();
        });

        htmlNode.parentNode?.removeChild(htmlNode);
      }
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

  pauseProducer(mediaType: keyof typeof MediaType) {
    if (!this.producerLabel.has(mediaType)) {
      throw new Error(`[pauseProducer] producer with type ${mediaType} not exists`);
    }

    const producerId = this.producerLabel.get(mediaType) as string;

    console.log('[pauseProducer] pause producer', producerId);

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
    if (!this.consumers.has(consumerId)) {
      throw new Error(`[removeConsumer] producer with type ${consumerId} not exists`);
    }

    const htmlNode = document.getElementById(consumerId) as HTMLVideoElement;
    if (htmlNode) {
      (htmlNode.srcObject as MediaStream).getTracks().forEach((track) => {
        track.stop();
      });

      htmlNode.parentNode?.removeChild(htmlNode);
    }

    this.consumers.delete(consumerId);
  }

  async exit(offline = false) {
    const clean = () => {
      this.isOpen = false;
      this.consumerTransport?.close();
      this.producerTransport?.close();

      const consumerClosedListenerId = this.wsListeners.get('consumer-closed');
      const newProducersListenerId = this.wsListeners.get('new-producers');
      const disconnectListenerId = this.wsListeners.get('disconnect');

      if (typeof consumerClosedListenerId !== 'undefined') {
        this.ws.removeOn('consumer-closed', consumerClosedListenerId);
      } else {
        console.warn('[exit] consumer-closed listener is not exist');
      }

      if (typeof newProducersListenerId !== 'undefined') {
        this.ws.removeOn('new-producers', newProducersListenerId);
      } else {
        console.warn('[exit] new-producers listener is not exist');
      }

      if (typeof disconnectListenerId !== 'undefined') {
        this.ws.removeOn('disconnect', disconnectListenerId);
      } else {
        console.warn('[exit] disconnect listener is not exist');
      }
    };

    if (!offline) {
      const responseExitRoom = await this.ws.emitPromised('exit-room');
      if (!responseExitRoom.status) {
        throw new Error(`[exit] exit room failed ${responseExitRoom.errors as string}`);
      }
      clean();
    } else {
      clean();
    }

    this.emitter.emit(Events.exitRoom);
  }

  getRoomInfo() {
    return '?????????? ??????????! ???????????';
  }
}

export {
  WebRtc,
};
