import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

export type ChatInteraction = {
  id: string           // permanece string UUID
  sender: 'user' | 'ai'
  content: string
  createdAt: Date
}

@Injectable()
export class InteractionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retorna todo o histórico de um chat, marcando quem enviou cada mensagem:
   * para cada registro em Interaction:
   *   – 'user' → question
   *   – 'ai'   → answer
   */
  async findAllByChat(userId: string, chatId: string): Promise<ChatInteraction[]> {
    // 1. valida se o chat existe e pertence ao usuário
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } })
    if (!chat || chat.userId !== userId) {
      throw new NotFoundException('Chat não encontrado')
    }

    // 2. busca todas as interações em ordem cronológica
    const raws = await this.prisma.interaction.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        question: true,
        answer: true,
        createdAt: true,
      },
    })

    // 3. monta uma lista intercalada [pergunta, resposta, ...]
    const result: ChatInteraction[] = []
    for (const intr of raws) {
      result.push({
        id: intr.id,
        sender: 'user',
        content: intr.question,
        createdAt: intr.createdAt,
      })
      result.push({
        id: intr.id,
        sender: 'ai',
        content: intr.answer,
        createdAt: intr.createdAt,
      })
    }

    return result
  }

  /**
   * Remove uma interação (pergunta+resposta) completa,
   * após validar propriedade do chat.
   */
  async remove(userId: string, interactionId: string) {
    if (!interactionId) {
      throw new BadRequestException('ID de interação inválido')
    }

    // 1. recupera a interação e seu chatId
    const intr = await this.prisma.interaction.findUnique({
      where: { id: interactionId },
      select: { chatId: true },
    })
    if (!intr) throw new NotFoundException('Interação não encontrada')

    // 2. valida se o chat pertence ao usuário
    const chat = await this.prisma.chat.findUnique({
      where: { id: intr.chatId },
    })
    if (!chat || chat.userId !== userId) {
      throw new NotFoundException('Chat não encontrado')
    }

    // 3. deleta a interação inteira
    await this.prisma.interaction.delete({ where: { id: interactionId } })
    return { message: 'Interação removida com sucesso' }
  }
}