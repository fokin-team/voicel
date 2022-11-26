import { Module } from '@nestjs/common';
import { WsService } from './ws.service';

@Module({
  imports: [],
  providers: [WsService],
  exports: [WsService],
})
export class WsModule {}
