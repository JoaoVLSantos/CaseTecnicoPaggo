import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OcrClientService } from './ocr-client.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [OcrClientService],
  exports: [OcrClientService],
})

export class OcrClientModule {}