import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';

// Configuração global para testes
beforeAll(async () => {
  // Configurar variáveis de ambiente para testes
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
});

// Helper para criar módulo de teste com banco em memória
export const createTestingModule = async (imports: any[] = [], providers: any[] = []) => {
  return Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [User],
        synchronize: true,
        dropSchema: true,
      }),
      TypeOrmModule.forFeature([User]),
      ...imports,
    ],
    providers,
  }).compile();
};