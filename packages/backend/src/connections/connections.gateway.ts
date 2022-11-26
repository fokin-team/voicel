import {WsService} from "@/ws/ws.service";
import {
  ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway,
} from '@nestjs/websockets';

import {createWorker} from 'mediasoup';

import { Peer } from "@/mediasoup/mediasoup.peer";
import { Room } from "@/mediasoup/mediasoup.room";

import { MessageMetaData } from "@/ws/ws.message-meta-data.decorator";
import { WebSocketEntity } from '@/ws/entities/ws.web-socket.entity';
import { ConfigService } from '@nestjs/config';

import { JoinDto } from "./dto/join.dto";
import { ProduceDto } from "./dto/produce-dto";
import { ConsumeDto } from "./dto/consume.dto";
import { ConnectTransportDto } from "./dto/connect-transport.dto";

import {EnvironmentVariables} from '../configuration';

import {nanoid} from 'nanoid';

@WebSocketGateway(8080, { cors: true })
export class ConnectionsGateway {
  constructor(
    private readonly wsService: WsService,
    private configService: ConfigService<EnvironmentVariables>
  ) {
    (async () => {
      let numWorkers = configService.get('MEDIASOUP_WORKERS_NUM');

      for (let i = 0; i < numWorkers; i++) {
        const worker = await createWorker({
          logLevel: configService.get('MEDIASOUP_WORKER_LOGLEVEL'),
          logTags: configService.get('MEDIASOUP_WORKER_LOGTAGS'),
          rtcMinPort: configService.get('MEDIASOUP_WORKER_RTC_MINPORT'),
          rtcMaxPort: configService.get('MEDIASOUP_WORKER_RTC_MAXPORT'),
        })

        worker.on('died', () => {
          console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid)
          setTimeout(() => process.exit(1), 2000)
        })
        this.workers.push(worker)
      }
    })();
  }

  private workers = [];
  private nextWorkerId = 0;

  private roomList = new Map();

  private getWorker() {
    const worker = this.workers[this.nextWorkerId];

    if (++this.nextWorkerId === this.workers.length) {
      this.nextWorkerId = 0;
    }

    return worker
  }

  @MessageMetaData('create-room')
  @SubscribeMessage('create-room')
  async createRoom() {
    const roomId = nanoid();

    if (this.roomList.has(roomId)) {
      throw new Error('Room already exists');
    } else {
      let worker = await this.getWorker();
      this.roomList.set(roomId, new Room(roomId, worker));

      return {
        roomId,
      };
    }
  }

  @MessageMetaData('join')
  @SubscribeMessage('join')
  async join(
    @MessageBody() body: JoinDto,
    @ConnectedSocket() client: WebSocketEntity,
  ) {
    if (!this.roomList.has(body.roomId)) {
      throw new Error('Room does not exist');
    }

    this.roomList.get(body.roomId).addPeer(new Peer(client.socketId, body.name))

    return this.roomList.get(body.roomId);
  }

  @MessageMetaData('get-room')
  @SubscribeMessage('get-room')
  async getRoomById(@MessageBody() body: JoinDto) {
    return this.roomList.get(body.roomId);
  }

  @MessageMetaData('produce')
  @SubscribeMessage('produce')
  async produce(
    @MessageBody() body: ProduceDto,
    @ConnectedSocket() client: WebSocketEntity,
  ) {
    if (!this.roomList.has(client.roomId)) {
      throw new Error('Room not found');
    }

    let producerId = await this.roomList.get(client.roomId).produce(client.socketId, body.producerTransportId, body.rtpParameters, body.kind);

    return {
      producerId
    };
  }

  @MessageMetaData('consume')
  @SubscribeMessage('consume')
  async consume(
    @MessageBody() body: ConsumeDto,
    @ConnectedSocket() client: WebSocketEntity,
  ) {
    let result = await this.roomList.get(client.roomId).consume(client.socketId, body.consumerTransportId, body.producerId, body.rtpCapabilities)
    return result;
  }

  async handleDisconnect(client: WebSocketEntity){
    if (!client.roomId) {
      return;
    }

    if (!this.roomList.has(client.roomId)) {
      throw new Error('Room not found');
    }

    await this.roomList.get(client.roomId).removePeer(client.socketId);
    if (this.roomList.get(client.roomId).getPeers().size === 0) {
      this.roomList.delete(client.roomId);
    }

    client.roomId = null;

    return {};
  }

  @MessageMetaData('get-producers')
  @SubscribeMessage('get-producers')
  async getProducers(
    @ConnectedSocket() client: WebSocketEntity,
  ) {
    if (!this.roomList.has(client.roomId)) return

    let producerList = this.roomList.get(client.roomId).getProducerListForPeer();

    return {
      items: producerList,
    };
  }

  @MessageMetaData('get-rtp-capabilities')
  @SubscribeMessage('get-rtp-capabilities')
  async getRtpCapabilities(@ConnectedSocket() client: WebSocketEntity) {
    try {
      return {
        items: this.roomList.get(client.roomId).getRtpCapabilities(),
      };
    } catch (e) {
      throw e;
    }
  }

  @MessageMetaData('create-rtc-transport')
  @SubscribeMessage('create-rtc-transport')
  async createRtcTransport(@ConnectedSocket() client: WebSocketEntity) {
    try {
      const { params } = await this.roomList.get(client.roomId).createWebRtcTransport(client.socketId);
      return params;
    } catch (e) {
      throw e;
    }
  }

  @MessageMetaData('connect-transport')
  @SubscribeMessage('connect-transport')
  async connectTransport(
    @MessageBody() body: ConnectTransportDto,
    @ConnectedSocket() client: WebSocketEntity
  ) {
    if (!this.roomList.has(client.roomId)) {
      return;
    }

    await this.roomList.get(client.roomId).connectPeerTransport(client.socketId, body.transportId, body.dtlsParameters);

    return {};
  }
}
