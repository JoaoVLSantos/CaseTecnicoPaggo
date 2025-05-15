// src/app.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { AiApiService } from 'src/ai/ai-api.service';
import OpenAI from 'openai';

@Injectable()
export class AppService {
  private readonly openaiClient: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly ai: AiApiService,
  ) {
    // expõe o client interno da AiApiService para health-check
    this.openaiClient = this.ai['client'];
  }

  async getStatus(): Promise<{
    status: string;
    dbConnection: boolean;
    openAi: boolean;
    environment: string;
    port: number;
  }> {
    // 1) DB health
    let dbConnection = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbConnection = false;
    }

    // 2) OpenAI health (lista modelos, custa ZERO tokens)
    let openAi = true;
    try {
      await this.openaiClient.models.list();
    } catch {
      openAi = false;
    }

    // 3) leitura de vars
    const environment = this.config.get<string>('NODE_ENV') ?? 'development';
    const port = parseInt(this.config.get<string>('PORT') ?? '3000', 10);

    return {
      status: 'ok',
      dbConnection,
      openAi,
      environment,
      port,
    };
  }
}
