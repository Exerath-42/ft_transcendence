
declare enum USERSTATUS {
	ONLINE = "ONLINE",
	OFFLINE = "OFFLINE",
	GAME = "GAME",
}

declare interface User {
	id: number;
	student_username: string;
	image_url: string;
	username?: string;
	friends?: Array<User>;
	blocks?: Array<User>;
	isTwoFactorAuthenticationEnabled: boolean;
	wins: number;
	losses: number;

	status: USERSTATUS;
}

declare type UserAuth = {
	token: string;
};

declare interface Room {
	id: number;
	name: string;
	isPrivate: boolean;
	hasPassword: boolean;
	ownerId: number;
	owner: User;
}

declare interface messageEventInterface {
	senderId: number;
	username: string;
	text: string;
	time: string;
}

declare interface RoomMember {
	chatId: number;
	userId: number;
	member: boolean;
	admin: boolean;
	mute: boolean;
	user: { username: string; id: number };
}

declare interface Game {
	id: number;
	player1Id: number;
	player1: User;
	player2Id: number;
	player2: User;
	score1: number;
	score2: number;
	winner?: string;
	invitationId?: number | null;
	invitation?: GameInvitation | null;
	createdAt: Date;
	updatedAt: Date;
}

declare enum GameWinner {
	PLAYER1,
	PLAYER2,
	DRAW,
	NOTFINISHED,
}

declare enum InviteType {
	USER = "USER",
	GROUP = "GROUP",
}

type GameInvitation = {
	id: number;
	inviterId: number;
	chatId: number;
	inviteType: InviteType;
	inviter: User;
};
