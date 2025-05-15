import { Test, TestingModule } from '@nestjs/testing'
import { InteractionController } from './interaction.controller'
import { InteractionService } from './interaction.service'
import { BadRequestException } from '@nestjs/common'

describe('InteractionController', () => {
  let controller: InteractionController
  let service: Partial<Record<keyof InteractionService, jest.Mock>>

  beforeEach(async () => {
    service = {
      findAllByChat: jest.fn(),
      remove: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InteractionController],
      providers: [
        { provide: InteractionService, useValue: service },
      ],
    }).compile()

    controller = module.get<InteractionController>(InteractionController)
  })

  describe('findAll', () => {
    const mockReq = { user: { userId: 'u42' } }

    it('should call service.findAllByChat with correct args', async () => {
      service.findAllByChat!.mockResolvedValue(['foo'])
      const result = await controller.findAll(mockReq as any, '123')
      expect(service.findAllByChat).toHaveBeenCalledWith('u42', '123')
      expect(result).toEqual(['foo'])
    })

    it('should throw BadRequestException on non-numeric chatId', () => {
      expect(() => controller.findAll(mockReq as any, 'abc')).toThrow(BadRequestException)
    })
  })

  describe('remove', () => {
    const mockReq = { user: { userId: 'u99' } }

    it('should call service.remove with correct args', async () => {
      service.remove!.mockResolvedValue({ message: 'ok' })
      const result = await controller.remove(mockReq as any, '456')
      expect(service.remove).toHaveBeenCalledWith('u99', '456')
      expect(result).toEqual({ message: 'ok' })
    })

    it('should throw BadRequestException on non-numeric id', () => {
      expect(() => controller.remove(mockReq as any, 'xyz')).toThrow(BadRequestException)
    })
  })
})

