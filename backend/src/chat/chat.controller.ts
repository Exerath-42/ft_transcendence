import {
  Controller,
  Post,
  UseGuards,
  Req,
  Body,
  Get,
  Param,
  Headers,
  Put,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ChatService } from './chat.service';
import { User } from '@prisma/client';
import { UpdateChatDto } from './dto';
import { retry } from 'rxjs';

@Controller('chats')
export class ChatController {
  constructor(private chatService: ChatService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async allChats() {
    return this.chatService.listPublicRooms();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createChat(@Req() req: Request, @Body() chatData: UpdateChatDto) {

    const roomName = chatData.name;
    const roomPassword = chatData.password;
    const hasPassword = chatData.password ? true : false;
    const isPrivate = chatData.isPrivate;

    try {
      const newRoom = await this.chatService.createRoom(
        roomName,
        roomPassword,
        isPrivate,
        req.user as User,
        hasPassword,
      );
      this.chatService.deepDeleteKey(newRoom, "twoFactorAuthenticationSecret");
      this.chatService.deepDeleteKey(newRoom, "password");
      return newRoom;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/info/:roomName')
  async getRoomInfo(@Req() req: Request, @Param('roomName') roomName: string) {
    let password = req.headers.password;
    if (Array.isArray(password)) {
      password = password[0];
    }

    try {
      const chatInfo = await this.chatService.getRoomInfo(roomName, password);
      this.chatService.deepDeleteKey(chatInfo, "twoFactorAuthenticationSecret");
      this.chatService.deepDeleteKey(chatInfo, "password");

      return 
    } catch (error) {
      throw error
    }
    
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/info/id/:roomId')
  async getRoomInfoById(@Req() req: Request, @Param('roomId') roomId: string) {
    let password = req.headers.password;
    if (!/^\d+$/.test(roomId)) {
      throw new BadRequestException('Invalid roomId. Must be a number.');
    }

    const roomIdInt = parseInt(roomId, 10);

    if (isNaN(roomIdInt)) {
      throw new BadRequestException('Failed to parse roomId.');
    }

    if (Array.isArray(password)) {
      password = password[0]; 
    }

    try {
      const chatInfo = await this.chatService.getRoomInfoById(roomIdInt, password);
 
      this.chatService.deepDeleteKey(chatInfo, "twoFactorAuthenticationSecret");
      this.chatService.deepDeleteKey(chatInfo, "password");
      return chatInfo;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/:roomName/messages')
  async getRoomMessages(
    @Req() req: Request,
    @Param('roomName') roomName: string,
  ) {

    try {
      const messages = await this.chatService.messagesFromRoom(roomName);
      this.chatService.deepDeleteKey(messages, "twoFactorAuthenticationSecret");
      this.chatService.deepDeleteKey(messages, "password");
      return messages;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/id/:roomId/messages')
  async getRoomMessagesById(
    @Req() req: Request,
    @Param('roomId') roomId: string,
  ) {
    const user = req.user as User;
    let password = req.headers.password;
    if (Array.isArray(password)) {
      password = password[0];
    }
    try {
      const roomIdInt = parseInt(roomId);
      const messages = await this.chatService.messagesFromRoomById(
        roomIdInt,
        user.id,
        password,
      );
      this.chatService.deepDeleteKey(messages, "twoFactorAuthenticationSecret");
      this.chatService.deepDeleteKey(messages, "password");
      return messages;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Put('/:roomName')
  async updateRoom(
    @Req() req: Request,
    @Body() updateChat: UpdateChatDto,
    @Param('roomName') roomName: string,
  ) {
    const user = req.user as User;

    try {
      const update = await this.chatService.updateRoom(
        roomName,
        user,
        updateChat,
      );
      this.chatService.deepDeleteKey(update, "twoFactorAuthenticationSecret");
      this.chatService.deepDeleteKey(update, "password");
      return update;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Put('/id/:roomId')
  async updateRoomById(
    @Req() req: Request,
    @Body() updateChat: UpdateChatDto,
    @Param('roomId') roomId: string,
  ) {
    const user = req.user as User;
    const roomIdInt = parseInt(roomId);
    try {
      const update = await this.chatService.updateRoomById(
        roomIdInt,
        user,
        updateChat,
      );
      this.chatService.deepDeleteKey(update, "twoFactorAuthenticationSecret");
      this.chatService.deepDeleteKey(update, "password");
      return update;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Put('/permissions/:chatId/:userId')
  async updateOrCreateChatUser(
    @Param('chatId') chatId: string,
    @Param('userId') userId: string,
    @Body()
    chatUserUpdates: {
      newMemberStatus: boolean;
      newAdminStatus: boolean;
      newMuteStatus: boolean;
    },
  ) {
    const { newMemberStatus, newAdminStatus, newMuteStatus } = chatUserUpdates;
    try {
      const permissions = await this.chatService.updateOrCreateChatUser(
        chatId,
        userId,
        newMemberStatus,
        newAdminStatus,
        newMuteStatus,
      );
      this.chatService.deepDeleteKey(permissions, "twoFactorAuthenticationSecret");
      this.chatService.deepDeleteKey(permissions, "password");
      return permissions;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/permissions/:roomName')
  async getRoomPermissions(
    @Req() req: Request,
    @Param('roomName') roomName: string,
  ) {
    try {
      const permissions = await this.chatService.getRoomPermissions(roomName);
      this.chatService.deepDeleteKey(permissions, "twoFactorAuthenticationSecret");
      this.chatService.deepDeleteKey(permissions, "password");
      return permissions;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/permissions/id/:roomId')
  async getRoomPermissionsById(
    @Req() req: Request,
    @Param('roomId') roomId: string,
  ) {
    try {
      const roomIdInt = parseInt(roomId);
      const permissions = await this.chatService.getRoomPermissionsById(
        roomIdInt,
      );
      this.chatService.deepDeleteKey(permissions, "twoFactorAuthenticationSecret");
      this.chatService.deepDeleteKey(permissions, "password");
      return permissions;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/me/permission/id/:roomId')
  async getRoomPermissionsFromUser(
    @Req() req: Request,
    @Param('roomId') roomId: string,
  ) {
    const user = req.user as User;
    const roomIdInt = parseInt(roomId);

    if (isNaN(roomIdInt))
    {
      throw new HttpException('Invalid roomId', HttpStatus.BAD_REQUEST);
    }

    try {
      const permission = await this.chatService.getRoomPermissionsFromUser(
        user.id,
        roomIdInt,
      );
      this.chatService.deepDeleteKey(permission, "twoFactorAuthenticationSecret");
      this.chatService.deepDeleteKey(permission, "password");
      return permission;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/privates')
  async getPrivateRooms(@Req() req: Request) {
    try {
      const user = req.user as User;
      const privateRoom = await this.chatService.getPrivateRooms(user);
      this.chatService.deepDeleteKey(privateRoom, "twoFactorAuthenticationSecret");
      this.chatService.deepDeleteKey(privateRoom, "password");
      return privateRoom;
    } catch (error) {
      throw error
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/owner/leave/:roomId')
  async ownerLeave(@Req() req: Request, @Param('roomId') roomId: string,  @Headers('password') optionalPassword?: string) {
    const roomIdInt = parseInt(roomId);
    const user = req.user as User;
   
    try {
      let roomInfo;
      if (optionalPassword) {
        roomInfo = await this.chatService.leaveRoom(user.id, roomIdInt, optionalPassword);
      }else{

        roomInfo = await this.chatService.leaveRoom(user.id, roomIdInt);
      }
      this.chatService.deepDeleteKey(roomInfo, "twoFactorAuthenticationSecret");
      this.chatService.deepDeleteKey(roomInfo, "password");
      return roomInfo;
    } catch (error) {
      throw error
    }
  }
}
