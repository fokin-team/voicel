export interface WsFormatExceptionInterface {
  event: string,
  code?: number,
  message: WsFormatExceptionErrorsInterface[] | string,
  isCloseWs?: true,
}

export interface WsFormatExceptionErrorsInterface {
  key: string,
  values: Array<string>,
}
