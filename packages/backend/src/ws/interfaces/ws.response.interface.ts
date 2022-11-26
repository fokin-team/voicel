export interface WsResponse<T = unknown, P = unknown> {
  event: string;
  data: WsResponseData<T>;
  meta?: P;
}

interface WsResponseData<T = unknown> {
  status: boolean;
  data: T;
}
