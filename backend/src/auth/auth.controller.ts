import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  HttpException,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
  HttpCode,
  Get,
  Delete,
  BadRequestException
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {
    
    this.updateState();

    setInterval(() => {
     
      this.updateState();
    }, 180000); 
  }


  updateState(){
    this.urlState = uuidv4();
  }
  public urlState;

  @Get('currState')
  async getCurrentState()
  {
    return {state: this.urlState};
  }

  @Get('test')
  async test() {
    const { token, tfa } = await this.authService.signinTest();
    return { access_token: token.access_token, tfa: tfa };
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async exchange(@Body('code') code: string, @Body('state') state: string) {

    if (state != this.urlState)
    {
      throw new BadRequestException('Bad state.');
    }
    const { token, isNew, tfa } = await this.authService.signin(code, state);
 
    if (isNew) {
      throw new HttpException(
        { access_token: token.access_token, tfa: tfa },
        HttpStatus.CREATED,
      );
    } else {
      return { access_token: token.access_token, tfa: tfa };
    }
  }

  @Post('2fa/generate')
  @UseGuards(AuthGuard('jwt'))
  async register(@Res() response, @Req() request) {

    const { otpAuthUrl } =
      await this.authService.generateTwoFactorAuthenticationSecret(
        request.user,
      );

    return response.json(
      await this.authService.generateQrCodeDataURL(otpAuthUrl),
    );
  }

  @Post('2fa/turn-on')
  @UseGuards(AuthGuard('jwt'))
  async turnOnTwoFactorAuthentication(@Req() request, @Body() body) {
    
    let userWithTfa;
    try {
      const isCodeValid = this.authService.isTwoFactorAuthenticationCodeValid(
        body.twoFactorAuthenticationCode,
        request.user,
      );
     
      if (!isCodeValid) {
        throw new UnauthorizedException('Wrong authentication code');
      }
     
      userWithTfa = await this.authService.turnOnTwoFactorAuthentication(
        request.user.id,
      );
      
      return userWithTfa;
    } catch (error) {
      
      throw error;
    }

   
  }

  @Delete('2fa/turn-on')
  @UseGuards(AuthGuard('jwt'))
  async turnOffTwoFactorAuthentication(@Req() request, @Body() body) {
    const userWithoutTfa =
      await this.authService.turnOffTwoFactorAuthentication(request.user.id);
    return userWithoutTfa;
  }

  @Post('2fa/authenticate')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt-2fa'))
  async authenticate(@Req() request, @Body() body) {
    const isCodeValid = this.authService.isTwoFactorAuthenticationCodeValid(
      body.twoFactorAuthenticationCode,
      request.user,
    );
    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }
    const { token, tfa } = await this.authService.loginWith2fa(request.user);
    return { access_token: token.access_token, tfa: tfa };
  }
}
