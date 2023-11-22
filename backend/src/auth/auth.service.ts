import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';

import { toDataURL } from 'qrcode';

import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private jwt: JwtService,
  ) {}

  async signToken(userId: number): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
    };
    const secret = process.env.JWT_SECRET;

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '240m',
      secret: secret,
    });
    return {
      access_token: token,
    };
  }

  async sign2faToken(userId: number): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
    };
    const secret = process.env.JWT_SECRET_2FA;

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '42m',
      secret: secret,
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorAuthenticated: true },
    });

    return {
      access_token: token,
    };
  }

  async exchangeCodeForToken(code: string, state: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('https://api.intra.42.fr/oauth/token', {
          grant_type: 'authorization_code',
          client_id: process.env.FT_UID,
          client_secret: process.env.FT_SECRET,
          code,
          redirect_uri: process.env.URL,
          state: state,          
        }),
      );
      const accessToken = response.data.access_token;
      return accessToken;
    } catch (error) {
      throw new HttpException( 'error : exchangeCodeForToken', HttpStatus.BAD_REQUEST);
    }
  }

  async userFromToken(token: string) {
    const response = await firstValueFrom(
      this.httpService.get('https://api.intra.42.fr/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    return response.data;
  }

  async signinTest(): Promise<{ token: any; tfa: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: 1,
      },
    });

    

    if (user.isTwoFactorAuthenticationEnabled) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isTwoFactorAuthenticated: false },
      });
      return {
        token: await this.sign2faToken(user.id),
        tfa: user.isTwoFactorAuthenticationEnabled,
      };
    }
    return {
      token: await this.signToken(user.id),
      tfa: user.isTwoFactorAuthenticationEnabled,
    };
  }

  async signin(
    code: string,
    state: string
  ): Promise<{ token: any; isNew: boolean; tfa: boolean }> {
    const token = await this.exchangeCodeForToken(code, state);
    const ft_user_id = await this.userFromToken(token);

    let user = await this.prisma.user.findUnique({
      where: {
        student_username: ft_user_id.login,
      },
    });

    if (user) {
      if (user.isTwoFactorAuthenticationEnabled)
      {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { isTwoFactorAuthenticated: false },
        });
      }
      if (user.isTwoFactorAuthenticationEnabled && user.twoFactorAuthenticationSecret) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { isTwoFactorAuthenticated: false },
        });
        return {
          token: await this.sign2faToken(user.id),
          isNew: false,
          tfa: user.isTwoFactorAuthenticationEnabled,
        };
      }

      return {
        token: await this.signToken(user.id),
        isNew: false,
        tfa: user.isTwoFactorAuthenticationEnabled,
      };
    }

    user = await this.prisma.user.create({
      data: {
        student_username: ft_user_id.login,
        student_email: ft_user_id.email,
        image_url: ft_user_id.image.link,
        username: ft_user_id.login + '-' + uuidv4().slice(0, 4),
      },
    });

    return {
      token: await this.signToken(user.id),
      isNew: true,
      tfa: user.isTwoFactorAuthenticationEnabled,
    };

  }
async setTwoFactorAuthenticationSecret(secret: string, userId: number) {
    try {
      const userWithSecret = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          twoFactorAuthenticationSecret: secret,
        },
      });
      return userWithSecret;
    } catch (error) {
        throw new HttpException( 'error : setTwoFactorAuthenticationSecret', HttpStatus.BAD_REQUEST);
    }
  }

  async generateTwoFactorAuthenticationSecret(user: User) {
    const secret = authenticator.generateSecret();

    const otpAuthUrl = authenticator.keyuri(user.student_email, 'PONG', secret);

    await this.setTwoFactorAuthenticationSecret(secret, user.id);
    return {
      secret,
      otpAuthUrl,
    };
  }

  async generateQrCodeDataURL(otpAuthUrl: string) {
    return toDataURL(otpAuthUrl);
  }

  async turnOnTwoFactorAuthentication(userId: number) {
    try {
      const userWithSecret = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isTwoFactorAuthenticationEnabled: true,
        },
      });
      return userWithSecret;
    } catch (error) {
      throw new HttpException( 'error : turnOnTwoFactorAuthentication', HttpStatus.BAD_REQUEST);
    }
  }

  async turnOffTwoFactorAuthentication(userId: number) {
    try {
      const userWithoutTfa = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isTwoFactorAuthenticationEnabled: false,
          twoFactorAuthenticationSecret: null,
        },
      });
      return userWithoutTfa;
    } catch (error) {
      throw new HttpException( 'error : turnOffTwoFactorAuthentication', HttpStatus.BAD_REQUEST);
    }
  }

  isTwoFactorAuthenticationCodeValid(
    twoFactorAuthenticationCode: string,
    user: User,
  ) {
    if (!user.twoFactorAuthenticationSecret)
    {
      return;
    }
    try {
      return authenticator.verify({
        token: twoFactorAuthenticationCode,
        secret: user.twoFactorAuthenticationSecret,
      });
    } catch (error) {
      throw error;
    }
  }

  async loginWith2fa(user: Partial<User>) {

    return {
      token: await this.signToken(user.id),
      isNew: true,
      tfa: user.isTwoFactorAuthenticationEnabled,
    };
  }
}
