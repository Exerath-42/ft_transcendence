import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { GameService } from 'src/game/game.service';

const games = {};

let queueOfPlayers = [];
const invitationsMap = {};
@WebSocketGateway(3002, { cors: true })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private gameService: GameService,
    private readonly prismaService: PrismaService,
  ) {}

  afterInit(server: Server) {}

  handleConnection(client: Socket, ...args: any[]) {}

  async handleDisconnect(client: Socket) {


    queueOfPlayers = queueOfPlayers.filter(
      (player) => player.socketId !== client.id,
    );

    for (const invitation in invitationsMap)
    {


      if (invitationsMap[invitation].player1.socketId === client.id)
      {
        if (!/^\d+$/.test(invitation)) {
          this.server.to(client.id).emit('gameError', {'message': "Invitation is not a number!"});
          return;
        }
  
        const invitationIdInt = parseInt(invitation, 10);
        if (isNaN(invitationIdInt)) {
          this.server.to(client.id).emit('gameError', {'message': "Invitation is not a number!"});
          return;
        }

        await this.prismaService.gameInvitation.update({
          where: {
            id: invitationIdInt
          },
          data: {
            status: "DECLINED"
          }
        })

        delete invitationsMap[invitation];
      }
    }

    let room;
    for (const gameId in games) {
      const game = games[gameId];
      if (game.p1Socket === client.id ) {
        room = game;
        room.p2Score = 42;
        room.p1Score = 0;
        break;
      }
      if(game.p2Socket === client.id)
      {
        room = game;
        room.p1Score = 42;
        room.p2Score = 0;
        break;
      }
    }

    if (room) {
      const roomId = String(room.id);
      this.server.to([room.p1Socket, room.p2Socket]).emit('opponentDisconnected');
     
      try{

      await this.gameService.updateGame(
        games[roomId].id,
        games[roomId].p1Score,
        games[roomId].p2Score,
      );
      }catch(err)
      {
        this.server.to(client.id).emit('gameError', {'message': 'Error saving game!'});
      }
      
      this.server.to([room.p1Socket, room.p2Socket]).emit('endGame', games[roomId]);
      delete games[roomId];
    }
  }

  isSocketInRoom(socketId, roomName) {
    const room = this.server.sockets.adapter.rooms.get(roomName);
    return room && room.has(socketId);
  }

  @SubscribeMessage('joinLobby')
  async handleJoinRoom(
    client: Socket,
    payload: { token: string; invitation: string },
  ) {
    const { token, invitation } = payload;
    const config = new ConfigService();

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, config.get('JWT_SECRET'));
    } catch (err) {
      this.server.to(client.id).emit('gameError', {'message': 'Invalid token'});
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
      this.server.to(client.id).emit('gameError', {'message': 'User not found'});
      return;
    }
    let player1;
    let player2;
    const isUserAlreadyInQueue = queueOfPlayers.some((player) => player.userId === user.id);

    let userIsPlaying = false;
    for (const gameId in games) {
      const game = games[gameId];
      if (game.p1Socket === client.id ) {
        userIsPlaying = true;
        break;
      }
      if(game.p2Socket === client.id)
      {
        userIsPlaying = true;
        break;
      }
    }


    if (isUserAlreadyInQueue || userIsPlaying)
     {
      this.server.to(client.id).emit('gameError', {'message': "User already in game section!"});
      client.disconnect();
      return;
     }
    let invitationIdInt;

    if (invitation === 'random') {
      
      queueOfPlayers.push({
        socket: client,
        socketId: client.id,
        userId: user.id,
      });

      if (queueOfPlayers.length >= 2) {
        player1 = queueOfPlayers.shift(); 
        player2 = queueOfPlayers.shift();
      }
    } else {
      if (!/^\d+$/.test(invitation)) {
        this.server.to(client.id).emit('gameError', {'message': "Invitation is not a number!"});
        return;
      }

      invitationIdInt = parseInt(invitation, 10);
      if (isNaN(invitationIdInt)) {
        this.server.to(client.id).emit('gameError', {'message': "Invitation is not a number!"});
        return;
      }

      const invitationObj = await this.prismaService.gameInvitation.findUnique({
        where: {
          id: invitationIdInt,
          status: "PENDING"
        },
      });

      if (!invitationObj) {
        this.server.to(client.id).emit('gameError', {'message': "Invitation not found or already finished!"});
        return;
      }

      if (
        invitationObj.inviteType === "USER" &&
        invitationObj.inviteeId !== user.id &&
        invitationObj.inviterId !== user.id
      ) {
        this.server.to(client.id).emit('gameError', {'message': "User is not on this invitation!"});
        return;
      }


      if (invitationObj.inviteType === "GROUP")
      {
        const chatUser = await this.prismaService.chatUser.findFirst({
          where: {
            chatId: invitationObj.chatId,
            userId: user.id,
            member: true
          }
        });

        if (!chatUser) {
          this.server.to(client.id).emit('gameError', {'message': "User is not member of this room!"});
          return;
        }
      }

      if (!invitationsMap[invitationIdInt]?.player1) {
        invitationsMap[invitationIdInt] = {
          player1: {
            socket: client,
            socketId: client.id,
            userId: user.id,
          },
        };
      } else if (invitationsMap[invitationIdInt].player1.userId != user.id) {
        player1 = invitationsMap[invitationIdInt].player1;
        player2 = {
          socket: client,
          socketId: client.id,
          userId: user.id,
        };

        const invitationObjAccepted = await this.prismaService.gameInvitation.update({
          where: {
            id: invitationIdInt,
          },
          data: {
            status: "ACCEPTED"
          }
        });
      }

 
    }

    if (!player1?.userId || !player2?.userId) {
      
      return;
    }
    const game = await this.gameService.createGame(
      player1.userId,
      player2.userId,
      invitationIdInt
    );
    delete invitationsMap[invitationIdInt];
    let ballVx;
    let ballVy;
      ballVx = Math.random() >= 0.5 ? -1.5 : 1.5;
    do {
      ballVy = Math.random() * 6 - 3;
    } while (ballVy > -1.5 && ballVy < 1.5);

    const gameObj = {
      id: game.id,
      start: Date.now() + 5000,
      ballVx: ballVx,
      ballVy: ballVy,
      p1Score: 0,
      p2Score: 0,
      p1Socket: player1.socketId,
      p2Socket: player2.socketId
    };

    games[game.id] = gameObj;

    this.server.to(player1.socketId).emit('matched', { game: game });
    this.server.to(player2.socketId).emit('matched', { game: game });

    player1.socket.join(game.id);
    player2.socket.join(game.id);
    

    return;
  }

  @SubscribeMessage('startGame')
  async startGame(client: Socket, payload: { room: string; player: number }) {
    const isClientInRoom = client.rooms.has(payload.room);

    if (!isClientInRoom) {
      client.join(payload.room);
    }
    this.server.to(payload.room).emit('start', games[payload.room]);
  }

  @SubscribeMessage('isGhost')
  async isGhost(client: Socket, payload: { room: string; player: number, isGhost: boolean }) {
    const isClientInRoom = client.rooms.has(payload.room);

    if (!isClientInRoom) {
      client.join(payload.room);
    }
    this.server.to(payload.room).emit('isGameGhost', {isGhost: payload.isGhost});
  }



  @SubscribeMessage('updateGame')
  async updateGame(
    client: Socket,
    payload: { room: string; player: number; ballX: number; ballY: number },
  ) {
    if (payload.player === 2)
    {
      return;
    }
    this.server.to(payload.room).emit('update', games[payload.room]);
  }

  @SubscribeMessage('updateBall')
  async updateBall(
    client: Socket,
    payload: any,
  ) {
    this.server.to(payload.room).emit('updateBall', { ...payload });
  }

  @SubscribeMessage('score')
  async updateScore(
    client: Socket,
    payload: { room: string; player: number; ballX: number; ballY: number },
  ) {
    if (payload.player === 1) {
      games[payload.room].p1Score = games[payload.room].p1Score + 1;
     
    } else if (payload.player === 2) {
      games[payload.room].p2Score = games[payload.room].p2Score + 1;
    
    }
    let ballVx;
    let ballVy;
      ballVx = Math.random() * 6 - 3;
      ballVy = Math.random() * 6 - 3;
    games[payload.room].ballVx = ballVx;
    games[payload.room].ballVy = ballVy;
    const updated = {
      ...games[payload.room],
      start: Date.now() + 5000,
      ballVx: ballVx,
      ballVy: ballVy,
    };
    this.server.to(payload.room).emit('updateScore', updated);
    if (games[payload.room].p1Score === 3 || games[payload.room].p2Score === 3) {
      await this.gameService.updateGame(
        games[payload.room].id,
        games[payload.room].p1Score,
        games[payload.room].p2Score,
      );
      this.server.to(payload.room).emit('endGame', updated);
      delete games[payload.room];
    }
  }


  @SubscribeMessage('ghost')
  async ghostMode(
    client: Socket,
    payload: { room: string; player: number;},
  ) {
    this.server.to(payload.room).emit('ghost', {'ghost': true});
  }

  @SubscribeMessage('ArrowUpPressed')
  async handleArrowUpPressed(
    client: Socket,
    payload: {
      room: string;
      player: number;
      player1Obj: any;
      player2Obj: any;
      time: string;
    },
  ) {
    this.server.to(payload.room).emit('ArrowUpP', payload);
  }

  @SubscribeMessage('ArrowDownPressed')
  async handleArrowDown(
    client: Socket,
    payload: {
      room: string;
      player: number;
      player1Obj: any;
      player2Obj: any;
      time: string;
    },
  ) {
    this.server.to(payload.room).emit('ArrowDownP', payload);
  }

  @SubscribeMessage('ArrowUpReleased')
  async handleArrowUpReleased(
    client: Socket,
    payload: {
      room: string;
      player: number;
      player1Obj: any;
      player2Obj: any;
      time: string;
    },
  ) {
    this.server.to(payload.room).emit('ArrowUpR', payload);
  }

  @SubscribeMessage('ArrowDownReleased')
  async handleArrowDownReleased(
    client: Socket,
    payload: {
      room: string;
      player: number;
      player1Obj: any;
      player2Obj: any;
      time: string;
    },
  ) {
    this.server.to(payload.room).emit('ArrowDownR', payload);
  }
}

