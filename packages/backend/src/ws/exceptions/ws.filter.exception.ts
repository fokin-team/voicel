import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { pack } from 'msgpackr';

import { WebSocketEntity } from '../entities/ws.web-socket.entity';

import { WsFormatExceptionInterface } from '../interfaces/ws.format-exception.interface';

@Catch()
export class WsFilterException extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsFilterException.name);

  catch(exception: { error: WsFormatExceptionInterface, message: string }, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<WebSocketEntity>();

    this.logger.error(`Event: ${exception.error ? exception.error.event : 'unknown'}
    errors: ${exception.error ? JSON.stringify(exception.error.message) : exception.message}`);
    this.logger.error('-----------------------------------------');
    this.logger.error(JSON.stringify(exception));

    if (exception.error) {
      client.send(pack({
        event: exception.error.event,
        data: {
          status: false,
          errors: exception.error.message,
        },
      }));

      if (exception.error.isCloseWs && exception.error.code) {
        client.close(exception.error.code);
      }
    } else {
      client.send(pack({
        event: 'exception',
        data: {
          status: false,
          errors: exception.message,
        },
      }));
    }
  }
}
