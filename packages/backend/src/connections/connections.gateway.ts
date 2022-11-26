import { WsService } from '@/ws/ws.service';
import {
  ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WsResponse,
} from '@nestjs/websockets';

import { createWorker } from 'mediasoup';

import { Peer } from '@/mediasoup/mediasoup.peer';
import { Room } from '@/mediasoup/mediasoup.room';

import { MessageMetaData } from '@/ws/ws.message-meta-data.decorator';
import { WebSocketEntity } from '@/ws/entities/ws.web-socket.entity';
import { ConfigService } from '@nestjs/config';

import { cpus } from 'os';
import { nanoid } from 'nanoid';
import { JoinDto } from './dto/join.dto';
import { ProduceDto } from './dto/produce-dto';
import { ConsumeDto } from './dto/consume.dto';
import { ConnectTransportDto } from './dto/connect-transport.dto';

import { EnvironmentVariables } from '../configuration';

@WebSocketGateway(8080, { cors: true })
export class ConnectionsGateway {
  constructor(
    private readonly wsService: WsService,
    private configService: ConfigService<EnvironmentVariables>,
  ) {
    (async () => {
      const numWorkers = configService.get('MEDIASOUP_WORKERS_NUM', { infer: true }) || Object.keys(cpus()).length;

      for (let i = 0; i < numWorkers; i++) {
        const worker = await createWorker({
          logLevel: configService.get('MEDIASOUP_WORKER_LOGLEVEL', { infer: true }) || 'warn',
          logTags: [
            'info',
            'ice',
            'dtls',
            'rtp',
            'srtp',
            'rtcp',
          ],
          rtcMinPort: configService.get('MEDIASOUP_WORKER_RTC_MINPORT', { infer: true }) || 10000,
          rtcMaxPort: configService.get('MEDIASOUP_WORKER_RTC_MAXPORT', { infer: true }) || 10100,
        });

        worker.on('died', () => {
          console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
          setTimeout(() => process.exit(1), 2000);
        });
        this.workers.push(worker);
      }
    })();
  }

  private workers = [];

  private nextWorkerId = 0;

  private roomList = new Map<string, Room>();

  private getWorker() {
    const worker = this.workers[this.nextWorkerId];

    if (++this.nextWorkerId === this.workers.length) {
      this.nextWorkerId = 0;
    }

    return worker;
  }

  @MessageMetaData('create-room')
  @SubscribeMessage('create-room')
  async createRoom(): Promise<WsResponse<{ roomId: string; }>> {
    const roomId = nanoid();

    if (this.roomList.has(roomId)) {
      throw new Error('Room already exists');
    } else {
      const worker = await this.getWorker();
      this.roomList.set(roomId, new Room(roomId, worker));

      return {
        event: 'create-room',
        data: {
          roomId,
        },
      };
    }
  }

  @MessageMetaData('join')
  @SubscribeMessage('join')
  async join(
    @MessageBody() body: JoinDto,
      @ConnectedSocket() client: WebSocketEntity,
  ): Promise<WsResponse<{
        id: string;
        peers: string;
      }>> {
    if (!this.roomList.has(body.roomId)) {
      throw new Error('Room does not exist');
    }

    this.roomList.get(body.roomId).addPeer(new Peer(client.socketId, body.name));

    return {
      event: 'join',
      data: this.roomList.get(body.roomId).toJson(),
    };
  }

  @MessageMetaData('get-room')
  @SubscribeMessage('get-room')
  async getRoomById(@MessageBody() body: JoinDto): Promise<WsResponse<{
    id: string;
    peers: string;
  }>> {
    return {
      event: 'get-room',
      data: this.roomList.get(body.roomId).toJson(),
    };
  }

  @MessageMetaData('produce')
  @SubscribeMessage('produce')
  async produce(
    @MessageBody() body: ProduceDto,
      @ConnectedSocket() client: WebSocketEntity,
  ): Promise<WsResponse<{
        producerId: string;
      }>> {
    if (!this.roomList.has(client.roomId)) {
      throw new Error('Room not found');
    }

    const producerId = await this.roomList.get(client.roomId).produce(client.socketId, body.producerTransportId, body.rtpParameters, body.kind);

    return {
      event: 'produce',
      data: {
        producerId: producerId as any,
      },
    };
  }

  @MessageMetaData('consume')
  @SubscribeMessage('consume')
  async consume(
    @MessageBody() body: ConsumeDto,
      @ConnectedSocket() client: WebSocketEntity,
  ): Promise<WsResponse<{
        producerId: string;
        id: any;
        kind: any;
        rtpParameters: any;
        type: any;
        producerPaused: any;
      }>> {
    const result = await this.roomList.get(client.roomId).consume(client.socketId, body.consumerTransportId, body.producerId, body.rtpCapabilities);
    return {
      event: 'consume',
      data: result,
    };
  }

  async handleDisconnect(client: WebSocketEntity) {
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
  ): Promise<WsResponse<{
        items: any[];
      }>> {
    if (!this.roomList.has(client.roomId)) return;

    const producerList = this.roomList.get(client.roomId).getProducerListForPeer();

    return {
      event: 'get-producers',
      data: {
        items: producerList,
      },
    };
  }

  @MessageMetaData('get-rtp-capabilities')
  @SubscribeMessage('get-rtp-capabilities')
  async getRtpCapabilities(@ConnectedSocket() client: WebSocketEntity): Promise<WsResponse<any>> {
    try {
      return {
        event: 'get-rtp-capabilities',
        data: this.roomList.get(client.roomId).getRtpCapabilities(),
      };
    } catch (e) {
      throw e;
    }
  }

  @MessageMetaData('create-rtc-transport')
  @SubscribeMessage('create-rtc-transport')
  async createRtcTransport(@ConnectedSocket() client: WebSocketEntity): Promise<WsResponse<any>> {
    try {
      const { params } = await this.roomList.get(client.roomId).createWebRtcTransport(client.socketId);
      return {
        event: 'create-rtc-transport',
        data: params,
      };
    } catch (e) {
      throw e;
    }
  }

  @MessageMetaData('connect-transport')
  @SubscribeMessage('connect-transport')
  async connectTransport(
  @MessageBody() body: ConnectTransportDto,
    @ConnectedSocket() client: WebSocketEntity,
  ) {
    if (!this.roomList.has(client.roomId)) {
      return;
    }

    await this.roomList.get(client.roomId).connectPeerTransport(client.socketId, body.transportId, body.dtlsParameters);

    return {
      event: 'connect-transport',
      data: {},
    };
  }
}
