import { Test, TestingModule } from '@nestjs/testing';
import { OcrClientService } from './ocr-client.service';
import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import { of, throwError } from 'rxjs';

jest.mock('form-data', () => {
  return class {
    private headers = { 'content-type': 'multipart/form-data; boundary=---' };
    append() {}
    getHeaders() { return this.headers; }
  };
});

describe('OcrClientService', () => {
  let service: OcrClientService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcrClientService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OcrClientService>(OcrClientService);
    httpService = module.get<HttpService>(HttpService);
    jest.clearAllMocks();
  });

  describe('analyze', () => {
    it('throws if OCR_SPACE_KEY is not configured', async () => {
      delete process.env.OCR_SPACE_KEY;
      await expect(service.analyze('path.png')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws if file read fails', async () => {
      process.env.OCR_SPACE_KEY = 'key';
      jest
        .spyOn(fs, 'readFileSync')
        .mockImplementation(() => { throw new Error('enoent'); });
      await expect(service.analyze('notfound.png')).rejects.toThrow(
        'Falha ao ler o arquivo de imagem',
      );
    });

    it('throws if no ParsedResults in response', async () => {
      process.env.OCR_SPACE_KEY = 'key';
      jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('dummy'));
      (httpService.post as jest.Mock).mockReturnValue(of({ data: {} }));
      await expect(service.analyze('file.png')).rejects.toThrow(
        'Nenhum texto reconhecido na imagem',
      );
    });

    it('returns parsed text on valid response', async () => {
      process.env.OCR_SPACE_KEY = 'key';
      jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('dummy'));
      (httpService.post as jest.Mock).mockReturnValue(
        of({ data: { ParsedResults: [{ ParsedText: 'Hello OCR' }] } }),
      );

      const result = await service.analyze('file.png');
      expect(result).toBe('Hello OCR');
      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.ocr.space/parse/image',
        expect.any(Object),
        { headers: expect.any(Object) },
      );
    });

    it('throws BadRequestException on HTTP error', async () => {
      process.env.OCR_SPACE_KEY = 'key';
      jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('dummy'));
      (httpService.post as jest.Mock).mockReturnValue(
        throwError(() => new Error('http fail')),
      );
      await expect(service.analyze('file.png')).rejects.toThrow(
        'Erro OCR.Space: http fail',
      );
    });
  });
});

