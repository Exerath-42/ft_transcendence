import {
  Controller,
  UseGuards,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { Request } from 'express';
import { User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('direct-messages')
export class DirectMessageController {
  constructor(private directMessageService: DirectMessageService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('/:recipient')
  async directMessages(
    @Req() req: Request,
    @Param('recipient') recipient: string,
  ) {
    const user = req.user as User;
    try {
      const messages = this.directMessageService.getMessages(user.username, recipient);
      
      this.directMessageService.deepDeleteKey(messages, "twoFactorAuthenticationSecret");
      this.directMessageService.deepDeleteKey(messages, "password");

      return messages;
    } catch (error) {
      throw error
    }
    
  }
}
