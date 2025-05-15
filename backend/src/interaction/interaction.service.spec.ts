import { Test, TestingModule } from '@nestjs/testing'
import { InteractionService } from './interaction.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

describe('InteractionService', () => {
  let service: InteractionService
  let prismaMock: any

  beforeEach(async () => {
    prismaMock = {
      chat: {
        findUnique: jest.fn(),
      },
      interaction: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteractionService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()

    service = module.get<InteractionService>(InteractionService)
    jest.clearAllMocks()
  })

  describe('findAllByChat', () => {
    it('should return intercalated user/ai entries if chat exists and belongs to user', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({ id: 'chat-1', userId: 'u1' })
      const raws = [
        {
          id: 'i1',
          question: 'Pergunta A',
          answer: 'Resposta A',
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'i2',
          question: 'Pergunta B',
          answer: 'Resposta B',
          createdAt: new Date('2025-01-02'),
        },
      ]
      prismaMock.interaction.findMany.mockResolvedValue(raws)

      const result = await service.findAllByChat('u1', 'chat-1')

      expect(prismaMock.chat.findUnique).toHaveBeenCalledWith({
        where: { id: 'chat-1' },
      })
      expect(prismaMock.interaction.findMany).toHaveBeenCalledWith({
        where: { chatId: 'chat-1' },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          question: true,
          answer: true,
          createdAt: true,
        },
      })
      expect(result).toEqual([
        { id: 'i1', sender: 'user', content: 'Pergunta A', createdAt: raws[0].createdAt },
        { id: 'i1', sender: 'ai',   content: 'Resposta A', createdAt: raws[0].createdAt },
        { id: 'i2', sender: 'user', content: 'Pergunta B', createdAt: raws[1].createdAt },
        { id: 'i2', sender: 'ai',   content: 'Resposta B', createdAt: raws[1].createdAt },
      ])
    })

    it('should throw NotFoundException if chat not found', async () => {
      prismaMock.chat.findUnique.mockResolvedValue(null)
      await expect(service.findAllByChat('u1', 'chat-1')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw NotFoundException if chat belongs to another user', async () => {
      prismaMock.chat.findUnique.mockResolvedValue({ id: 'chat-1', userId: 'other' })
      await expect(service.findAllByChat('u1', 'chat-1')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    it('should delete an interaction and return success message', async () => {
      // Arrange
      prismaMock.interaction.findUnique.mockResolvedValue({
        id: 'i5',
        chatId: 'chat-1',
      })
      prismaMock.chat.findUnique.mockResolvedValue({ id: 'chat-1', userId: 'u1' })
      prismaMock.interaction.delete.mockResolvedValue({})

      // Act
      const result = await service.remove('u1', 'i5')

      // Assert: agora esperamos o select no findUnique
      expect(prismaMock.interaction.findUnique).toHaveBeenCalledWith({
        where: { id: 'i5' },
        select: { chatId: true },
      })
      expect(prismaMock.chat.findUnique).toHaveBeenCalledWith({
        where: { id: 'chat-1' },
      })
      expect(prismaMock.interaction.delete).toHaveBeenCalledWith({
        where: { id: 'i5' },
      })
      expect(result).toEqual({ message: 'Interação removida com sucesso' })
    })

    it('should throw NotFoundException if interaction not found', async () => {
      prismaMock.interaction.findUnique.mockResolvedValue(null)
      await expect(service.remove('u1', 'i5')).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException if chat does not belong to user', async () => {
      prismaMock.interaction.findUnique.mockResolvedValue({
        id: 'i5',
        chatId: 'chat-1',
      })
      prismaMock.chat.findUnique.mockResolvedValue({ id: 'chat-1', userId: 'other' })
      await expect(service.remove('u1', 'i5')).rejects.toThrow(NotFoundException)
    })
  })
})