import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import { readFileSync } from 'fs';
import { basename } from 'path';

@Injectable()
export class OcrClientService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * Extrai texto de imagem usando a API gratuita do OCR.Space
   * @param imagePath caminho local para o arquivo de imagem
   */
  async analyze(imagePath: string): Promise<string> {
    const apiKey = process.env.OCR_SPACE_KEY;
    if (!apiKey) {
      throw new BadRequestException('OCR_SPACE_KEY não configurada');
    }

    let buffer: Buffer;
    try {
      buffer = readFileSync(imagePath);
    } catch (err) {
      throw new BadRequestException('Falha ao ler o arquivo de imagem');
    }

    const form = new FormData();
    form.append('apikey', apiKey);
    form.append('language', 'por');
    form.append('file', buffer, { filename: basename(imagePath) });

    const headers = form.getHeaders();

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.ocr.space/parse/image',
          form,
          { headers },
        ),
      );
      const parsedResults = response.data?.ParsedResults;
      if (!parsedResults || parsedResults.length === 0 || typeof parsedResults[0].ParsedText !== 'string') {
        throw new BadRequestException('Nenhum texto reconhecido na imagem');
      }
      return parsedResults[0].ParsedText;
    } catch (err: any) {
      throw new BadRequestException(`Erro OCR.Space: ${err.message}`);
    }
  }
}
