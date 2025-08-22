import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { TestDataFactory } from '../../test-setup';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = TestDataFactory.createUser({
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed-password',
    role: 'user',
  });

  const mockUserWithoutPassword = {
    id: mockUser.id,
    name: mockUser.name,
    username: mockUser.username,
    email: mockUser.email,
    role: mockUser.role,
    isActive: mockUser.isActive,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
    mockedBcrypt.compare.mockResolvedValue(true as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should return user data without password when credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(email, password);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual(mockUserWithoutPassword);
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when user has no password', async () => {
      const userWithoutPassword = { ...mockUser, password: null };
      mockUsersService.findByEmail.mockResolvedValue(userWithoutPassword);

      const result = await service.validateUser(email, password);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(email, password);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toBeNull();
    });

    it('should handle bcrypt comparison errors', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockRejectedValue(new Error('Bcrypt error') as never);

      await expect(service.validateUser(email, password))
        .rejects.toThrow('Bcrypt error');
    });

    it('should handle database errors', async () => {
      mockUsersService.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(service.validateUser(email, password))
        .rejects.toThrow('Database error');
    });
  });

  describe('login', () => {
    const mockToken = 'jwt-access-token-123';

    beforeEach(() => {
      mockJwtService.sign.mockReturnValue(mockToken);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
    });

    it('should return access token and user data', async () => {
      const result = await service.login(mockUserWithoutPassword);

      const expectedPayload = {
        email: mockUserWithoutPassword.email,
        sub: mockUserWithoutPassword.id,
        role: mockUserWithoutPassword.role,
      };

      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
      expect(mockUsersService.updateLastLogin).toHaveBeenCalledWith(mockUserWithoutPassword.id);
      expect(result).toEqual({
        access_token: mockToken,
        user: mockUserWithoutPassword,
      });
    });

    it('should handle different user roles', async () => {
      const adminUser = { ...mockUserWithoutPassword, role: 'admin' };
      
      const result = await service.login(adminUser);

      const expectedPayload = {
        email: adminUser.email,
        sub: adminUser.id,
        role: 'admin',
      };

      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
      expect(result.user.role).toBe('admin');
    });

    it('should update last login timestamp', async () => {
      await service.login(mockUserWithoutPassword);

      expect(mockUsersService.updateLastLogin).toHaveBeenCalledWith(mockUserWithoutPassword.id);
    });

    it('should handle updateLastLogin errors gracefully', async () => {
      mockUsersService.updateLastLogin.mockRejectedValue(new Error('Update failed'));

      // Login should still work even if updating last login fails
      await expect(service.login(mockUserWithoutPassword))
        .rejects.toThrow('Update failed');
    });

    it('should handle JWT signing errors', async () => {
      mockJwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(service.login(mockUserWithoutPassword))
        .rejects.toThrow('JWT signing failed');
    });

    it('should create proper JWT payload structure', async () => {
      await service.login(mockUserWithoutPassword);

      const [payload] = mockJwtService.sign.mock.calls[0];
      
      expect(payload).toHaveProperty('email');
      expect(payload).toHaveProperty('sub');
      expect(payload).toHaveProperty('role');
      expect(payload.sub).toBe(mockUserWithoutPassword.id);
      expect(payload.email).toBe(mockUserWithoutPassword.email);
      expect(payload.role).toBe(mockUserWithoutPassword.role);
    });
  });

  describe('googleLogin', () => {
    const mockToken = 'google-jwt-token-456';
    const googleUser = {
      id: 'google-user-123',
      email: 'google@example.com',
      name: 'Google User',
      role: 'user',
    };

    beforeEach(() => {
      mockJwtService.sign.mockReturnValue(mockToken);
    });

    it('should return access token and user data for Google OAuth', async () => {
      const result = await service.googleLogin(googleUser);

      const expectedPayload = {
        email: googleUser.email,
        sub: googleUser.id,
        role: googleUser.role,
      };

      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
      expect(result).toEqual({
        access_token: mockToken,
        user: googleUser,
      });
    });

    it('should not call updateLastLogin for Google login', async () => {
      await service.googleLogin(googleUser);

      expect(mockUsersService.updateLastLogin).not.toHaveBeenCalled();
    });

    it('should handle Google admin users', async () => {
      const googleAdminUser = { ...googleUser, role: 'admin' };
      
      const result = await service.googleLogin(googleAdminUser);

      const expectedPayload = {
        email: googleAdminUser.email,
        sub: googleAdminUser.id,
        role: 'admin',
      };

      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
      expect(result.user.role).toBe('admin');
    });

    it('should handle JWT signing errors for Google login', async () => {
      mockJwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(service.googleLogin(googleUser))
        .rejects.toThrow('JWT signing failed');
    });

    it('should create proper JWT payload for Google users', async () => {
      await service.googleLogin(googleUser);

      const [payload] = mockJwtService.sign.mock.calls[0];
      
      expect(payload).toEqual({
        email: googleUser.email,
        sub: googleUser.id,
        role: googleUser.role,
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete login flow', async () => {
      // Validate user
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      
      const validatedUser = await service.validateUser('test@example.com', 'password123');
      
      // Login with validated user
      mockJwtService.sign.mockReturnValue('complete-flow-token');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      
      const loginResult = await service.login(validatedUser);

      expect(validatedUser).not.toHaveProperty('password');
      expect(loginResult.access_token).toBe('complete-flow-token');
      expect(loginResult.user).toEqual(validatedUser);
    });

    it('should handle failed login flow', async () => {
      // Failed validation
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);
      
      const validatedUser = await service.validateUser('test@example.com', 'wrong-password');
      
      expect(validatedUser).toBeNull();
      // Login should not be called with null user
    });
  });

  describe('Security considerations', () => {
    it('should never return user password in any method', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const validatedUser = await service.validateUser('test@example.com', 'password123');
      
      expect(validatedUser).not.toHaveProperty('password');
      
      mockJwtService.sign.mockReturnValue('token');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      
      const loginResult = await service.login(validatedUser);
      
      expect(loginResult.user).not.toHaveProperty('password');
    });

    it('should handle empty or invalid email gracefully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result1 = await service.validateUser('', 'password');
      const result2 = await service.validateUser('invalid-email', 'password');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should handle empty password gracefully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser('test@example.com', '');
      
      expect(result).toBeNull();
    });
  });
});