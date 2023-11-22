import { Module } from '@nestjs/common';
import { ChatGateway } from 'src/gateways/chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { DirectMessageService } from 'src/direct-message/direct-message.service';

@Module({
  providers: [ChatGateway, ChatService, DirectMessageService],
  controllers: [ChatController],
})
export class ChatModule {}
