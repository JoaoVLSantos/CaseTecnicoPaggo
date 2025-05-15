import { Module } from '@nestjs/common';
import { AiApiService } from './ai-api.service';
import { AiApiController } from './ai-api.controller';

@Module({
  providers: [AiApiService],
  controllers: [AiApiController],
  exports: [AiApiService],
})
export class AiApiModule {}
