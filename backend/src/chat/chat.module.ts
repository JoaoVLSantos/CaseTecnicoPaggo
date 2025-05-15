import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatPdfService } from './chat-pdf.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OcrClientModule } from 'src/ocr-client/ocr-client.module';
import { AiApiModule } from 'src/ai/ai-api.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), OcrClientModule, AiApiModule,],
  controllers: [ChatController],
  providers: [ChatService, ChatPdfService, PrismaService],
})

export class ChatModule {}