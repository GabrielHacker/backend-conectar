import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS - CONFIGURAÇÃO ÚNICA E CORRETA
  app.enableCors({
    origin: [
      'https://conectar.discloud.app',           // Frontend em produção
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

  // REMOVER ESTE MIDDLEWARE - ele está conflitando com o enableCors acima
  // app.use((req, res, next) => {
  //   res.header('Access-Control-Allow-Origin', '*'); // ❌ CONFLITO!
  //   res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  //   res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  //   
  //   if (req.method === 'OPTIONS') {
  //     res.sendStatus(200);
  //   } else {
  //     next();
  //   }
  // });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log('🚀 Backend rodando em:', `http://localhost:${port}`);
  console.log('🌍 URLs de produção:');
  console.log('   Backend: https://conectarback.discloud.app');
  console.log('   Frontend: https://conectar.discloud.app');
  console.log('🔑 Google OAuth configurado:', process.env.GOOGLE_CLIENT_ID ? '✅' : '❌');
}
bootstrap();