import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy, Jwt2faStrategy } from './strategy';
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, Jwt2faStrategy],
  imports: [HttpModule, JwtModule.register({})],
})
export class AuthModule {}
