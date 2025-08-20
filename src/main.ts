import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS
  app.enableCors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3001', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3000);
  console.log('🚀 Backend rodando em: http://localhost:3000');
  console.log('🔑 Google OAuth configurado:', process.env.GOOGLE_CLIENT_ID ? '✅' : '❌');
}
bootstrap();