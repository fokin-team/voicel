import { pack, unpack } from 'msgpackr';

import { Emitter } from '@/utils/shared/Emitter';

export type WebSocketOptions = {
  format: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  protocol?: string;
  binaryType?: BinaryType;
};

export type WsMessageBody<T = unknown> = {
  event?: string;
  data: WsResponseMessage<T>;
};

export type WsResponseMessage<T = unknown> = {
  status: true;
  data: T;
} | {
  status: false;
  errors: string | WsFormatExceptionErrors;
};

export type WsFormatExceptionErrors = {
  key: string;
  values: Array<string>;
};

export type EmitPromisedOptions = {
  timeout?: number;
};

type WebSocketCall = {
  event: string;
  data: unknown;
};

export class WebSocketProvider {
  private readonly format: string; // Data transmission format

  private readonly connectionUrl: string; // Connection url

  private readonly options: WebSocketOptions; // Custom parameters that the caller can pass in

  public isTryReconnect: boolean; //  Whether to enable reconnection

  public reconnectionAttempts: number; // Maximum number of reconnections

  public reconnectionDelay: number; // Reconnection interval

  // public isAuthorized = false;

  private isConnected = false;

  private reconnectionCount = 0; // Reconnected times

  public ws: WebSocket | undefined; // Websocket connection

  private emitter = new Emitter();

  private callStack: WebSocketCall[] = [];

  private requestTimeout = 3000;

  private eventsWithoutGuards: string[] = [];

  /**
   * Observer mode, websocket service core function package
   * @param connectionUrl url
   * @param options other configuration items
   */
  constructor(connectionUrl: string, options: WebSocketOptions = { format: '' }) {
    this.format = options.format;

    this.connectionUrl = connectionUrl;
    this.options = options;

    this.isTryReconnect = this.options.reconnection ?? true;
    this.reconnectionAttempts = this.options.reconnectionAttempts ?? 5;
    this.reconnectionDelay = this.options.reconnectionDelay ?? 3000;
  }

  /**
   * Add event listener
   * @param label Event name
   * @param callback Callback
   * @return {number}
   */
  on<T>(label: string, callback: (arg: T) => void): string {
    return this.emitter.addListener(label, callback);
  }

  /**
   * Remove event listener
   * @param label Event name
   * @param id Event id
   * @return {boolean}
   */
  removeOn(label: string, id: string): boolean {
    return this.emitter.removeListener(label, id);
  }

  private static isValidStatusCode(code: number) {
    return (
      (code >= 1000
        && code <= 1014
        && code !== 1004
        && code !== 1005
        && code !== 1006)
      || (code >= 3000 && code <= 4999)
    );
  }

  /**
   * Emit local event
   * @param event Event name
   * @param data parameter
   * @return {boolean}
   */
  emitLocal(event: string, data?: unknown): void {
    this.emitter.emit(event, data);
  }

  private checkingEventAccess = (eventName: string) => {
    if (this.eventsWithoutGuards.includes(eventName)) {
      return true;
    }

    return true;
    // return this.isAuthorized;
  };

  private bootstrap(): boolean {
    this.ws = this.options.protocol ? new WebSocket(this.connectionUrl)
      : new WebSocket(this.connectionUrl, this.options.protocol);
    this.ws.binaryType = this.options.binaryType ?? 'arraybuffer';
    this.onEvent();

    return true;
  }

  private reconnect(): void {
    if (this.reconnectionCount < this.reconnectionAttempts) {
      const intervalId = window.setInterval(() => {
        if (this.reconnectionCount < this.reconnectionAttempts) {
          if (this.bootstrap()) {
            window.clearInterval(intervalId);
          }
        } else {
          window.clearInterval(intervalId);
        }
        this.reconnectionCount += 1;
      }, this.reconnectionDelay);
    }
  }

  public connect(): void {
    if (!this.isConnected) {
      if (!this.bootstrap()) {
        this.reconnect();
      }
    }
  }

  public close(): void {
    if (this.ws?.readyState === 1) {
      this.ws.close(1000);
    }
  }

  private onEvent(): void {
    if (this.ws) {
      this.ws.onopen = (ev) => {
        this.isConnected = true;
        this.emitter.emit('open', ev);
        this.reconnectionCount = 0;
        // if (this.callStack.length > 0 && this.isAuthorized) {
        if (this.callStack.length > 0) {
          this.callStack.forEach((call) => {
            this.emit(call.event, call.data);
          });
        } else {
          const authListener = this.on('authorizationComplete', () => {
            this.removeOn('authorizationComplete', authListener);
            this.callStack.forEach((call) => {
              this.emit(call.event, call.data);
            });
          });
        }
      };

      this.ws.onmessage = (ev) => {
        const body = unpack(new Uint8Array(ev.data as ArrayBuffer)) as WsMessageBody;
        const event = body.event ?? 'message';
        this.emitter.emit(event, body.data);
      };

      this.ws.onclose = (ev) => {
        this.isConnected = false;
        // this.isAuthorized = false;
        this.emitter.emit('close', ev);
        if (this.isTryReconnect && !WebSocketProvider.isValidStatusCode(ev.code)) {
          this.reconnect();
        }
      };

      this.ws.onerror = (ev) => {
        this.emitter.emit('error', ev);
      };
    }
  }

  /**
   * Emit event
   * @param event Event name
   * @param data parameter
   * @return {boolean}
   */
  emit(event: string, data?: unknown): boolean {
    if (this.ws?.readyState === 1 && this.checkingEventAccess(event)) {
      this.ws.send(pack({ event, data }));
      return true;
    }
    this.callStack.push({ event, data });
    return false;
  }

  /**
   * Emit event
   * @param event Event name
   * @param data parameter
   * @param options
   * @return {boolean}
   */
  async emitPromised<T = unknown>(
    event: string,
    data?: unknown,
    options?: EmitPromisedOptions,
  ): Promise<WsResponseMessage<T>> {
    return new Promise((resolve) => {
      if (this.ws?.readyState === 1) {
        if (this.checkingEventAccess(event)) {
          this.ws.send(pack({ event, data }));
          const listener = (ev: MessageEvent) => {
            const body = unpack(new Uint8Array(ev.data as ArrayBuffer)) as WsMessageBody;
            if (body.event === event) {
              resolve(body.data as WsResponseMessage<T>);
            }
          };
          this.ws.addEventListener('message', listener);
          let { requestTimeout } = this;
          if (options?.timeout) {
            requestTimeout = options.timeout;
          }
          setTimeout(() => {
            this.ws?.removeEventListener('message', listener);
            resolve({
              status: false,
              errors: 'Request timeout',
            });
          }, requestTimeout);
        } else {
          const authListener = this.on('authorizationComplete', async () => {
            this.removeOn('authorizationComplete', authListener);
            const result = await this.emitPromised<T>(event, data);
            resolve(result);
          });
        }
      } else {
        this.ws?.addEventListener('open', async () => {
          const result = await this.emitPromised<T>(event, data);
          resolve(result);
        }, { once: true });
      }
    });
  }

  public isAuthorizeChange(value: boolean): void {
    // this.isAuthorized = value;
    if (value) {
      this.emitLocal('authorizationComplete');
    }
  }
}
