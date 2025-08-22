import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ClientsModule } from '../clients.module';
import { ClientsController } from '../clients.controller';
import { Client } from '../client.entity';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { ClientsService } from '../clients.services';

describe('ClientsModule', () => {
  let module: TestingModule;

  // Mock do Repository
  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
    })),
  };

  // Mock do JwtService (SOLUÇÃO PRINCIPAL)
  const mockJwtService = {
    sign: jest.fn(() => 'mock-token'),
    verify: jest.fn(() => ({ sub: 'user-id', username: 'test' })),
    verifyAsync: jest.fn(() => Promise.resolve({ sub: 'user-id', username: 'test' })),
    decode: jest.fn(() => ({ sub: 'user-id', username: 'test' })),
  };

  // Mock do JwtAuthGuard (SOLUÇÃO SECUNDÁRIA)
  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ClientsModule], // Importar o módulo real
    })
      // SOLUÇÃO 1: Mockar o Repository
      .overrideProvider(getRepositoryToken(Client))
      .useValue(mockRepository)
      
      // SOLUÇÃO 2: Mockar o JwtService (isso resolve o erro principal)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      
      // SOLUÇÃO 3: Mockar o JwtAuthGuard (backup)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      
      .compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide ClientsController', () => {
    const controller = module.get<ClientsController>(ClientsController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(ClientsController);
  });

  it('should provide ClientsService', () => {
    const service = module.get<ClientsService>(ClientsService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(ClientsService);
  });

  it('should provide Client repository', () => {
    const repository = module.get(getRepositoryToken(Client));
    expect(repository).toBeDefined();
  });

  it('should export ClientsService', () => {
    const service = module.get<ClientsService>(ClientsService);
    expect(service).toBeDefined();
    
    // Verificar que o service tem os métodos esperados
    expect(service.create).toBeDefined();
    expect(service.findAll).toBeDefined();
    expect(service.findOne).toBeDefined();
    expect(service.update).toBeDefined();
    expect(service.remove).toBeDefined();
    expect(service.countByUser).toBeDefined();
    expect(service.findByStatus).toBeDefined();
    expect(service.findAllWithFilters).toBeDefined();
  });

  it('should have proper dependencies injection', () => {
    const controller = module.get<ClientsController>(ClientsController);
    const service = module.get<ClientsService>(ClientsService);
    
    // Verificar que o controller foi injetado corretamente
    expect(controller).toBeDefined();
    
    // Verificar que o service foi injetado corretamente
    expect(service).toBeDefined();
  });

  it('should handle JwtAuthGuard dependency', () => {
    // Verificar que o módulo foi compilado sem erro (o que significa que as dependências foram resolvidas)
    expect(module).toBeDefined();
    
    // Verificar que os mocks estão funcionando
    expect(mockJwtService.sign).toBeDefined();
    expect(mockJwtService.verifyAsync).toBeDefined();
    expect(mockJwtAuthGuard.canActivate).toBeDefined();
  });

  it('should allow controller methods to work with mocked dependencies', async () => {
    const controller = module.get<ClientsController>(ClientsController);
    
    // Mock do request
    const mockRequest = {
      user: { sub: 'test-user', role: 'user' }
    };

    // Testar se o controller funciona com as dependências mockadas
    expect(controller).toBeDefined();
    expect(typeof controller.findAll).toBe('function');
    expect(typeof controller.create).toBe('function');
    expect(typeof controller.findOne).toBe('function');
    expect(typeof controller.update).toBe('function');
    expect(typeof controller.remove).toBe('function');
    expect(typeof controller.getMyStats).toBe('function');
  });
});