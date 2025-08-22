import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth/jwt-auth.guard'; // Ajuste o caminho conforme necessário
import { User } from './users/entities/user.entity';
import { Client } from './clientes/entities/client.entity';

// Configuração global para testes
beforeAll(async () => {
  // Configurar variáveis de ambiente para testes
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = ':memory:';
});

// Limpeza após todos os testes
afterAll(async () => {
  // Limpar variáveis de ambiente se necessário
  delete process.env.JWT_SECRET;
  delete process.env.DATABASE_URL;
});

// Helper para criar módulo de teste com banco em memória
export const createTestingModule = async (
  imports: any[] = [], 
  providers: any[] = [],
  entities: any[] = [User, Client] // Incluindo Client por padrão
) => {
  return Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: entities,
        synchronize: true,
        dropSchema: true,
        logging: false, // Desabilitar logs em testes
      }),
      TypeOrmModule.forFeature(entities),
      JwtModule.register({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '1h' },
      }),
      ...imports,
    ],
    providers: [
      ...providers,
      // Mock do JwtAuthGuard por padrão
      {
        provide: JwtAuthGuard,
        useValue: {
          canActivate: jest.fn(() => true),
        },
      },
    ],
  })
  .overrideGuard(JwtAuthGuard)
  .useValue({
    canActivate: jest.fn(() => true),
  })
  .compile();
};

/**
 * Mock factory para TypeORM Repository
 * Cria um mock repository com todos os métodos comuns necessários para testes
 */
export const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findOneOrFail: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
  manager: {
    transaction: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  },
  metadata: {
    columns: [],
    relations: [],
  },
});

/**
 * Mock factory para TypeORM QueryBuilder
 * Cria um mock query builder encadeável
 */
export const createMockQueryBuilder = () => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  whereInIds: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  innerJoinAndSelect: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  having: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
  getManyAndCount: jest.fn(),
  getCount: jest.fn(),
  getRawOne: jest.fn(),
  getRawMany: jest.fn(),
  execute: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  into: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  clone: jest.fn().mockReturnThis(),
});

/**
 * Mock factory para Express Request com usuário autenticado
 */
export const createMockRequest = (userOverrides?: Partial<any>) => ({
  user: {
    sub: 'test-user-id',
    username: 'testuser',
    email: 'test@user.com',
    role: 'user',
    ...userOverrides,
  },
  headers: {
    authorization: 'Bearer mock-token',
  },
  body: {},
  params: {},
  query: {},
  ip: '127.0.0.1',
  method: 'GET',
  url: '/test',
});

/**
 * Mock factory para Admin Request
 */
export const createMockAdminRequest = (adminOverrides?: Partial<any>) => 
  createMockRequest({
    sub: 'admin-user-id',
    username: 'admin',
    email: 'admin@test.com',
    role: 'admin',
    ...adminOverrides,
  });

/**
 * Helper function para obter repository mockado do módulo de teste
 */
export function getMockRepository<T extends ObjectLiteral>(
  module: TestingModule,
  entity: any
): jest.Mocked<Repository<T>> {
  return module.get(getRepositoryToken(entity));
}

/**
 * Helper function para resetar todos os mocks
 */
export function resetAllMocks(...mocks: any[]) {
  mocks.forEach(mock => {
    if (mock && typeof mock === 'object') {
      Object.values(mock).forEach(method => {
        if (jest.isMockFunction(method)) {
          (method as jest.MockedFunction<any>).mockReset();
        }
      });
    }
  });
}

/**
 * Factory de dados de teste
 */
