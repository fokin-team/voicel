import { Module } from '@nestjs/common';

import { WsModule } from '@/ws/ws.module';
import { ConnectionsGateway } from "./connections.gateway";
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [WsModule, ConfigService],
    providers: [ConnectionsGateway],
})
export class ConnectionsModule {}
  