// src/chat/chat.service.ts

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { OcrClientService } from 'src/ocr-client/ocr-client.service'
import { AiApiService } from 'src/ai/ai-api.service'

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private ocr: OcrClientService,
    private ai: AiApiService,
  ) {}

  /** Cria um novo chat, gera a primeira resposta e obtém um título via IA */
  async createChat(userId: string, imagePath: string) {
    // 1. Extrai texto
    const extractedText = await this.ocr.analyze(imagePath)
    // 2. Cria o chat
    const chat = await this.prisma.chat.create({
      data: { userId, imageUrl: imagePath, extractedText },
    })

    // 3. Gera o resumo inicial
    let firstAnswer: string
    try {
      firstAnswer = await this.ai.complete(
        [
          'Você é um assistente que responde com base no texto extraído.',
          `Texto extraído: ${extractedText}`,
          'Por favor, forneça um resumo.',
        ].join('\n'),
      )
    } catch {
      throw new InternalServerErrorException('Erro ao gerar resposta inicial')
    }

    // 4. Persiste como uma interação sem pergunta (resumo inicial)
    await this.prisma.interaction.create({
      data: {
        chatId: chat.id,
        question: '',
        answer: firstAnswer,
      },
    })

    // 5. Gera título via LLM (ou fallback)
    let title: string
    try {
      title = (
        await this.ai.complete(
          [
            'Você é um assistente que cria títulos:',
            'gere um título curto (até 5 palavras).',
            `Texto extraído: ${extractedText}`,
          ].join('\n'),
        )
      )
        .trim()
        .split('\n')[0]
    } catch {
      title = firstAnswer
        .split(/\s+/)
        .slice(0, 4)
        .join(' ')
    }

    // 6. Atualiza o chat com o título
    await this.prisma.chat.update({
      where: { id: chat.id },
      data: { title },
    })

    // 7. Retorna
    return {
      ...chat,
      title,
    }
  }

  /**
   * Envia mensagem adicional a um chat existente:
   * cria UMA só Interaction com pergunta+resposta
   */
  async sendMessage(userId: string, chatId: string, message: string) {
    if (!chatId) {
      throw new BadRequestException('ID de chat obrigatório')
    }

    // 1. Valida chat
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } })
    if (!chat || chat.userId !== userId) {
      throw new NotFoundException('Chat não encontrado')
    }

    // 2. Gera resposta da IA
    const prompt = [
      'Você é um assistente que responde com base no texto extraído.',
      `Texto extraído: ${chat.extractedText}`,
      `Pergunta: ${message}`,
    ].join('\n')

    let answer: string
    try {
      answer = await this.ai.complete(prompt)
    } catch {
      throw new InternalServerErrorException('Erro ao gerar resposta')
    }

    // 3. Persiste a interação com pergunta e resposta
    const interaction = await this.prisma.interaction.create({
      data: {
        chatId,
        question: message,
        answer,
      },
    })

    return interaction
  }

  /** Lista todos os chats do usuário */
  async findAll(userId: string) {
    return this.prisma.chat.findMany({
      where: { userId },
      select: { id: true, title: true, imageUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  /** Busca um chat completo (texto + interações) */
  async findOne(userId: string, chatId: string) {
    if (!chatId) {
      throw new BadRequestException('ID de chat obrigatório')
    }

    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: {
        id: true,
        title: true,
        extractedText: true,
        interactions: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, question: true, answer: true, createdAt: true },
        },
      },
    })
    if (!chat) {
      throw new NotFoundException('Chat não encontrado')
    }
    return chat
  }

  /** Atualiza apenas o título de um chat */
  async updateTitle(userId: string, chatId: string, title: string) {
    if (!chatId) {
      throw new BadRequestException('ID de chat obrigatório')
    }
    const existing = await this.prisma.chat.findUnique({ where: { id: chatId } })
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Chat não encontrado')
    }
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { title },
    })
    return { message: 'Título atualizado com sucesso' }
  }

  /** Remove um chat e todas as suas interações */
  async deleteChat(userId: string, chatId: string) {
    if (!chatId) {
      throw new BadRequestException('ID de chat obrigatório')
    }
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } })
    if (!chat || chat.userId !== userId) {
      throw new NotFoundException('Chat não encontrado')
    }
    await this.prisma.interaction.deleteMany({ where: { chatId } })
    await this.prisma.chat.delete({ where: { id: chatId } })
    return { message: 'Chat removido com sucesso' }
  }
}
