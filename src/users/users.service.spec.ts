import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';

// Mock bcrypt inteiro
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const bcrypt = require('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
      };

      const expectedUser = {
        id: '1',
        ...userData,
        password: 'hashedPassword',
        provider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(expectedUser);
      mockRepository.save.mockResolvedValue(expectedUser);

      // Mock bcrypt.hash
      bcrypt.hash.mockResolvedValue('hashedPassword');

      const result = await service.create(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: 'hashedPassword',
        provider: 'local',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedUser);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('createFromGoogle', () => {
    it('should create user from Google data', async () => {
      const googleData = {
        email: 'google@example.com',
        name: 'Google User',
        googleId: 'google123',
        photo: 'https://photo.url',
      };

      const expectedUser = {
        id: '2',
        email: googleData.email,
        name: googleData.name,
        googleId: googleData.googleId,
        photo: googleData.photo,
        role: UserRole.USER,
        provider: 'google',
        password: undefined,
      };

      mockRepository.create.mockReturnValue(expectedUser);
      mockRepository.save.mockResolvedValue(expectedUser);

      const result = await service.createFromGoogle(googleData);

      expect(mockRepository.create).toHaveBeenCalledWith({
        email: googleData.email,
        name: googleData.name,
        googleId: googleData.googleId,
        photo: googleData.photo,
        role: UserRole.USER,
        provider: 'google',
        password: undefined,
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      const expectedUser = { id: '1', email, name: 'Test User' };

      mockRepository.findOne.mockResolvedValue(expectedUser);

      const result = await service.findByEmail(email);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(expectedUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('countUsers', () => {
    it('should return total count of users', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.countUsers();

      expect(mockRepository.count).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual({ message: 'Usuário excluído com sucesso' });
    });

    it('should return not found message when user does not exist', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.remove('999');

      expect(result).toEqual({ message: 'Usuário não encontrado' });
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const userId = '1';
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateLastLogin(userId);

      expect(mockRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          lastLogin: expect.any(Date),
        }),
      );
    });
  });
});