import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiApiService {
  private readonly client: OpenAI;

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (key === null || key === undefined) {
      throw new InternalServerErrorException('OPENAI_API_KEY não configurada');
    }

    this.client = new OpenAI({ apiKey: key });
  }

  async complete(prompt: string): Promise<string> {
    try {
      const res = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      });
      if (!res.choices[0].message.content) {
        throw new InternalServerErrorException('Resposta da OpenAI API não contém conteúdo');
      }
      return res.choices[0].message.content;
    } catch (err: any) {
      console.error('Erro OpenAI API:', err);
      throw new InternalServerErrorException(`OpenAI API falhou: ${err.message}`);
    }
  }
}