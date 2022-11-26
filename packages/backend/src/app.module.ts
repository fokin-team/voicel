import { Module } from '@nestjs/common';

import { WsModule } from '@/ws/ws.module';
import { ConfigModule } from '@nestjs/config';
import { ConnectionsModule } from './connections/connections.modules';

@Module({
  imports: [
    WsModule,
    ConfigModule.forRoot(),
    ConnectionsModule,
  ],
  controllers: [],
})
export class AppModule {}
