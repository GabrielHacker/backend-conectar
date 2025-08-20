import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
      };

      const expectedUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.USER,
      };

      jest.spyOn(usersService, 'create').mockResolvedValue(expectedUser as any);

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        message: 'User created successfully',
        user: expectedUser,
      });
      expect(usersService.create).toHaveBeenCalledWith(registerDto);
    });

    it('should handle registration error', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      };

      jest.spyOn(usersService, 'create').mockRejectedValue(new Error('Email already exists'));

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        message: 'Error creating user',
        error: 'Email already exists',
      });
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.USER,
      };

      const loginResult = {
        access_token: 'jwt-token',
        user,
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(user);
      jest.spyOn(authService, 'login').mockResolvedValue(loginResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(loginResult);
      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(authService.login).toHaveBeenCalledWith(user);
    });

    it('should return error for invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      const result = await controller.login(loginDto);

      expect(result).toEqual({ message: 'Invalid credentials' });
    });
  });
});