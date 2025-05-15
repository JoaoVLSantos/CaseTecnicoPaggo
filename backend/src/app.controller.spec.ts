import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  const mockStatus = {
    status: 'ok',
    dbConnection: true,
    openAi: true,
    environment: 'test',
    port: 4000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getStatus: jest.fn().mockResolvedValue(mockStatus),
          },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return status from service', async () => {
      const result = await controller.getStatus();
      expect(service.getStatus).toHaveBeenCalled();
      expect(result).toEqual(mockStatus);
    });
  });
});

