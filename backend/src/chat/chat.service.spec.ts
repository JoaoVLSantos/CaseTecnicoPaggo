// src/chat/chat.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import {
  ChatService,
} from './chat.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { OcrClientService } from 'src/ocr-client/ocr-client.service'
import { AiApiService } from 'src/ai/ai-api.service'
import {
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'

describe('ChatService', () => {
  let service: ChatService
  let prisma: any
  let ocr: any
  let ai: any

  beforeEach(async () => {
    // mocks para Prisma, OCR e AI
    prisma = {
      chat: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      interaction: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    }
    ocr = { analyze: jest.fn() }
    ai = { complete: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: OcrClientService, useValue: ocr },
        { provide: AiApiService, useValue: ai },
      ],
    }).compile()

    service = module.get(ChatService)
  })

  describe('createChat', () => {
    it('deve criar chat, gerar resumo e título', async () => {
      ocr.analyze.mockResolvedValue('textoX')
      prisma.chat.create.mockResolvedValue({
        id: 'c1',
        userId: 'u1',
        imageUrl: 'path.png',
        extractedText: 'textoX',
      })
      // firstAnswer e title
      ai.complete
        .mockResolvedValueOnce('meu resumo')
        .mockResolvedValueOnce('MeuTítulo')
      prisma.interaction.create.mockResolvedValue({})

      const result = await service.createChat('u1', 'path.png')

      expect(ocr.analyze).toHaveBeenCalledWith('path.png')
      expect(prisma.chat.create).toHaveBeenCalledWith({
        data: { userId: 'u1', imageUrl: 'path.png', extractedText: 'textoX' },
      })
      expect(ai.complete).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('Texto extraído: textoX'),
      )
      expect(prisma.interaction.create).toHaveBeenCalledWith({
        data: { chatId: 'c1', question: '', answer: 'meu resumo' },
      })
      expect(ai.complete).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('gere um título curto'),
      )
      expect(prisma.chat.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { title: 'MeuTítulo' },
      })
      expect(result).toEqual({ id: 'c1', userId: 'u1', imageUrl: 'path.png', extractedText: 'textoX', title: 'MeuTítulo' })
    })

    it('deve usar fallback de título se IA falhar', async () => {
      ocr.analyze.mockResolvedValue('abc')
      prisma.chat.create.mockResolvedValue({ id: 'c2', userId: 'u2', imageUrl: 'p', extractedText: 'abc' })
      ai.complete
        .mockResolvedValueOnce('isto é um resumo muito longo')
        .mockRejectedValueOnce(new Error('fail'))
      prisma.interaction.create.mockResolvedValue({})
      prisma.chat.update.mockResolvedValue({})

      const res = await service.createChat('u2', 'p')
      // fallback são as 4 primeiras palavras
      expect(res.title).toBe('isto é um resumo')
    })

    it('deve lançar se IA de resumo falhar', async () => {
      ocr.analyze.mockResolvedValue('x')
      prisma.chat.create.mockResolvedValue({ id: 'c3', userId: 'u3', imageUrl: 'f', extractedText: 'x' })
      ai.complete.mockRejectedValueOnce(new Error('err'))
      await expect(service.createChat('u3', 'f')).rejects.toThrow(
        InternalServerErrorException,
      )
    })
  })

  describe('sendMessage', () => {
    beforeEach(() => {
      // reset mocks
      jest.clearAllMocks()
    })

    it('deve lançar BadRequestException se chatId vazio', async () => {
      await expect(
        service.sendMessage('u', '', 'msg'),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve lançar NotFoundException se chat não existir ou pertencer a outro', async () => {
      prisma.chat.findUnique.mockResolvedValue(null)
      await expect(
        service.sendMessage('u1', 'cX', 'hi'),
      ).rejects.toThrow(NotFoundException)

      prisma.chat.findUnique.mockResolvedValue({ id: 'cX', userId: 'other', extractedText: 't' })
      await expect(
        service.sendMessage('u1', 'cX', 'hi'),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve gerar resposta e criar interação', async () => {
      prisma.chat.findUnique.mockResolvedValue({ id: 'c1', userId: 'u1', extractedText: 'txt' })
      ai.complete.mockResolvedValue('respY')
      prisma.interaction.create.mockResolvedValue({ id: 'i1', chatId: 'c1', question: 'q', answer: 'respY' })

      const out = await service.sendMessage('u1', 'c1', 'q')
      expect(ai.complete).toHaveBeenCalledWith(expect.stringContaining('Pergunta: q'))
      expect(prisma.interaction.create).toHaveBeenCalledWith({
        data: { chatId: 'c1', question: 'q', answer: 'respY' },
      })
      expect(out).toEqual({ id: 'i1', chatId: 'c1', question: 'q', answer: 'respY' })
    })

    it('deve lançar se IA falhar', async () => {
      prisma.chat.findUnique.mockResolvedValue({ id: 'c1', userId: 'u1', extractedText: 't' })
      ai.complete.mockRejectedValue(new Error('err'))
      await expect(
        service.sendMessage('u1', 'c1', 'q'),
      ).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('findAll', () => {
    it('deve retornar lista de chats', async () => {
      const list = [{ id: 'a1' }, { id: 'a2' }]
      prisma.chat.findMany.mockResolvedValue(list)
      const out = await service.findAll('uX')
      expect(prisma.chat.findMany).toHaveBeenCalledWith({
        where: { userId: 'uX' },
        select: { id: true, title: true, imageUrl: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
      expect(out).toBe(list)
    })
  })

  describe('findOne', () => {
    it('deve lançar BadRequestException se chatId vazio', async () => {
      await expect(
        service.findOne('u', ''),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve lançar NotFoundException se não achar', async () => {
      prisma.chat.findFirst.mockResolvedValue(null)
      await expect(
        service.findOne('u1', 'cX'),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve retornar chat completo', async () => {
      const full = {
        id: 'c1',
        title: 'T',
        extractedText: 'txt',
        interactions: [],
      }
      prisma.chat.findFirst.mockResolvedValue(full)
      const out = await service.findOne('u1', 'c1')
      expect(prisma.chat.findFirst).toHaveBeenCalledWith({
        where: { id: 'c1', userId: 'u1' },
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
      expect(out).toBe(full)
    })
  })

  describe('updateTitle', () => {
    it('deve lançar BadRequestException se chatId vazio', async () => {
      await expect(
        service.updateTitle('u', '', 'new'),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve lançar NotFoundException se chat não for encontrado ou pertencer a outro', async () => {
      prisma.chat.findUnique.mockResolvedValue(null)
      await expect(
        service.updateTitle('u1', 'cX', 't'),
      ).rejects.toThrow(NotFoundException)

      prisma.chat.findUnique.mockResolvedValue({ id: 'cX', userId: 'other' })
      await expect(
        service.updateTitle('u1', 'cX', 't'),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve atualizar título corretamente', async () => {
      prisma.chat.findUnique.mockResolvedValue({ id: 'c1', userId: 'u1' })
      prisma.chat.update.mockResolvedValue({})
      const res = await service.updateTitle('u1', 'c1', 'novo')
      expect(prisma.chat.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { title: 'novo' },
      })
      expect(res).toEqual({ message: 'Título atualizado com sucesso' })
    })
  })

  describe('deleteChat', () => {
    it('deve lançar BadRequestException se chatId vazio', async () => {
      await expect(
        service.deleteChat('u', ''),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve lançar NotFoundException se chat não encontrado ou pertencer a outro', async () => {
      prisma.chat.findUnique.mockResolvedValue(null)
      await expect(
        service.deleteChat('u1', 'cX'),
      ).rejects.toThrow(NotFoundException)

      prisma.chat.findUnique.mockResolvedValue({ id: 'cX', userId: 'other' })
      await expect(
        service.deleteChat('u1', 'cX'),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve deletar chat e interações', async () => {
      prisma.chat.findUnique.mockResolvedValue({ id: 'c1', userId: 'u1' })
      prisma.interaction.deleteMany.mockResolvedValue({})
      prisma.chat.delete.mockResolvedValue({})
      const res = await service.deleteChat('u1', 'c1')
      expect(prisma.interaction.deleteMany).toHaveBeenCalledWith({ where: { chatId: 'c1' } })
      expect(prisma.chat.delete).toHaveBeenCalledWith({ where: { id: 'c1' } })
      expect(res).toEqual({ message: 'Chat removido com sucesso' })
    })
  })
})
