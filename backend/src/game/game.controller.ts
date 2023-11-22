import { Controller, Delete, Post, Req, UseGuards, Body, Get, Param,BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GameService } from './game.service';

import { Request } from 'express';
import { User, InviteStatus} from '@prisma/client';

@Controller('games')
export class GameController {
	constructor(private gameService: GameService){}

	@UseGuards(AuthGuard('jwt'))
	@Get('/')
	async listGames(@Req() req: Request)
	{
		const games = await this.gameService.getAllFinishedGames();
	
		this.gameService.deepDeleteKey(games, "twoFactorAuthenticationSecret");
		this.gameService.deepDeleteKey(games, "password");
		return games;
	}

	@UseGuards(AuthGuard('jwt'))
	@Get(':gameId')
	async getGameById(@Req() req: Request, @Param('gameId') gameId)
	{
		try{
			const intId = parseInt(gameId)
			const game = await this.gameService.getGameById(intId);
			this.gameService.deepDeleteKey(game, "twoFactorAuthenticationSecret");
			this.gameService.deepDeleteKey(game, "password");
			return game;
		}
		catch(error)
		{
			throw error;
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@Get('/user/:userId')
	async getGameByUserId(@Req() req: Request, @Param('userId') userId)
	{
		const gamesFromUser = await this.gameService.gamesFromUser(parseInt(userId));
		this.gameService.deepDeleteKey(gamesFromUser, "twoFactorAuthenticationSecret");
		this.gameService.deepDeleteKey(gamesFromUser, "password");
		return gamesFromUser
	}

	@UseGuards(AuthGuard('jwt'))
	@Get('/invite/user/:userId')
	async inviteUser(@Req() req: Request, @Param('userId') userId )
	{
		const user = req.user as User;
		if (!/^\d+$/.test(userId)) {
			throw new BadRequestException('Invalid invitee id. Must be a number.');
		}

		const userIdInt = parseInt(userId, 10);

		if (isNaN(userIdInt)) {
		  throw new BadRequestException('Failed to parse roomId.');
		}

		const invitation = await this.gameService.createInvitationForId(user, userIdInt);
		this.gameService.deepDeleteKey(invitation, "twoFactorAuthenticationSecret");
		this.gameService.deepDeleteKey(invitation, "password");
		return invitation;
	}

	@UseGuards(AuthGuard('jwt'))
	@Get('/invite/dm/:userId')
	async invitationsFromDm(@Req() req: Request, @Param('userId') userId )
	{
		const user = req.user as User;
		if (!/^\d+$/.test(userId)) {
			throw new BadRequestException('Invalid invitee id. Must be a number.');
		}

		const userIdInt = parseInt(userId, 10);

		if (isNaN(userIdInt)) {
		  throw new BadRequestException('Failed to parse roomId.');
		}

		const invitations = await this.gameService.getInvitationInDm(userIdInt, user);
		this.gameService.deepDeleteKey(invitations, "twoFactorAuthenticationSecret");
		this.gameService.deepDeleteKey(invitations, "password");
		return invitations;
	}

	@UseGuards(AuthGuard('jwt'))
	@Delete('/invite/:invitationId')
	async endInvite(@Req() req: Request, @Param('invitationId') invitationId: string)
	{
		const user = req.user as User;
		if (!/^\d+$/.test(invitationId)) {
			throw new BadRequestException('Invalid invitee id. Must be a number.');
		}

		const invitationIdInt = parseInt(invitationId, 10);

		if (isNaN(invitationIdInt)) {
		  throw new BadRequestException('Failed to parse invitationId.');
		}

		try{
			const invite = await this.gameService.updateInviteStatus(user, invitationIdInt, InviteStatus.ACCEPTED)
			this.gameService.deepDeleteKey(invite, "twoFactorAuthenticationSecret");
			this.gameService.deepDeleteKey(invite, "password");
			return invite;
		}catch(err)
		{
			throw err;
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@Get('/invite/group/:groupId')
	async inviteGroup(@Req() req: Request, @Param('groupId') groupId )
	{
		const user = req.user as User;
		if (!/^\d+$/.test(groupId)) {
			throw new BadRequestException('Invalid invitee id. Must be a number.');
		}

		const groupIdInt = parseInt(groupId, 10);

		if (isNaN(groupIdInt)) {
		  throw new BadRequestException('Failed to parse roomId.');
		}

		const invitation = await this.gameService.createInvitationForGroup(user, groupIdInt);
		this.gameService.deepDeleteKey(invitation, "twoFactorAuthenticationSecret");
		this.gameService.deepDeleteKey(invitation, "password");
		return invitation;
	}

	@UseGuards(AuthGuard('jwt'))
	@Get('/invite/list/group/:groupId')
	async invitationsFromGroup(@Req() req: Request,  @Param('groupId') groupId )
	{
		
		const user = req.user as User;
		if (!/^\d+$/.test(groupId)) {
			throw new BadRequestException('Invalid invitee id. Must be a number.');
		}
		
		const groupIdInt = parseInt(groupId, 10);

		if (isNaN(groupIdInt)) {
		  throw new BadRequestException('Failed to parse roomId.');
		}


		const invitations = await this.gameService.getInvitationInGroup(groupIdInt);
		this.gameService.deepDeleteKey(invitations, "twoFactorAuthenticationSecret");
		this.gameService.deepDeleteKey(invitations, "password");
		return invitations;
	}
}
