import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, GameWinner, InviteStatus } from '@prisma/client';

@Injectable()
export class GameService {
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

  async getAllFinishedGames() {
    const games = await this.prisma.game.findMany({
      where: {
        winner: {
          not: 'NOTFINISHED',
        },
      },
      include: {
        player1: true,
        player2: true,
      },
    });
    return games;
  }

  async createGame(player1Id: number, player2Id: number, invitation?: number) {
    const game = await this.prisma.game.create({
      data: {
        player1Id: player1Id,
        player2Id: player2Id,
        invitationId: invitation && invitation
      },
      include: {
        player1: true,
        player2: true,
      },
    });
    return game;
  }

  async getGameById(gameId: number) {
    try {
      const game = await this.prisma.game.findUniqueOrThrow({
        where: {
          id: gameId,
        },
        include: {
          player1: true,
          player2: true,
        },
      });

      return game;
    } catch (error) {
      throw new NotFoundException('Game not found.');
    }
  }

  async updateGame(gameId: number, score1: number, score2: number) {
    try {
      const gameUpdated = await this.prisma.game.update({
        where: { id: gameId, winner: "NOTFINISHED" },
        data: {
          score1,
          score2,
          winner: score1 > score2 ? GameWinner.PLAYER1 : GameWinner.PLAYER2,
        },
      });

      if (gameUpdated.winner === GameWinner.PLAYER1) {
        await this.prisma.user.update({
          where: { id: gameUpdated.player1Id },
          data: { wins: { increment: 1 } },
        });
        await this.prisma.user.update({
          where: { id: gameUpdated.player2Id },
          data: { losses: { increment: 1 } },
        });
      } else {
        await this.prisma.user.update({
          where: { id: gameUpdated.player1Id },
          data: { losses: { increment: 1 } },
        });
        await this.prisma.user.update({
          where: { id: gameUpdated.player2Id },
          data: { wins: { increment: 1 } },
        });
      }

      return gameUpdated;
    } catch (error) {
        throw new HttpException( 'error : updateGame', HttpStatus.BAD_REQUEST);
    }
  }

  async gamesFromUser(userId: number) {
    const gamesFromUser = await this.prisma.game.findMany({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
      },
      include: {
        player1: true,
        player2: true,
      },
    });
    return gamesFromUser;
  }

  async createInvitationForId(inviter: User, inviteeId: number) {
    try {
      const currInvitation = await this.prisma.gameInvitation.findFirst({
        where: {
          OR: [{
            inviterId: inviter.id,
            inviteeId: inviteeId,
            status: InviteStatus.PENDING
          },{
            inviterId: inviteeId,
            inviteeId: inviter.id,
            status: InviteStatus.PENDING
          }],
        }
      })

      if (currInvitation)
        return (currInvitation);

      const invitation = await this.prisma.gameInvitation.create({
        data: {
          inviterId: inviter.id,
          inviteeId: inviteeId,
        },
      });
      return invitation;
    } catch (error) {
      console.log(error);
    }
  }

  async createInvitationForGroup(inviter: User, chatId: number) {
    try {

      const invitation = await this.prisma.gameInvitation.create({
        data: {
          inviterId: inviter.id,
          chatId: chatId,
          inviteType: "GROUP"
        },
      });
      return invitation;
    }catch(error)
    {
      throw new HttpException( 'error : createInvitationForId', HttpStatus.BAD_REQUEST);
    }
  }


  async getInvitationInDm(inviterId: number, invitee: User) {
    try {
      const invitations = await this.prisma.gameInvitation.findMany({
        where: {
          status: "PENDING",
          OR: [
            {
              inviterId: inviterId,
              inviteeId: invitee.id,
            },
            {
              inviterId: invitee.id,
              inviteeId: inviterId,
            },
          ],
        },
        include: {
          inviter: {
            select:{
              username: true
            }
          }
        }
        
      });
      return invitations;
    } catch (error) {
      console.error(error);
    }
  }

  async getInvitationInGroup( groupId: number) {
    try {
      const invitations = await this.prisma.gameInvitation.findMany({
        where: {
          status: "PENDING",
          chatId: groupId 
        },
        include: {
          inviter: {
            select:{
              username: true
            }
          }
        }
      });
      return invitations;
    } catch (error) {
      console.error(error);
    }
  }

  async updateInviteStatus(user: User, inviteId: number, newStatus: InviteStatus) {
 
    const invitation = await this.prisma.gameInvitation.findUnique({
      where: {
        id: inviteId,
      },
    });
  
    if (!invitation) {
      throw new Error('Invitation not found');
    }
  

    if (invitation.inviterId !== user.id && invitation.inviteeId !== user.id) {
      throw new Error('You can`t update this invitation');
    }
  
    const updatedInvitation = await this.prisma.gameInvitation.update({
      where: {
        id: inviteId,
      },
      data: {
        status: newStatus,
      },
    });
  
    return updatedInvitation;
  }
}
