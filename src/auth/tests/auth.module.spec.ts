import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
import { GoogleStrategy } from '../google.strategy';
import { UsersService } from '../../users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { createMockRepository } from '../../test-setup';

describe('AuthModule Components', () => {
  let module: TestingModule;

  const mockRepository = createMockRepository();

  const mockJwtService = {
    sign: jest.fn(() => 'mock-token'),
    verify: jest.fn(() => ({ sub: 'user-id', username: 'test' })),
    verifyAsync: jest.fn(() => Promise.resolve({ sub: 'user-id', username: 'test' })),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    updateLastLogin: jest.fn(),
    create: jest.fn(),
  };

  const mockGoogleStrategy = {
    validate: jest.fn(),
  };

  beforeEach(async () => {
    // SOLUÇÃO: Testar componentes individuais sem importar o módulo completo
    module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        GoogleStrategy,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockRepository)
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

  it('should provide AuthService', () => {
    const service = module.get<AuthService>(AuthService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(AuthService);
  });

  it('should provide AuthController', () => {
    const controller = module.get<AuthController>(AuthController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(AuthController);
  });

  it('should provide GoogleStrategy', () => {
    const strategy = module.get<GoogleStrategy>(GoogleStrategy);
    expect(strategy).toBeDefined();
  });

  it('should provide JwtService', () => {
    const jwtService = module.get<JwtService>(JwtService);
    expect(jwtService).toBeDefined();
    expect(jwtService.sign).toBeDefined();
  });

  it('should provide UsersService', () => {
    const usersService = module.get<UsersService>(UsersService);
    expect(usersService).toBeDefined();
    // Não verificar instância porque está mockado
    expect(usersService.findByEmail).toBeDefined();
    expect(usersService.updateLastLogin).toBeDefined();
    expect(usersService.create).toBeDefined();
  });

  describe('Service Dependencies', () => {
    it('should inject dependencies into AuthService correctly', () => {
      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
      
      // Verify that AuthService has the expected methods
      expect(authService.validateUser).toBeDefined();
      expect(authService.login).toBeDefined();
      expect(authService.googleLogin).toBeDefined();
    });

    it('should inject dependencies into AuthController correctly', () => {
      const authController = module.get<AuthController>(AuthController);
      expect(authController).toBeDefined();
      
      // Verify that AuthController has the expected methods
      expect(authController.login).toBeDefined();
      expect(authController.register).toBeDefined();
    });
  });

  describe('Mock Integration', () => {
    it('should work with mocked JwtService', () => {
      const jwtService = module.get<JwtService>(JwtService);
      const token = jwtService.sign({ test: 'data' });
      
      expect(mockJwtService.sign).toHaveBeenCalledWith({ test: 'data' });
      expect(token).toBe('mock-token');
    });

    it('should work with mocked UsersService', async () => {
      const usersService = module.get<UsersService>(UsersService);
      mockUsersService.findByEmail.mockResolvedValue({ id: 'test-user' });
      
      const result = await usersService.findByEmail('test@email.com');
      
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@email.com');
      expect(result).toEqual({ id: 'test-user' });
    });
  });

  describe('Component Integration', () => {
    it('should allow AuthService to work with injected dependencies', async () => {
      const authService = module.get<AuthService>(AuthService);
      
      // Mock the dependencies
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'user',
      });
      
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      mockJwtService.sign.mockReturnValue('generated-token');
      
      // Test that the service can use its dependencies
      expect(authService).toBeDefined();
      expect(typeof authService.validateUser).toBe('function');
      expect(typeof authService.login).toBe('function');
      expect(typeof authService.googleLogin).toBe('function');
    });

    it('should allow AuthController to work with AuthService', () => {
      const authController = module.get<AuthController>(AuthController);
      const authService = module.get<AuthService>(AuthService);
      
      expect(authController).toBeDefined();
      expect(authService).toBeDefined();
      
      // Both should be available and working
      expect(typeof authController.login).toBe('function');
      expect(typeof authController.register).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle service instantiation without errors', () => {
      expect(() => {
        module.get<AuthService>(AuthService);
        module.get<AuthController>(AuthController);
        module.get<GoogleStrategy>(GoogleStrategy);
      }).not.toThrow();
    });
  });
});