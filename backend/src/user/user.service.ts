import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/';
import { User } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';
@Injectable()
export class UserService {
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

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    
    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
    } catch (error) {
      throw new HttpException( 'error : updateUser', HttpStatus.FORBIDDEN);
    }

  }

  async allUsers() {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      throw new HttpException( 'error : allUsers', HttpStatus.FORBIDDEN);
    }
  }

  

  async leaderboard() {
    try {
      return await this.prisma.user.findMany({
        orderBy: [
          {
            wins: 'desc',
          },
          {
            losses: 'asc',
          },
          {
            id: 'asc',
          },
        ],
      });
    } catch (error) {
      throw new HttpException( 'error : leaderboard', HttpStatus.FORBIDDEN);
    }


  }

  async getUserRank(userId: number) {
    try {
      const allUsers = await this.prisma.user.findMany({
        orderBy: [
          {
            wins: 'desc',
          },
          {
            losses: 'asc',
          },
          {
            id: 'asc',
          },
        ],
      });
  
      const userRank = allUsers.findIndex((user) => user.id === userId) + 1;
      return userRank;
    } catch (error) {
      throw new HttpException( 'error : getUserRank', HttpStatus.FORBIDDEN);
    }
    
  }

  async getProfile(username: string) {
    try {
      const profile = await this.prisma.user.findUnique({
        where: {
          username: username,
        },
        include: {
          friends: true,
          blocks: true,
        },
      });
      return profile;
    } catch (error) {
      throw new HttpException( 'error : getProfile', HttpStatus.FORBIDDEN);
    }

  }

  async addFriend(user: User, friendUsername: string) {
    try {
      const friend = await this.prisma.user.findUniqueOrThrow({
        where: { username: friendUsername },
      });
  
      const alreadyFriends = await this.prisma.user.findMany({
        where: {
          AND: [{ id: user.id }, { friends: { some: { id: friend.id } } }],
        },
      });
  
      if (alreadyFriends.length > 0) {
        throw new BadRequestException('Users are already friends');
      }
  
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { friends: { connect: { id: friend.id } } },
      });
  
      return updatedUser;
    } catch (error) {
      throw new HttpException( 'error : getProfile', HttpStatus.FORBIDDEN);
    }

  }

  async removeFriend(user: User, friendUsername: string) {

    try {
      const friend = await this.prisma.user.findUnique({
        where: { username: friendUsername },
        });

      if (!friend) {
        throw new NotFoundException('Friend not found');
      }

      return await this.prisma.user.update({
        where: { id: user.id },
        data: { friends: { disconnect: { id: friend.id } } },
      });
    } catch (error) {
      throw new HttpException( 'error : removeFriend', HttpStatus.FORBIDDEN);
    }

  }

  async addBlock(user: User, blockUsername: string) {

    try {
      const block = await this.prisma.user.findUniqueOrThrow({
        where: { username: blockUsername },
      });
  
      const alreadyBlocked = await this.prisma.user.findMany({
        where: {
          AND: [{ id: user.id }, { blocks: { some: { id: block.id } } }],
        },
      });
  
      if (alreadyBlocked.length > 0) {
        throw new BadRequestException('Users are already blocked');
      }
  
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { blocks: { connect: { id: block.id } } },
        include: { blocks: true },
      });
  
      return updatedUser;
    } catch (error) {
      throw new HttpException( 'error : addBlock', HttpStatus.FORBIDDEN);
    }
    
  }

  async removeBlock(user: User, blockUsername: string) {
   
    try {
      const block = await this.prisma.user.findUnique({
        where: { username: blockUsername },
      });
  
    
      if (!block) {
        throw new NotFoundException('Block not found');
      }
  
    
      return await this.prisma.user.update({
        where: { id: user.id },
        data: { blocks: { disconnect: { id: block.id } } },
      });
    } catch (error) {
      throw new HttpException( 'error : removeBlock', HttpStatus.FORBIDDEN);
    }

  }

  async getUserById(userId: number) {
    try {
      const userById = await this.prisma.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
      });
      return userById;
    } catch (error) {
      throw new NotFoundException('User not found.');
    }
  }

  async getUserBlocksIds(user: User)
  {
    const userWithBlocks = await this.prisma.user.findUnique({
      where: {
        id: user.id, 
      },
      select: {
        blocks: {
          select: {
            id: true, 
          },
        },
      },
    });
  
    if (!userWithBlocks) {
      return null; 
    }
    const blockedUserIds = userWithBlocks.blocks.map((blockedUser) => blockedUser.id);
  
    return blockedUserIds;
  }
}
