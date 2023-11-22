import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DirectMessageService {
  constructor(private prisma: PrismaService) {}

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
  
  async saveMessage(text: string, senderName: string, recipientName: string) {
    const sender = await this.prisma.user.findUnique({
      where: {
        username: senderName,
      },
    });

    const recipient = await this.prisma.user.findUnique({
      where: {
        username: recipientName,
      },
    });

    if (!sender || !recipient) {
      throw new NotFoundException('Sender or recipient not found.');
    }

    if (sender.id === recipient.id) {
      throw new BadRequestException('Sender and recipient cannot be the same.');
    }

    const newMessage = await this.prisma.directMessage.create({
      data: {
        senderId: sender.id,
        recipientId: recipient.id,
        text: text,
      },
    });
    return newMessage;
  }

  async getMessages(firtUser: string, secondUser: string) {
    try {
      const messages = await this.prisma.directMessage.findMany({
        where: {
          OR: [
            {
              sender: { username: firtUser },
              recipient: { username: secondUser },
            },
            {
              sender: { username: secondUser },
              recipient: { username: firtUser },
            },
          ],
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          sender: true,
          recipient: true,
        },
      });
      return messages;
    } catch (error) {
        throw new HttpException( 'error : getMessages', HttpStatus.FORBIDDEN);
    }
    
  }
}
