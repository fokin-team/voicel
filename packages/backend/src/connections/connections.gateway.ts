import { WsService } from '@/ws/ws.service';
import {
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway,
} from '@nestjs/websockets';

import { UseFilters } from '@nestjs/common';

import { WsResponse } from '@/ws/interfaces/ws.response.interface';
import { WsFormatException } from '@/ws/exceptions/ws.format.exception';
import { WsFilterException } from '@/ws/exceptions/ws.filter.exception';

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
import { ProducerClosedDto } from './dto/producer-сlosed.dto';

import { config } from '../mediasoup/mediasoup.config';

// @UseFilters(WsFilterException)
@WebSocketGateway(8080, { cors: true })
export class ConnectionsGateway implements OnGatewayDisconnect {
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

        // Each mediasoup Worker will run its own WebRtcServer, so those cannot
        // share the same listening ports. Hence we increase the value in config.js
        // for each Worker.
        const webRtcServerOptions = JSON.parse(JSON.stringify(config.mediasoup.webRtcServerOptions));
        const portIncrement = this.workers.length - 1;

        for (const listenInfo of webRtcServerOptions.listenInfos) {
          listenInfo.port += portIncrement;
        }

        const webRtcServer = await worker.createWebRtcServer(webRtcServerOptions);

        worker.appData.webRtcServer = webRtcServer;

        setInterval(async () => {
          const usage = await worker.getResourceUsage();

          console.log('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
        }, 120000);
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
      throw new WsFormatException({
        event: 'create-room',
        message: 'Room already exists'
      });
    } else {
      let worker = await this.getWorker();

      const result = {
        single: (socketId, data) => {
          this.wsService.sendEventBySocketId(roomId, socketId, data);
        },
        all: (data) => {
          this.wsService.emitToAllRoomSessions(roomId, data);
        },
      };

      this.roomList.set(roomId, new Room(roomId, worker, result));

      return {
        event: 'create-room',
        data: {
          status: true,
          data: {
            roomId,
          }
        },
      };
    }
  }

  @MessageMetaData('producer-сlosed')
  @SubscribeMessage('producer-сlosed')
  async producerClosed(
    @MessageBody() body: ProducerClosedDto,
    @ConnectedSocket() client: WebSocketEntity,
  ): Promise<WsResponse<void>> {
    this.roomList.get(client.roomId).closeProducer(client.socketId, body.producerId);

    return {
      event: 'producer-сlosed',
      data: undefined,
    };
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
      throw new WsFormatException('Room does not exist');
    }

    client.roomId = body.roomId;
    client.socketId = this.wsService.setConnectedWebSocketByRoomId(body.roomId, client);

    this.roomList.get(body.roomId).addPeer(new Peer(client.socketId, body.name));

    return {
      event: 'join',
      data: {
        status: true,
        data: this.roomList.get(body.roomId).toJson()
      },
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
      data: {
        status: true,
        data: this.roomList.get(body.roomId).toJson(),
      },
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
      throw new WsFormatException({
        event: 'produce',
        message: 'Room not found'
      });
    }

    const producerId = await this.roomList.get(client.roomId).produce(client.socketId, body.producerTransportId, body.rtpParameters, body.kind);

    this.wsService.emitToAllRoomSessions(client.roomId, {
      event: 'new-producers',
      data: {
        status: true,
        data: {
          items: [{ producerId: producerId }],
        }
      },
    }, {
      except: client.socketId,
    });

    return {
      event: 'produce',
      data: {
        status: true,
        data: {
          producerId: producerId as any,
        }
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
      data: {
        status: true,
        data: result,
      },
    };
  }

  async handleDisconnect(client: WebSocketEntity) {
    if (!client.roomId) {
      return;
    }

    if (!this.roomList.has(client.roomId)) {
      return;
    }

    await this.roomList.get(client.roomId).removePeer(client.socketId);
    if (this.roomList.get(client.roomId).getPeers().size === 0) {
      this.roomList.delete(client.roomId);
    }

    client.roomId = null;
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
      event: 'new-producers',
      data: {
        status: true,
        data: {
          items: producerList,
        },
      },
    };
  }

  @MessageMetaData('get-rtp-capabilities')
  @SubscribeMessage('get-rtp-capabilities')
  async getRtpCapabilities(@ConnectedSocket() client: WebSocketEntity): Promise<WsResponse<any>> {
    try {
      return {
        event: 'get-rtp-capabilities',
        data: {
          status: true,
          data: this.roomList.get(client.roomId).getRtpCapabilities(),
        },
      };
    } catch (e) {
      throw new WsFormatException({
        event: 'get-rtp-capabilities',
        message: e.toString(),
      });
    }
  }

  @MessageMetaData('create-rtc-transport')
  @SubscribeMessage('create-rtc-transport')
  async createRtcTransport(@ConnectedSocket() client: WebSocketEntity): Promise<WsResponse<any>> {
    try {
      const { params } = await this.roomList.get(client.roomId).createWebRtcTransport(client.socketId);
      return {
        event: 'create-rtc-transport',
        data: {
          status: true,
          data: params,
        },
      };
    } catch (e) {
      throw new WsFormatException({
        event: 'create-rtc-transport',
        message: e.toString(),
      });
    }
  }

  @MessageMetaData('connect-transport')
  @SubscribeMessage('connect-transport')
  async connectTransport(
    @MessageBody() body: ConnectTransportDto,
    @ConnectedSocket() client: WebSocketEntity,
  ): Promise<WsResponse<void>> {
    if (!this.roomList.has(client.roomId)) {
      return;
    }

    await this.roomList.get(client.roomId).connectPeerTransport(client.socketId, body.transportId, body.dtlsParameters);

    return {
      event: 'connect-transport',
      data: {
        status: true,
        data: undefined,
      },
    };
  }
}