export const TestDataFactory = {
  createUser: (overrides: Partial<any> = {}) => ({
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@user.com',
    password: 'hashedpassword',
    role: 'user',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  createAdminUser: (overrides: Partial<any> = {}) => 
    TestDataFactory.createUser({
      id: 'admin-user-id',
      username: 'admin',
      email: 'admin@test.com',
      role: 'admin',
      ...overrides,
    }),

  createClient: (overrides: Partial<any> = {}) => ({
    id: 'test-client-id',
    nomeNaFachada: 'Test Client',
    cnpj: '12345678000195',
    razaoSocial: 'Test Client Ltda',
    inscricaoEstadual: '123456789',
    inscricaoMunicipal: '987654321',
    cep: '01234567',
    rua: 'Rua Teste',
    numero: '123',
    complemento: 'Sala 1',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    telefone: '11999999999',
    email: 'test@client.com',
    website: 'www.testclient.com',
    status: 'ativo',
    observacoes: 'Test observations',
    userId: 'test-user-id',
    user: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  createCreateClientDto: (overrides: Partial<any> = {}) => ({
    nomeNaFachada: 'New Client',
    cnpj: '98765432000188',
    razaoSocial: 'New Client Ltda',
    cep: '04567890',
    rua: 'Nova Rua',
    numero: '456',
    bairro: 'Novo Bairro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    userId: 'test-user-id',
    ...overrides,
  }),

  createUpdateClientDto: (overrides: Partial<any> = {}) => ({
    nomeNaFachada: 'Updated Client',
    status: 'inativo',
    telefone: '11888888888',
    ...overrides,
  }),

  // Gerar múltiplos clientes para testes de lista
  createMultipleClients: (count: number, baseOverrides: Partial<any> = {}) => {
    return Array.from({ length: count }, (_, index) => 
      TestDataFactory.createClient({
        id: `client-${index + 1}`,
        nomeNaFachada: `Client ${index + 1}`,
        cnpj: `1234567800019${index.toString().padStart(1, '0')}`,
        ...baseOverrides,
      })
    );
  },
};

/**
 * Matchers customizados para Jest
 */
export const customMatchers = {
  toBeValidClient: (received: any) => {
    const requiredFields = [
      'nomeNaFachada', 'cnpj', 'razaoSocial', 'cep', 'rua', 
      'numero', 'bairro', 'cidade', 'estado', 'userId'
    ];
    
    const missingFields = requiredFields.filter(field => !received[field]);
    
    if (missingFields.length > 0) {
      return {
        message: () => `Expected client to have all required fields, missing: ${missingFields.join(', ')}`,
        pass: false,
      };
    }

    return {
      message: () => 'Expected client to be invalid',
      pass: true,
    };
  },

  toBeValidUser: (received: any) => {
    const requiredFields = ['username', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !received[field]);
    
    if (missingFields.length > 0) {
      return {
        message: () => `Expected user to have all required fields, missing: ${missingFields.join(', ')}`,
        pass: false,
      };
    }

    return {
      message: () => 'Expected user to be invalid',
      pass: true,
    };
  },

  toHaveBeenCalledWithPartialObject: (mockFn: jest.MockedFunction<any>, expectedPartial: any) => {
    const calls = mockFn.mock.calls;
    const matchingCall = calls.find(call => 
      call.some(arg => 
        arg && typeof arg === 'object' && 
        Object.keys(expectedPartial).every(key => arg[key] === expectedPartial[key])
      )
    );

    if (matchingCall) {
      return {
        message: () => 'Expected mock not to have been called with partial object',
        pass: true,
      };
    }

    return {
      message: () => `Expected mock to have been called with partial object: ${JSON.stringify(expectedPartial)}`,
      pass: false,
    };
  },
};

// Estender Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidClient(): R;
      toBeValidUser(): R;
      toHaveBeenCalledWithPartialObject(expectedPartial: any): R;
    }
  }
}

// Adicionar matchers customizados ao Jest
beforeAll(() => {
  expect.extend(customMatchers);
});

/**
 * Utilitários para cenários de teste comuns
 */
export const TestScenarios = {
  /**
   * Testa operações CRUD básicas
   */
  async testCRUDOperations(service: any, createData: any, updateData: any) {
    // Create
    const created = await service.create(createData);
    expect(created).toBeDefined();
    expect(created.id).toBeDefined();

    // Read
    const found = await service.findOne(created.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(created.id);

    // Update
    const updated = await service.update(created.id, updateData);
    expect(updated).toBeDefined();

    // Delete
    const deleted = await service.remove(created.id);
    expect(deleted).toBeDefined();
  },

  /**
   * Testa isolamento de dados entre usuários
   */
  async testUserIsolation(service: any, user1Data: any, user2Data: any) {
    // Criar dados para usuários diferentes
    const user1Item = await service.create({ ...user1Data.item, userId: user1Data.userId });
    const user2Item = await service.create({ ...user2Data.item, userId: user2Data.userId });

    // Usuário 1 deve ver apenas seus dados
    const user1Items = await service.findAll(user1Data.userId);
    expect(user1Items.some((item: any) => item.id === user1Item.id)).toBe(true);
    expect(user1Items.some((item: any) => item.id === user2Item.id)).toBe(false);

    // Usuário 2 deve ver apenas seus dados
    const user2Items = await service.findAll(user2Data.userId);
    expect(user2Items.some((item: any) => item.id === user2Item.id)).toBe(true);
    expect(user2Items.some((item: any) => item.id === user1Item.id)).toBe(false);
  },

  /**
   * Testa filtros e ordenação
   */
  async testFiltersAndSorting(service: any, testData: any[]) {
    // Criar dados de teste
    for (const data of testData) {
      await service.create(data);
    }

    // Testar filtros
    if (testData.some(item => item.status)) {
      const activeItems = await service.findAllWithFilters({ status: 'ativo' });
      expect(activeItems.every((item: any) => item.status === 'ativo')).toBe(true);
    }

    // Testar ordenação
    const sortedItems = await service.findAllWithFilters({ 
      sortBy: 'createdAt', 
      order: 'desc' 
    });
    expect(sortedItems.length).toBeGreaterThan(0);
  },

  /**
   * Testa validações de entrada
   */
  async testInputValidation(service: any, invalidData: any[]) {
    for (const data of invalidData) {
      try {
        await service.create(data);
        fail(`Expected validation error for data: ${JSON.stringify(data)}`);
      } catch (error) {
        expect(error).toBeDefined();
      }
    }
  },
};

/**
 * Mock de configurações para diferentes ambientes
 */
export const MockConfigurations = {
  development: {
    JWT_SECRET: 'dev-secret',
    DATABASE_URL: 'sqlite::memory:',
    LOG_LEVEL: 'debug',
  },
  
  test: {
    JWT_SECRET: 'test-secret',
    DATABASE_URL: ':memory:',
    LOG_LEVEL: 'error',
  },
  
  production: {
    JWT_SECRET: 'prod-secret',
    DATABASE_URL: 'postgresql://...',
    LOG_LEVEL: 'warn',
  },
};

/**
 * Helper para configurar ambiente de teste específico
 */
export const setupTestEnvironment = (config: keyof typeof MockConfigurations = 'test') => {
  const envConfig = MockConfigurations[config];
  
  Object.entries(envConfig).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  return () => {
    Object.keys(envConfig).forEach(key => {
      delete process.env[key];
    });
  };
};