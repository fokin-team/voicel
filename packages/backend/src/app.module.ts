import { Module } from '@nestjs/common';

import { WsModule } from '@/ws/ws.module';

@Module({
  imports: [
    WsModule,
  ],
  controllers: [],
})
export class AppModule {}
