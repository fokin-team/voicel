import { WebSocket } from 'ws';

export class WebSocketEntity extends WebSocket {
  public botId?: string;

  public userId?: string;

  public socketId?: string;

  public tokenAccess?: string;

  public remoteAddress: string;
}
