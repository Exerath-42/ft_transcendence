import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as moment from 'moment';
import { ChatService } from '../chat/chat.service';
import { DirectMessageService } from 'src/direct-message/direct-message.service';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';

const onlineUsers = {};

function formatMessage(username: string, text: string, time: Date) {
  return {
    username,
    text,
    time: time,
  };
}
const groupUsers = [];

function groupUserJoin(socketId, username, room, roomId) {
  const user = { socketId: socketId, username, room, roomId };

  groupUsers.push(user);
  return user;
}

function getCurrentGroupUser(socketId) {
  return groupUsers.find((user) => user.socketId === socketId);
}

const directUsers = [];

function directUserJoin(socketId, username, userId) {
  const user = { socketId: socketId, username, userId };

  directUsers.push(user);
  return user;
}

function getCurrentDirectMessageUser(socketId) {
  return directUsers.find((user) => user.socketId === socketId);
}

function getDirectMessageUser(userId) {
  return directUsers.find((user) => user.userId === userId);
}

@WebSocketGateway(3001, { cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private chatService: ChatService,
    private readonly prismaService: PrismaService,
    private directMessageService: DirectMessageService,
  ) {}

  private async checkOnlineUsers(server: Server) {
    for (const [clientId, userId] of Object.entries(onlineUsers)) {
      
      if (!server)
        return;
      const clientSocket = server.sockets.sockets.get(clientId);
      
      if (clientSocket) {
        if (!clientSocket.connected) {

          if (!/^\d+$/.test(String(userId))) {
            return;
          }
    
          const userIdInt = parseInt(String(userId), 10);
          if (isNaN(userIdInt)) {
            
            return;
          }

          const user = await this.prismaService.user.update({
            where: { id: userIdInt},
            data: {
              status: "OFFLINE"
            }
          });
          this.server.emit('someoneOffline', {id: user.id});
          delete onlineUsers[clientId];
        }
      } else {

        if (!/^\d+$/.test(String(userId))) {
          return;
        }
  
        const userIdInt = parseInt(String(userId), 10);
        if (isNaN(userIdInt)) {
          
          return;
        }

        const user = await this.prismaService.user.update({
          where: { id: userIdInt},
          data: {
            status: "OFFLINE"
          }
        });
        this.server.emit('someoneOffline', {id: user.id});
        delete onlineUsers[clientId];
      }
    }
  }

  afterInit(server: Server) {
    setInterval(() => this.checkOnlineUsers(server), 60000);
  }

  handleConnection(client: Socket, ...args: any[]) {
  }

  @SubscribeMessage('online')
  async handleOnline(client: Socket, payload: { token: string }) {
    const { token } = payload;
    const config = new ConfigService();

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, config.get('JWT_SECRET'));
    } catch (err) {
      this.server.to(client.id).emit('error', {'msg': "Invalid token"});
      client.disconnect();
      return;
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: decodedToken.sub },
      include: {
        friends: true,
      },
    });

    if (!user) {
      this.server.to(client.id).emit('error', {'msg': "User not found"});
      client.disconnect();
      return;
    }

    for (const [clientId, userId] of Object.entries(onlineUsers)) {  
      if (userId === user.id)
      {
        const clientSocket = this.server.sockets.sockets.get(clientId);
      
        if (clientSocket) {
          if (!clientSocket.connected) {

            if (!/^\d+$/.test(String(userId))) {
              return;
            }
      
            const userIdInt = parseInt(String(userId), 10);
            if (isNaN(userIdInt)) {
              
              return;
            }
            
            delete onlineUsers[clientId];
            onlineUsers[client.id] = user.id;
            const userUpdate = await this.prismaService.user.update({
              where: { id: userIdInt},
              data: {
                status: "ONLINE"
              }
            });
            this.server.emit('someoneOnline', {id: userIdInt});
            return;
          }
          else {
            this.server.to(client.id).emit('error', {'msg': "user already conected"});
            client.disconnect();
            return;
          }
        } else {

          if (!/^\d+$/.test(String(userId))) {
            this.server.to(client.id).emit('error', {'msg': "user id is not a number"});
            client.disconnect();
            return;
          }
    
          const userIdInt = parseInt(String(userId), 10);
          if (isNaN(userIdInt)) {
            this.server.to(client.id).emit('error', {'msg': "user id is not a number"});
            client.disconnect();
            return;
          }

          delete onlineUsers[clientId];
          onlineUsers[client.id] = user.id;
          const userUpdate = await this.prismaService.user.update({
            where: { id: userIdInt},
            data: {
              status: "ONLINE"
            }
          });
          this.server.emit('someoneOnline', {id: userIdInt});
          return;
        }
      }
    }

    if (user.status !== 'GAME') {
      await this.prismaService.user.update({
        where: {
          id: user.id,
        },
        data: {
          status: 'ONLINE',
        },
      });
    }
    this.server.emit('someoneOnline', {id: user.id});
    onlineUsers[client.id] = user.id;
  }

  async handleDisconnect(client: Socket) {

    if (!onlineUsers[client.id]) return;

    const user = await this.prismaService.user.findUnique({
      where: { id: onlineUsers[client.id] },
    });

    if (!user) {
      this.server.to(client.id).emit('error', {'msg': "user not found"});
      client.disconnect();
      return;
    }
    
      try {
        await this.prismaService.user.update({
          where: {
            id: user.id,
          },
          data: {
            status: 'OFFLINE',
          },
        });
        this.server.emit('someoneOffline', {id: user.id});
      } catch (error) {
        this.server.to(client.id).emit('error', {'msg': "Error updating user status"});
        client.disconnect();
        return;
      }
  
    delete onlineUsers[client.id];
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    client: Socket,
    payload: { token: string; room: number; password: string },
  ) {
    const { token, room, password } = payload;
    if (!password) password === '';
    const config = new ConfigService();

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, config.get('JWT_SECRET'));
    } catch (err) {
      this.server.to(client.id).emit('error', {'msg': "Invalid token"});
      client.disconnect();
      return;
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: decodedToken.sub },
      
    });

    if (!user) {
      this.server.to(client.id).emit('error', {'msg': "User not found"});
      client.disconnect();
      return;
    }

    let roomInfo;
    try {
      roomInfo = await this.chatService.getRoomInfoById(room, password);
    } catch (error) {
      this.server.to(client.id).emit('error', {'msg': "User not found"});
      client.disconnect();
      return;
    }

    const chatUser = await this.prismaService.chatUser.findFirst({
      where: {
        AND: [{ userId: decodedToken.sub }, { chatId: roomInfo.id }],
      },
    });

    if (roomInfo.isPrivate) {
      if (!chatUser || !chatUser.member) {
        this.server.to(client.id).emit('error', {'msg': "User is not a member of this chat"});
        return;
      }
    } else {
      if (!chatUser) {
        await this.chatService.updateOrCreateChatUser(
          roomInfo.id,
          decodedToken.sub,
          true,
          false,
          false,
        );
      } else if (!chatUser.member) {
        this.server.to(client.id).emit('error', {'msg': "User was banned of this room"});
        return;
      }
    }

    groupUserJoin(client.id, user.username, roomInfo.id, roomInfo.id);
    client.join(String(roomInfo.id));

  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket, payload: { token: string; room: number }) {

  const { token, room } = payload;
  let decodedToken: any;
  const config = new ConfigService();

    try {
      decodedToken = jwt.verify(token, config.get('JWT_SECRET'));
    } catch (err) {
      this.server.to(client.id).emit('error', {'msg': "Invalid token!"});
      client.disconnect();
      return;
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: decodedToken.sub },
    });

    if (!user) {
      this.server.to(client.id).emit('error', {'msg': "User not found"});
      client.disconnect();
      return;
    }

    const currentUser = getCurrentGroupUser(client.id);
    if (currentUser && currentUser.roomId === room) {
      const index = groupUsers.findIndex((user) => user.socketId === client.id);
      if (index !== -1) groupUsers.splice(index, 1);

      client.leave(String(room));
    }
  }

  @SubscribeMessage('chatMessage')
  async handleChatMessage(client: Socket, payload: string) {
    const msg = payload;
    if (!msg || msg === '') return;

    const user = getCurrentGroupUser(client.id);
    const userOBJ = await this.prismaService.user.findUnique({
      where: { username: user.username },
      include: {
        ChatUser: {
          where: {
            chatId: {
              equals: user.roomId,
            },
          },
        },
      },
    });
    let chatInfo;
    try{
     chatInfo = await this.prismaService.chat.findUniqueOrThrow({
        where: { id: user.roomId },
      });
    }catch(err)
    {
      this.server.to(client.id).emit('error', {'msg': "Chat info not found"});

      client.disconnect();
    }

   

    if (!userOBJ) {
      this.server.to(client.id).emit('error', {'msg': "User not found"});
      client.disconnect();
      return;
    }

    if (chatInfo.isPrivate && !userOBJ.ChatUser[0]) {
      this.server.to(client.id).emit('error', {'msg': "User is not in room"});
      client.disconnect();
      return;
    }

    if (userOBJ?.ChatUser[0]?.mute) {
      
      return;
    }
    let savedMessage
   try{
     savedMessage = await this.chatService.saveMessageById(
      user.room,
      user.username,
      msg,
    );
   }catch(err)
   {
    this.server.to(client.id).emit('error', {'msg': "Error saving message"});
   }

    
    this.server.to(String(user.room)).emit('message', {
      senderId: savedMessage.senderId,
      username: user.username,
      text: msg,
      time: savedMessage.createdAt,
    });
  }

  @SubscribeMessage('joinDirect')
  async handleJoinPrivate(client: Socket, payload: { token: string }) {
    const { token } = payload;

    const config = new ConfigService();

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, config.get('JWT_SECRET'));
    } catch (err) {
      this.server.to(client.id).emit('error', {'msg': "Invalid token"});
      client.disconnect();
      return;
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: decodedToken.sub },
      include: {
        friends: true,
      },
    });

    if (!user) {
      
      this.server.to(client.id).emit('error', {'msg': "Invalid token"});
      return;
    }

    directUserJoin(client.id, user.username, user.id);
    client.join(user.username);
  }

  @SubscribeMessage('directMessage')
  async handleDirectMessage(
    client: Socket,
    payload: { message: string; recipient: string },
  ) {
    if (!payload.message || !payload.recipient) {
      this.server.to(client.id).emit('error', {'msg': "Bad request"});
    }
    const senderOBJ = getCurrentDirectMessageUser(client.id);
    if (!senderOBJ) {
      this.server.to(client.id).emit('error', {'msg': "Bad request"});
    }

    const sender = await this.prismaService.user.findUnique({
      where: { username: senderOBJ.username },
    });

    const recipient = await this.prismaService.user.findUnique({
      where: {
        username: payload.recipient,
        NOT: {
          blocks: {
            some: {
              id: sender.id,
            },
          },
        },
      },
    });

    if (!sender || !recipient) {
      this.server.to(client.id).emit('error', {'msg': 'Error sending message.'});
      
      return;
    }
    if (sender.id === recipient.id)
    {
      this.server.to(client.id).emit('error', {'msg': 'Dont talk alone.'});
      
      return;
    }
    let savedMessage
    try{
      savedMessage = await this.directMessageService.saveMessage(
        payload.message,
        sender.username,
        recipient.username,
      );
    }catch(err)
    {
      this.server.to(client.id).emit('error', {'msg': 'Error saving message.'});
      return;
    }

    const recipientObj = getDirectMessageUser(recipient.id);

    if (!recipientObj) {
      this.server
        .to(senderOBJ.username)
        .emit(
          'messageSent',
          formatMessage(
            sender.username,
            payload.message,
            savedMessage.createdAt,
          ),
        );
      return;
    }
    this.server
      .to([recipientObj.username, senderOBJ.username])
      .emit(
        'messageSent',
        formatMessage(sender.username, payload.message, savedMessage.createdAt),
      );
  }
  @SubscribeMessage('invitationSend')
  async handleInvitation(client: Socket, payload: {id: number, recipient: string})
  {
    const senderOBJ = getCurrentDirectMessageUser(client.id);
    if (!senderOBJ) {
      this.server.to(client.id).emit('error', {'msg': 'Error validating user.'});
      return;
    }

    const recipientObj = getDirectMessageUser(payload.recipient);
    if (!recipientObj)
    {
      this.server.to(client.id).emit('error', {'msg': 'Error validating user.'});
      return;
    }
 
    this.server
      .to([recipientObj.username, senderOBJ.username])
      .emit(
        'invitationRecieved',
        {id: payload.id}
      );
  }

  @SubscribeMessage('invitationGroupSend')
  async handleInvitationGroup(client: Socket, payload: {id: number, group: string})
  {
    const user = getCurrentGroupUser(client.id);
  

    const userOBJ = await this.prismaService.user.findUnique({
      where: { username: user.username },
      include: {
        ChatUser: {
          where: {
            chatId: {
              equals: user.roomId,
            },
          },
        },
      },
    });
    let chatInfo;
   try{
    chatInfo = await this.prismaService.chat.findUniqueOrThrow({
      where: { id: user.roomId },
    });
   }catch(err)
  {
    this.server.to(client.id).emit('error', {'msg': 'Error validating chat.'});
    return;
  }

    if (!userOBJ) {
      this.server.to(client.id).emit('error', {'msg': 'Error validating user.'});
      client.disconnect();
      return;
    }

    if (chatInfo.isPrivate && !userOBJ.ChatUser[0]) {
      this.server.to(client.id).emit('error', {'msg': 'User not in private chat.'});
      client.disconnect();
      return;
    }

    if (userOBJ?.ChatUser[0]?.mute) {
      return;
    }

    this.server.to(String(user.room)).emit('invitationRecieved',  {id: payload.id});
  
  }

  @SubscribeMessage('kick')
  async kickUser(client: Socket, payload: {kickedId: number})
  {
    const kickedId = payload.kickedId;
    if (!/^\d+$/.test(String(kickedId))) {
      this.server.to(client.id).emit('error', {'msg': "Kick id is not a number!"});
      return;
    }

    const kickIdInt = parseInt(String(kickedId), 10);
    if (isNaN(kickIdInt)) {
      this.server.to(client.id).emit('error', {'msg': "Kick id is not a number!"});
      return;
    }

    const user = getCurrentGroupUser(client.id);
    

    const userOBJ = await this.prismaService.user.findUnique({
      where: { username: user.username },
      include: {
        ChatUser: {
          where: {
            chatId: {
              equals: user.roomId,
            },
          },
        },
      },
    });

    let chatInfo 
    try{
      chatInfo = await this.prismaService.chat.findUniqueOrThrow({
        where: { id: user.roomId },
      });
    }catch(err)
    {
      this.server.to(client.id).emit('error', {'msg': "Error validating chat!"});
    }

    if (!userOBJ) {
      this.server.to(client.id).emit('error', {'msg': "Error validating user!"});
      client.disconnect();
      return;
    }

    if (chatInfo.isPrivate && !userOBJ.ChatUser[0]) {
      this.server.to(client.id).emit('error', {'msg': "User not in private chat!"});
      client.disconnect();
      return;
    }


    if (!userOBJ?.ChatUser[0]?.admin) {
      return;
    }
    this.server.to(String(user.room)).emit('kicked',  {id: kickIdInt});
  }

  @SubscribeMessage('gameRoom')
  async handlegameRoom(client: Socket, payload: { token: string, status: string }) {
    const { token } = payload;
    const config = new ConfigService();

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, config.get('JWT_SECRET'));
    } catch (err) {
      this.server.to(client.id).emit('error', {'msg': "Invalid token"});
      client.disconnect();
      return;
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: decodedToken.sub },
      
    });

    if (!user) {
      
      this.server.to(client.id).emit('error', {'msg': "User not found"});
      client.disconnect();
      return;
    }

   
    this.server.emit('gameStatus', {id: user.id, status: payload.status});
  }

  @SubscribeMessage('updateName')
  async updateName(client: Socket, payload: { token: string, oldName: string, newUsername: string}) {
   
    const { token } = payload;
    const config = new ConfigService();

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, config.get('JWT_SECRET'));
    } catch (err) {
     
      this.server.to(client.id).emit('error', {'msg': "Invalid token"});
      client.disconnect();
      return;
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: decodedToken.sub, username: payload?.newUsername },
      
    });

    if (!user) {
      
      this.server.to(client.id).emit('error', {'msg': "User not found"});
      client.disconnect();
      return;
    }

   
    this.server.emit('changeName', { oldName: payload.oldName, newUsername: user.username });
  }
}
