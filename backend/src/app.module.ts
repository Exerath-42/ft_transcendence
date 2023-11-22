import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { DirectMessageModule } from './direct-message/direct-message.module';
import { GameModule } from './game/game.module';
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    ChatModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ChatModule,
    DirectMessageModule,
    GameModule,
  ],
})
export class AppModule {}
