// src/chat/chat.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { ChatPdfService } from './chat-pdf.service'
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { Response as ExResponse } from 'express'

describe('ChatController', () => {
  let controller: ChatController
  let chatService: Partial<Record<keyof ChatService, jest.Mock>>
  let pdfService: Partial<Record<keyof ChatPdfService, jest.Mock>>
  let mockRes: Partial<ExResponse>

  beforeEach(async () => {
    chatService = {
      createChat: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      sendMessage: jest.fn(),
      deleteChat: jest.fn(),
    }
    pdfService = {
      generateChatPdf: jest.fn(),
    }
    mockRes = {
      set: jest.fn().mockReturnThis(),
      send: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: chatService },
        { provide: ChatPdfService, useValue: pdfService },
      ],
    }).compile()

    controller = module.get(ChatController)
  })

  describe('createChat', () => {
    it('deve delegar a criação ao service', async () => {
      const fakeReq: any = { user: { userId: 'u1' } }
      const fakeFile = { path: '/tmp/img.png' } as Express.Multer.File
      const fakeResult = { id: 'c1' }
      chatService.createChat!.mockResolvedValue(fakeResult)

      const result = await controller.createChat(fakeReq, fakeFile)

      expect(chatService.createChat).toHaveBeenCalledWith('u1', '/tmp/img.png')
      expect(result).toBe(fakeResult)
    })

    it('deve lançar BadRequestException se não vier file', async () => {
      const fakeReq: any = { user: { userId: 'u1' } }
      await expect(controller.createChat(fakeReq, undefined as any))
        .rejects.toBeInstanceOf(BadRequestException)
    })
  })

  describe('listChats', () => {
    it('deve retornar lista via service', async () => {
      const fakeReq: any = { user: { userId: 'u2' } }
      const fakeList = [{ id: 'c1' }, { id: 'c2' }]
      chatService.findAll!.mockResolvedValue(fakeList)

      const result = await controller.listChats(fakeReq)

      expect(chatService.findAll).toHaveBeenCalledWith('u2')
      expect(result).toBe(fakeList)
    })
  })

  describe('getChat', () => {
    it('deve chamar service.findOne com UUID válido', async () => {
      const fakeReq: any = { user: { userId: 'u3' } }
      const fakeChat = { id: 'uuid-123' }
      chatService.findOne!.mockResolvedValue(fakeChat)

      const result = await controller.getChat(fakeReq, 'uuid-123')

      expect(chatService.findOne).toHaveBeenCalledWith('u3', 'uuid-123')
      expect(result).toBe(fakeChat)
    })

    it('deve propagar NotFoundException', async () => {
      const fakeReq: any = { user: { userId: 'u3' } }
      chatService.findOne!.mockRejectedValue(new NotFoundException())
      await expect(controller.getChat(fakeReq, '00000000-0000-0000-0000-000000000000'))
        .rejects.toThrow(NotFoundException)
    })
  })

  describe('sendMessage', () => {
    it('deve chamar service.sendMessage com os parâmetros corretos', async () => {
      const fakeReq: any = { user: { userId: 'u4' } }
      const fakeResp = { id: 'r1' }
      chatService.sendMessage!.mockResolvedValue(fakeResp)

      const result = await controller.sendMessage(fakeReq, 'uuid-4', 'olá')

      expect(chatService.sendMessage).toHaveBeenCalledWith('u4', 'uuid-4', 'olá')
      expect(result).toBe(fakeResp)
    })
  })

  describe('downloadChat', () => {
    it('deve gerar e enviar PDF via response', async () => {
      const fakeReq: any = { user: { userId: 'u6' } }
      const pdfBuf = Buffer.from('%PDF-1.4')
      pdfService.generateChatPdf!.mockResolvedValue(pdfBuf)

      await controller.downloadChat(fakeReq, 'uuid-6', mockRes as ExResponse)

      expect(pdfService.generateChatPdf).toHaveBeenCalledWith('uuid-6', 'u6')
      expect(mockRes.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="chat-uuid-6.pdf"`,
        'Content-Length': pdfBuf.length,
      })
      expect(mockRes.send).toHaveBeenCalledWith(Buffer.from(pdfBuf))
    })
  })

  describe('deleteChat', () => {
    it('deve chamar service.deleteChat passando UUID', async () => {
      const fakeReq: any = { user: { userId: 'u5' } }
      const fakeMsg = { message: 'ok' }
      chatService.deleteChat!.mockResolvedValue(fakeMsg)

      const result = await controller.deleteChat(fakeReq, 'uuid-5')

      expect(chatService.deleteChat).toHaveBeenCalledWith('u5', 'uuid-5')
      expect(result).toBe(fakeMsg)
    })
  })
})
