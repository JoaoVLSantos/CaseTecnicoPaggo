import { Controller, Post, Body, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { AiApiService } from './ai-api.service';
import { CompleteDto } from './dto/complete.dto';

@Controller('hf')
export class AiApiController {
  constructor(private readonly hf: AiApiService) {}

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @Body(new ValidationPipe({ whitelist: true })) dto: CompleteDto,
  ): Promise<{ text: string }> {
    const text = await this.hf.complete(dto.prompt);
    return { text };
  }
}