import { Module } from '@nestjs/common';
import { WsService } from './ws.service';

declare module 'ws' {
  interface WebSocketEntity {
    send(data: any, cb?: (err?: Error) => void): void;
  }
}

@Module({
  imports: [],
  providers: [WsService],
  exports: [WsService],
})
export class WsModule {}
