import { Module } from '@nestjs/common';

import { WsModule } from '@/ws/ws.module';
import { ConfigModule } from '@nestjs/config';
import { ConnectionsGateway } from './connections.gateway';

@Module({
  imports: [WsModule, ConfigModule],
  providers: [ConnectionsGateway],
})
export class ConnectionsModule {}
