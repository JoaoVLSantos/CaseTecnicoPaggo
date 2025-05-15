import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  async getStatus(): Promise<{
    status: string;
    dbConnection: boolean;
    openAi: boolean;
    environment: string;
    port: number;
  }> {
    return this.appService.getStatus();
  }
}
