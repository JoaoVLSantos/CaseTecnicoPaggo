import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { InteractionModule } from './interaction/interaction.module';
import { OcrClientModule } from './ocr-client/ocr-client.module';
import { AiApiModule } from './ai/ai-api.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
   
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UserModule,
    ChatModule,
    InteractionModule,
    OcrClientModule,
    AiApiModule,   
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,  
  ],
})
export class AppModule {}
