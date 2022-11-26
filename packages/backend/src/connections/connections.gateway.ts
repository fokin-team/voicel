import {WsService} from "@/ws/ws.service";
import {
  ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway,
} from '@nestjs/websockets';

import {createWorker} from 'mediasoup';

import {MessageMetaData} from "@/ws/ws.message-meta-data.decorator";
import { WsFilterException } from "@/ws/exceptions/ws.filter.exception";
import {ConfigService} from '@nestjs/config';

import {CreateRoomDto} from './dto/create-room.dto';

import {EnvironmentVariables} from '../configuration';

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
  async createRoom(@MessageBody() body: CreateRoomDto) {
    if (this.roomList.has(body.roomId)) {
      throw new WsFormatException();
    } else {
      let worker = await this.getWorker();
      this.roomList.set(body.roomId, new Room(body.roomId, worker))
      
      return {
        roomId: body.roomId,
      };
    }
  }
}
