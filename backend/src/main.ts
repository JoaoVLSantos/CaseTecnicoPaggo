import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Cria a aplicação
  const app = await NestFactory.create(AppModule);

  // Prefixo global para todas as rotas
  app.setGlobalPrefix('api');

  // Habilita CORS para qualquer origem (ajuste se necessário)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Pipes globais para validação de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // remove propriedades não declaradas
      forbidNonWhitelisted: true,  // lança erro ao receber props extras
      transform: true,             // transforma payload em instâncias de DTOs
    }),
  );

  // Porta configurável via ENV ou padrão 3000
  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);

  console.log(`🚀 Servidor executando em http://localhost:${port}/api`);
}

bootstrap();
