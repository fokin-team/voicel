import { Module } from '@nestjs/common';

import { WsModule } from '@/ws/ws.module';
import { ConnectionsGateway } from "./connections.gateway";

@Module({
    imports: [WsModule],
    providers: [ConnectionsGateway],
})
export class ConnectionsModule {}
  