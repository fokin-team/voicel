import { SetMetadata } from '@nestjs/common';

export const MessageMetaData = (message: string) => SetMetadata('ws-message', message);
