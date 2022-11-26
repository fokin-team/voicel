import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { pack } from 'msgpackr';

import { WebSocketEntity } from './entities/ws.web-socket.entity';
import { WsStateValueInterface } from './interfaces/ws.state-value.interface';

@Injectable()
export class WsService {
  private readonly logger = new Logger(WsService.name);

  /**
   * 1-∞ — authorized users id
   * */
  private webSocketState = new Map<string, WsStateValueInterface[]>();

  public getConnectedWebSocketsByUserId(userId: string): WsStateValueInterface[] | undefined {
    const webSockets = this.webSocketState.get(userId);
    return webSockets;
  }

  public setConnectedWebSocketByUserId(userId: string, webSocket: WebSocketEntity): string {
    if (!this.webSocketState.has(userId)) {
      this.webSocketState.set(userId, []);
    }

    const id = randomUUID();

    this.webSocketState.get(userId).push({ id, client: webSocket });

    return id;
  }

  public emitToAllUserSessions(userId: string, data: unknown) {
    this.webSocketState.get(userId)?.forEach((connection) => {
      connection.client.send(pack(data));
    });
  }

  public deleteConnectedWebSocketByUserIdAndClientId(userId: string, clientId: string) {
    const connections = this.webSocketState.get(userId);

    if (connections) {
      const index = connections.findIndex((connection) => connection.id === clientId);

      if (index > -1) {
        const newConnections = connections.slice(index, 1);
        if (newConnections.length > 0) {
          this.webSocketState.set(userId, newConnections);
        } else {
          this.webSocketState.delete(userId);
        }

        return true;
      }
    }

    return false;
  }

  public sendEventByUserId(userId: string, data: unknown) {
    const connections = this.getConnectedWebSocketsByUserId(userId);
    if (connections) {
      connections.forEach((connection) => {
        connection.client.send(pack(data));
      });
    }
  }
}
