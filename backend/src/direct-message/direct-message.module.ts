import { Module } from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageController } from './direct-message.controller';

@Module({
  providers: [DirectMessageService],
  controllers: [DirectMessageController],
})
export class DirectMessageModule {}
