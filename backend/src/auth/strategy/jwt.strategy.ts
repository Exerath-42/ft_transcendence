import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: number }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      include: {
        friends: true,
        blocks: true,
      },
    });


    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (!user.isTwoFactorAuthenticationEnabled) {
      return user;
    }

    if (user.isTwoFactorAuthenticated) {
      return user;
    }

    throw new UnauthorizedException(
      'Two-factor authentication is not complete.',
    );
  }
}
