import { Device, types as MediasoupTypes } from 'mediasoup-client';

import { WebSocketProvider } from '@/utils/WebSocket';
import { Emitter } from '@/utils/shared/Emitter';

class WebRtc {
  public name: string;

  public localMediaNode: HTMLElement;

  public remoteVideoNode: HTMLElement;

  public remoteAudioNode: HTMLElement;

  public ws: WebSocketProvider;

  public roomId = '';

  public producerTransport: MediasoupTypes.Transport | undefined = undefined;

  public consumerTransport: MediasoupTypes.Transport | undefined = undefined;

  public consumers = new Map();

  public producers = new Map();

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
    console.log(room);
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
        console.error('Browser not supported');
        alert('Browser not supported');
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

  }

  async produce() {

  }

  async consume() {

  }

  async getConsumeStream(producerId: string) {

  }

  closeProducer(producerId: string) {

  }

  pauseProducer(producerId: string) {

  }

  resumeProducer(producerId: string) {

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
