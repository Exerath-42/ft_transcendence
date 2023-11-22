import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class Jwt2faStrategy extends PassportStrategy(Strategy, 'jwt-2fa') {
	constructor(config: ConfigService, private prisma: PrismaService) {
		super({
		  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
		  secretOrKey: config.get('JWT_SECRET_2FA'),
		});
	  }

	  async validate(payload: any) {
		const user = await this.prisma.user.findUnique({
			where: {
				id: payload.sub,
			  },
		});
		return user;
	
		
	  }
}
