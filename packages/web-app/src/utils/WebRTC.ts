import { Device, types as MediasoupTypes } from 'mediasoup-client';

import { WebSocketProvider } from '@/utils/WebSocket';
import { Emitter } from '@/utils/shared/Emitter';
import { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';

class WebRTC {
  public name: string;

  public localMediaNode: HTMLElement;

  public remoteVideoNode: HTMLElement;

  public remoteAudioNode: HTMLElement;

  public ws: WebSocketProvider;

  public roomId = '';

  public consumers = new Map();

  public producers = new Map();

  public device: Device | null = null;

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

  async bootstrap() {

  }

  async createRoom() {

  }

  async join() {
    const room = await this.ws.emitPromised('join');
    console.log(room);
    const data = await this.ws.emitPromised<MediasoupTypes.RtpCapabilities>('get-rtp-capabilities');
    if (!data.status) {
      throw new Error(data.errors as string);
    }

    this.device = await this.loadDevice(data.data);
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

  removeConsumer(consumerId: string){

  }

  exit() {
  }

  async getRoomInfo() {

  }


}
