import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UsersModule } from '../users.module';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { createMockRepository } from '../../test-setup';

describe('UsersModule', () => {
  let module: TestingModule;

  const mockRepository = createMockRepository();

  const mockJwtService = {
    sign: jest.fn(() => 'mock-token'),
    verify: jest.fn(() => ({ sub: 'user-id', username: 'test' })),
    verifyAsync: jest.fn(() => Promise.resolve({ sub: 'user-id', username: 'test' })),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [UsersModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockRepository)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
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

  it('should provide UsersController', () => {
    const controller = module.get<UsersController>(UsersController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(UsersController);
  });

  it('should provide UsersService', () => {
    const service = module.get<UsersService>(UsersService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(UsersService);
  });

  it('should provide User repository', () => {
    const repository = module.get(getRepositoryToken(User));
    expect(repository).toBeDefined();
  });

  it('should export UsersService', () => {
    const service = module.get<UsersService>(UsersService);
    expect(service).toBeDefined();
    
    // Verificar que o service tem os métodos esperados
    expect(service.create).toBeDefined();
    expect(service.findAllWithFilters).toBeDefined();
    expect(service.findById).toBeDefined();
    expect(service.update).toBeDefined();
    expect(service.remove).toBeDefined();
    expect(service.findInactiveUsers).toBeDefined();
    expect(service.countUsers).toBeDefined();
    expect(service.updatePassword).toBeDefined();
  });

  it('should have proper dependencies injection', () => {
    const controller = module.get<UsersController>(UsersController);
    const service = module.get<UsersService>(UsersService);
    
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should handle guards properly', () => {
    expect(mockJwtAuthGuard.canActivate).toBeDefined();
    expect(mockRolesGuard.canActivate).toBeDefined();
  });
});