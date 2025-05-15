import { Controller, Get, Param, Delete, Req, UseGuards, BadRequestException } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { InteractionService } from './interaction.service'

@Controller('chats/:chatId/interactions')
@UseGuards(JwtAuthGuard)
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  /** GET /chats/:chatId/interactions */
  @Get()
  findAll(
    @Req() req: any,
    @Param('chatId') chatId: string,
  ) {
    const chatIdNum = Number(chatId)
    if (Number.isNaN(chatIdNum)) {
      throw new BadRequestException('ID de chat inválido')
    }
    return this.interactionService.findAllByChat(req.user.userId, chatIdNum.toString())
  }

  /** DELETE /chats/:chatId/interactions/:id */
  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const interactionId = Number(id)
    if (Number.isNaN(interactionId)) {
      throw new BadRequestException('ID de interação inválido')
    }
    return this.interactionService.remove(req.user.userId, interactionId.toString())
  }
}
