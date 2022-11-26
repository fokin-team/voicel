import { WsException } from '@nestjs/websockets';
import { WsFormatExceptionInterface } from '@/ws/interfaces/ws.format-exception.interface';

export class WsFormatException extends WsException {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(exception: WsFormatExceptionInterface | string | string[]) {
    super(exception);
  }
}
