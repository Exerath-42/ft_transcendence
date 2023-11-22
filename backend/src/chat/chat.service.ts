import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Chat, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UpdateChatDto } from './dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) { }

  deepDeleteKey(obj, keyToDelete) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (key === keyToDelete) {
          delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          this.deepDeleteKey(obj[key], keyToDelete);
        }
      }
    }
  }

  async listPublicRooms() {
    const publicRooms = await this.prisma.chat.findMany({
      where: {
        isPrivate: false,
      },
      select: {
        id: true,
        name: true,
        isPrivate: true,
        hasPassword: true,
        password: false,
      },
    });
    return publicRooms;
  }

  async createRoom(
    roomName: string,
    roomPassword: string,
    isPrivate: boolean,
    owner: User,
    hasPassword: boolean,
  ) {
    try {
      const existingChat = await this.prisma.chat.findUnique({
        where: {
          name: roomName,
        },
      });

      if (existingChat) {
        throw new HttpException(
          'A chat room with this name already exists',
          HttpStatus.CONFLICT,
        );
      }

      const hashedPassword = await bcrypt.hashSync(roomPassword, 10);

      const newRoom = await this.prisma.chat.create({
        data: {
          name: roomName,
          password: hashedPassword,
          isPrivate: isPrivate,
          ownerId: owner.id,
          hasPassword: hasPassword,
          ChatUser: {
            create: {
              userId: owner.id,
              member: true,
              admin: true,
            },
          },
        },
        include: {
          ChatUser: true,
        },
      });

      delete newRoom.password;
      return newRoom;
    } catch (error) {
    
        throw new HttpException("Problem creating room", HttpStatus.BAD_REQUEST);



    }
  }

  async getRoomInfo(roomName: string, password = '') {
    let room;
    try{
      room = await this.prisma.chat.findUniqueOrThrow({
        where: {
          name: roomName,
        },
        include: {
          owner: true,
        },
      });
    }catch(err){
      throw new HttpException("Room not found", HttpStatus.NOT_FOUND);
    }
    if (!room.password)
    {
      throw new HttpException("Problem with password", HttpStatus.BAD_REQUEST);
    }
    let isMatch;
    try{
      isMatch = bcrypt.compareSync(password, room.password);
    }catch(err)
    {
      throw new HttpException("Problem comparing hashed password", HttpStatus.BAD_REQUEST);
    }
    delete room.password;
    if (!isMatch) {
      throw new HttpException('Password is incorrect', HttpStatus.UNAUTHORIZED);
    }
    return room;
  }

  async getRoomInfoById(roomId: number, password = '') {
   let room;
    try {
    
      room = await this.prisma.chat.findUniqueOrThrow({
      where: {
        id: roomId,
      },
      include: {
        owner: true,
      },
    });

   } catch (error) {
      throw new HttpException('Room is not found', HttpStatus.NOT_FOUND);
   }

    const isMatch = bcrypt.compareSync(password, room.password);
    delete room.password;
    if (!isMatch) {
      throw new HttpException('Password is incorrect', HttpStatus.UNAUTHORIZED);
    }
    return room;
  }

  async saveMessage(roomName: string, senderName: string, text: string) {
    let room;
    try{
      room = await this.prisma.chat.findUnique({
        where: {
          name: roomName,
        },
      });
    }catch(err)
    {
      throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    }

    let sender;
    try{
       sender = await this.prisma.user.findUniqueOrThrow({
        where: {
          username: senderName,
        },
      });
    }catch(err)
    {
      throw new HttpException('Sender not found', HttpStatus.NOT_FOUND);
    }

   try{
    const newMessage = await this.prisma.message.create({
      data: {
        roomId: room.id,
        senderId: sender.id,
        text: text,
      },
    });
    return newMessage;
   }catch(err)
   {
    throw new HttpException('Error saving message', HttpStatus.BAD_REQUEST);
   }
  }

  async saveMessageById(roomId: number, senderName: string, text: string) {
    let room;
    try{
      room = await this.prisma.chat.findUniqueOrThrow({
        where: {
          id: roomId,
        },
      });
    }catch(err)
    {
      throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    }

    let sender;
    try{
      sender = await this.prisma.user.findUnique({
        where: {
          username: senderName,
        },
      });
    }catch(err)
    {
      throw new HttpException('Sender not found', HttpStatus.NOT_FOUND);
    }

   try{
    const newMessage = await this.prisma.message.create({
      data: {
        roomId: room.id,
        senderId: sender.id,
        text: text,
      },
    });

    return newMessage;
   }catch(err)
   {
    throw new HttpException('Error saving message', HttpStatus.BAD_REQUEST);
   }
  }

  async messagesFromRoom(roomName: string) {

    try {
      const messages = await this.prisma.message.findMany({
        where: {
          room: {
            name: roomName,
          },
        },
        include: {
          room: {
            select: {
              name: true,
            },
          },
          sender: {
            select: {
              id: true,
              image_url: true,
              username: true,
              createdAt: true,
              updatedAt: true,
              wins: true,
              losses: true,
              status: true,
             }
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      return messages;
    } catch (error) {
        throw new HttpException('ERROR messagesFromRoom', HttpStatus.CONFLICT);
    }

  }

  async messagesFromRoomById(roomId: number, userId: number, password = '') {
    let chatUser;
    try{
      chatUser = await this.prisma.chatUser.findFirst({
        where: {
          AND: [{ userId: userId }, { chatId: roomId }],
        },
      });
    }catch(err)
    {
      throw new HttpException('Could not get room info:', HttpStatus.CONFLICT);
    }

    let roomInfo;
    try {
      roomInfo = await this.getRoomInfoById(roomId, password);
    } catch (error) {
      throw new HttpException('Could not get room info:', HttpStatus.CONFLICT);
    }

    if (roomInfo.isPrivate) {
      if (!chatUser || !chatUser.member) {

        throw new HttpException('Access denied: User is not a member of this private room',HttpStatus.UNAUTHORIZED);
   
      }
    } else {
      if (chatUser && !chatUser.member) {
        throw new HttpException('Access denied: you have been blocked',HttpStatus.UNAUTHORIZED);
      }
    }

    try {
      const messages = await this.prisma.message.findMany({
        where: {
          room: {
            id: roomId,
          },
        },
        include: {
          room: {
            select: {
              name: true,
              password: false
            },
          },
          sender: {
            select: {
              id: true,
              image_url: true,
              username: true,
              createdAt: true,
              updatedAt: true,
              wins: true,
              losses: true,
              status: true,
             }
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      return messages;
    } catch (error) {
        throw new HttpException('error : messagesFromRoomById', HttpStatus.CONFLICT);
    }

  }

  async updateRoom(roomName: string, user: User, data: UpdateChatDto) {
    let room;
    let newData;

    if (data.password !== undefined) {
      const hashedPassword = await bcrypt.hashSync(data.password, 10);
      const hasPassword = data.password !== '' ? true : false;
      newData = {
        ...data,
        password: hashedPassword,
        hasPassword: hasPassword,
      };
    }

    try {
      room = await this.prisma.chat.update({
        where: {
          name: roomName,
          ownerId: user.id,
        },
        data: newData || data,
      });
    } catch (error) {
      throw new HttpException(
        'User is not the owner of the room or room does not exist',
        HttpStatus.FORBIDDEN,
      );
    }
    delete room.password;
    return room;
  }

  async updateRoomById(roomId: number, user: User, data: UpdateChatDto) {
    let room;
    let newData;

    if (data.password !== undefined) {
      const hashedPassword = bcrypt.hashSync(data.password, 10);
      const hasPassword = data.password !== '' ? true : false;
      newData = {
        ...data,
        password: hashedPassword,
        hasPassword: hasPassword,
      };
    }

    try {
      room = await this.prisma.chat.update({
        where: {
          id: roomId,
          ownerId: user.id,
        },
        data: newData || data,
      });
    } catch (error) {
      throw new HttpException(
        'User is not the owner of the room or room does not exist',
        HttpStatus.FORBIDDEN,
      );
    }
    delete room.password;
    return room;
  }

  async getRoomPermissions(roomName: string) {
    try {
      const permissions = await this.prisma.chatUser.findMany({
        where: {
          chat: {
            name: roomName,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              image_url: true,
              username: true,
              createdAt: true,
              updatedAt: true,
              wins: true,
              losses: true,
              status: true,
             }
          },
        },
      });
  
      return permissions;
    } catch (error) {
      throw new HttpException(
        'error : getRoomPermissions',
        HttpStatus.FORBIDDEN,
      );
    }

  }

  async getRoomPermissionsById(roomId: number) {
    try {
      const permissions = await this.prisma.chatUser.findMany({
        where: {
          chat: {
            id: roomId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              image_url: true,
              username: true,
              createdAt: true,
              updatedAt: true,
              wins: true,
              losses: true,
              status: true,
             }
          },
        },
      });
  
      return permissions;
    } catch (error) {
      throw new HttpException(
        'error : getRoomPermissionsById',
        HttpStatus.FORBIDDEN,
      );
    }

  }

  async getRoomPermissionsFromUser(userId: number, roomId: number) {
    try {
      const permission = await this.prisma.chatUser.findUniqueOrThrow({
        where: {
          chatId_userId: {
            chatId: roomId,
            userId: userId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              image_url: true,
              username: true,
              createdAt: true,
              updatedAt: true,
              wins: true,
              losses: true,
              status: true,
            },
          },
        },
      });
        return permission;
    } catch (error) {
      throw new HttpException('Not found permission for this user in this room', HttpStatus.NOT_FOUND);
    }
  }

  async updateOrCreateChatUser(
    chatId: string,
    userId: string,
    newMemberStatus: boolean,
    newAdminStatus: boolean,
    newMuteStatus: boolean,
  ) {

    try {
      return await this.prisma.chatUser.upsert({
        where: {
          chatId_userId: {
            chatId: parseInt(chatId),
            userId: parseInt(userId),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              image_url: true,
              username: true,
              createdAt: true,
              updatedAt: true,
              wins: true,
              losses: true,
              status: true,
            },
          },
        },
        update: {
          member: newMemberStatus,
          admin: newAdminStatus,
          mute: newMuteStatus,
        },
        create: {
          chatId: parseInt(chatId),
          userId: parseInt(userId),
          member: newMemberStatus,
          admin: newAdminStatus,
          mute: newMuteStatus,
        },
      });
    } catch (error) {
      throw new HttpException('error : updateOrCreateChatUser', HttpStatus.FORBIDDEN);
    }

    // }
  }

  async getPrivateRooms(user: User) {
    try {
      const privateRooms = await this.prisma.chatUser.findMany({
        where: {
          userId: user.id,
          member: true,
          chat: {
            isPrivate: true,
          },
        },
        include: {
          chat: {
            select: {
              id: true,
              name: true,
              hasPassword: true,
              isPrivate: true,
              ownerId: true,
              createdAt: true,
              updatedAt: true,
              password: false,
            },
          },
        },
      });
      const chats = privateRooms.map((chatUser) => chatUser.chat);
      return chats;
    } catch (error) {
      throw new HttpException( 'error : getPrivateRooms', HttpStatus.FORBIDDEN);
    }
    
  }

  async leaveRoom(userId: number, roomId: number, password="") {
    
    let roomInfo;

    try {
      roomInfo = await this.getRoomInfoById(roomId, password);
    } catch (error) {
      throw error
    }
  
    if (roomInfo.ownerId !== userId)
      throw new HttpException( 'You are not the owner of this room', HttpStatus.FORBIDDEN);

    let newOwner = await this.prisma.chatUser.findFirst({
      where: {
        chatId: roomId,
        admin: true,
        NOT: {
          userId: roomInfo.ownerId,
        },
      },
      include: {
        user: {
         select: {
          id: true,
          image_url: true,
          username: true,
          createdAt: true,
          updatedAt: true,
          wins: true,
          losses: true,
          status: true,
         }
        },
      },
    });

    if (!newOwner) {
       newOwner = await this.prisma.chatUser.findFirst({
        where: {
          chatId: roomId,
          NOT: {
            userId: roomInfo.ownerId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              image_url: true,
              username: true,
              createdAt: true,
              updatedAt: true,
              wins: true,
              losses: true,
              status: true,
             }
          },
        },
      });
    }

    let updatedChatRoom;

    if (!newOwner)
    {
        updatedChatRoom = await this.prisma.chat.update({
        where: {
          id: roomId,
        },
        data: {
          isPrivate : true,
        },
      });
    }
    else
    {
      updatedChatRoom = await this.prisma.chat.update({
        where: {
          id: roomId,
        },
        data: {
          ownerId: newOwner.userId,
        },
      });

      
  
      if (!updatedChatRoom) {
        throw new HttpException(
          'Failed to update chat room owner',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const updatedPermissions = await this.prisma.chatUser.upsert({
        where: {
          chatId_userId: {
            chatId: roomId,
            userId: newOwner.userId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              image_url: true,
              username: true,
              createdAt: true,
              updatedAt: true,
              wins: true,
              losses: true,
              status: true,
             }
          },
        },
        update: {
          member: true,
          admin: true,
          mute: false,
        },
        create: {
          chatId:roomId,
          userId: newOwner.userId,
          member: true,
          admin: true,
          mute: false,
        },
      });

      
      if (!updatedPermissions) {
        throw new HttpException(
          'Failed to update chat owner permissions',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    try {
      await this.prisma.chatUser.delete({
        where: {
          chatId_userId: {
            chatId: roomId,
            userId: userId,
          },
        },
      });
    } catch (error) {
      return updatedChatRoom;
    }
    return updatedChatRoom;
  }
}
