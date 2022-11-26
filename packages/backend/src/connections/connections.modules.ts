import { Module } from '@nestjs/common';

import { WsModule } from '@/ws/ws.module';
import { ConnectionsGateway } from "./connections.gateway";
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [WsModule, ConfigModule],
    providers: [ConnectionsGateway],
})
export class ConnectionsModule {}
  