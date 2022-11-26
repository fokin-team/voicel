import * as fs from 'fs';

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger } from '@nestjs/common';
import { WsAdapter } from '@/ws-adapter/ws-adapter.adapter';

import { AppModule } from './app.module';

async function bootstrap() {
  const httpsOptions = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined ? {
    key: fs.readFileSync(`${process.cwd()}/tools/mkcert/key.pem`),
    cert: fs.readFileSync(`${process.cwd()}/tools/mkcert/cert.pem`),
  } : undefined;

  Logger.log(`Process ENV: ${process.env.NODE_ENV}`, 'ENV');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      https: httpsOptions,
    }),
  );

  app.enableCors();

  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(3000, '0.0.0.0');
}

// eslint-disable-next-line no-void
void bootstrap();
