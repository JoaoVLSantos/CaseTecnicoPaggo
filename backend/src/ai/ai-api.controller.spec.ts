import { Test, TestingModule } from '@nestjs/testing';
import { AiApiController } from './ai-api.controller';
import { AiApiService } from './ai-api.service';
import { CompleteDto } from './dto/complete.dto';
import { HttpStatus, HttpCode } from '@nestjs/common';

describe('AiApiController', () => {
  let controller: AiApiController;
  let service: AiApiService;

  const mockText = 'generated response';
  const mockComplete = jest.fn((prompt: string) => Promise.resolve(mockText));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiApiController],
      providers: [
        {
          provide: AiApiService,
          useValue: { complete: mockComplete },
        },
      ],
    }).compile();

    controller = module.get<AiApiController>(AiApiController);
    service = module.get<AiApiService>(AiApiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('complete', () => {
    it('should return an object with text property', async () => {
      const dto: CompleteDto = { prompt: 'hello' };
      const result = await controller.complete(dto);
      expect(service.complete).toHaveBeenCalledWith('hello');
      expect(result).toEqual({ text: mockText });
    });

    it('should propagate errors thrown by service', async () => {
      mockComplete.mockRejectedValueOnce(new Error('service error'));
      const dto: CompleteDto = { prompt: 'error' };
      await expect(controller.complete(dto)).rejects.toThrow('service error');
    });
  });
});
