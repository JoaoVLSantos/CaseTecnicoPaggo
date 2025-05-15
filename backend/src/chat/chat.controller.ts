// src/chat/chat.controller.ts
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { ChatService } from './chat.service'
import { ChatPdfService } from './chat-pdf.service'
import { FileInterceptor } from '@nestjs/platform-express/multer'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { Response as ExResponse } from 'express'

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatPdfService: ChatPdfService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_, file, cb) =>
        cb(null, `${Date.now()}${extname(file.originalname)}`),
    }),
    fileFilter: (_, file, cb) => {
      if (/^image\/(png|jpe?g)$/.test(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new BadRequestException('Somente PNG/JPG permitidos'), false)
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async createChat(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Imagem obrigatória')
    return this.chatService.createChat(req.user.userId, file.path)
  }

  @Get()
  async listChats(@Req() req: any) {
    return this.chatService.findAll(req.user.userId)
  }

  @Get(':chatId')
  async getChat(
    @Req() req: any,
    @Param('chatId') chatId: string,
  ) {
    return this.chatService.findOne(req.user.userId, chatId)
  }

  @Post(':chatId/messages')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Req() req: any,
    @Param('chatId') chatId: string,
    @Body('message') message: string,
  ) {
    return this.chatService.sendMessage(req.user.userId, chatId, message)
  }

  @Get(':chatId/download')
  async downloadChat(
    @Req() req: any,
    @Param('chatId') chatId: string,
    @Res() res: ExResponse,
  ) {
    const userId = req.user.userId
    const pdfBytes = await this.chatPdfService.generateChatPdf(chatId, userId)
    // Ajusta headers para download
    res
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="chat-${chatId}.pdf"`,
        'Content-Length': pdfBytes.length,
      })
      .send(Buffer.from(pdfBytes))
  }

  @Delete(':chatId')
  async deleteChat(
    @Req() req: any,
    @Param('chatId') chatId: string,
  ) {
    return this.chatService.deleteChat(req.user.userId, chatId)
  }
}
