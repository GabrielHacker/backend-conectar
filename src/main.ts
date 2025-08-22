import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();
const port = process.env.PORT || 3000;
const front = process.env.FRONTEND_URL || 'localhost';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS - CONFIGURAÇÃO ÚNICA E CORRETA
  app.enableCors({
    origin: [
      front,           // Frontend em produção
      'http://localhost:3001',                   // Frontend local
      'http://localhost:3000',                   // Caso frontend rode na 3000
      'http://localhost:8080',                   // Porta alternativa
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
  });



  await app.listen(port, '0.0.0.0');
  
  console.log('🚀 Backend rodando em:', `http://localhost:${port}`);
  console.log('🌍 URLs de produção:');
  console.log('   Backend: https://conectarback.discloud.app');
  console.log('   Frontend:',`${front}`);
  console.log('🔑 Google OAuth configurado:', process.env.GOOGLE_CLIENT_ID ? '✅' : '❌');
}
bootstrap();