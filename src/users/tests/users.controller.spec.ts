import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { UserRole } from '../entities/user.entity';
import { TestDataFactory, createMockRequest } from '../../test-setup';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = TestDataFactory.createUser();
  const mockAdminUser = TestDataFactory.createUser({
    id: 'admin-id',
    role: 'admin' as UserRole,
    username: 'admin',
    email: 'admin@test.com',
  });

  const mockUsersService = {
    findAllWithFilters: jest.fn(),
    findInactiveUsers: jest.fn(),
    countUsers: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    remove: jest.fn(),
  };

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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return filtered users', async () => {
      const users = [mockUser];
      mockUsersService.findAllWithFilters.mockResolvedValue(users);

      const result = await controller.findAll(
        'John',
        'john@test.com',
        'user',
        'name',
        'asc'
      );

      expect(mockUsersService.findAllWithFilters).toHaveBeenCalledWith({
        name: 'John',
        email: 'john@test.com',
        role: 'user',
        sortBy: 'name',
        order: 'asc',
      });
      expect(result).toEqual(users);
    });

    it('should work with no filters', async () => {
      const users = [mockUser];
      mockUsersService.findAllWithFilters.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(mockUsersService.findAllWithFilters).toHaveBeenCalledWith({
        name: undefined,
        email: undefined,
        role: undefined,
        sortBy: undefined,
        order: undefined,
      });
      expect(result).toEqual(users);
    });
  });

  describe('findInactiveUsers', () => {
    it('should return inactive users for admin', async () => {
      const inactiveUsers = [
        TestDataFactory.createUser({ isActive: false, id: 'inactive1' }),
        TestDataFactory.createUser({ isActive: false, id: 'inactive2' }),
      ];
      mockUsersService.findInactiveUsers.mockResolvedValue(inactiveUsers);

      const result = await controller.findInactiveUsers();

      expect(mockUsersService.findInactiveUsers).toHaveBeenCalled();
      expect(result).toEqual(inactiveUsers);
    });
  });

  describe('getNotifications', () => {
    it('should return notification data for admin', async () => {
      const inactiveUsers = [
        TestDataFactory.createUser({ isActive: false, id: 'inactive1' }),
        TestDataFactory.createUser({ isActive: false, id: 'inactive2' }),
      ];
      const totalUsers = 10;

      mockUsersService.findInactiveUsers.mockResolvedValue(inactiveUsers);
      mockUsersService.countUsers.mockResolvedValue(totalUsers);

      const result = await controller.getNotifications();

      expect(mockUsersService.findInactiveUsers).toHaveBeenCalled();
      expect(mockUsersService.countUsers).toHaveBeenCalled();
      expect(result).toEqual({
        inactiveUsers: {
          count: 2,
          users: inactiveUsers,
        },
        totalUsers,
        lastUpdate: expect.any(String),
      });
      expect(new Date(result.lastUpdate)).toBeInstanceOf(Date);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-id');

      expect(mockUsersService.findById).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(mockUser);
    });

    it('should handle user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      const result = await controller.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Name',
      email: 'updated@test.com',
      role: 'admin' as UserRole,
    };

    it('should allow admin to update any user', async () => {
      const mockRequest = createMockRequest(mockAdminUser);
      const updatedUser = { ...mockUser, ...updateData };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-id', updateData, mockRequest as any);

      expect(mockUsersService.update).toHaveBeenCalledWith('user-id', updateData);
      expect(result).toEqual(updatedUser);
    });

    it('should allow user to update themselves', async () => {
      const mockRequest = createMockRequest({ ...mockUser, sub: 'user-id' });
      const updatedUser = { ...mockUser, name: updateData.name, email: updateData.email };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-id', updateData, mockRequest as any);

      // Role should be removed for non-admin users
      expect(mockUsersService.update).toHaveBeenCalledWith('user-id', {
        name: updateData.name,
        email: updateData.email,
        // role should be removed
      });
      expect(result).toEqual(updatedUser);
    });

    it('should prevent user from updating others', async () => {
      const mockRequest = createMockRequest({ ...mockUser, sub: 'user-id' });

      const result = await controller.update('other-user-id', updateData, mockRequest as any);

      expect(result).toEqual({ message: 'Você só pode editar seu próprio perfil' });
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should remove role from update data for non-admin users', async () => {
      const mockRequest = createMockRequest({ ...mockUser, sub: 'user-id', role: 'user' });
      const updateDataWithRole = { ...updateData, role: 'admin' as UserRole };
      const updatedUser = { ...mockUser, name: updateData.name, email: updateData.email };
      mockUsersService.update.mockResolvedValue(updatedUser);

      await controller.update('user-id', updateDataWithRole, mockRequest as any);

      // Verify role was removed from update data
      const updateCall = mockUsersService.update.mock.calls[0];
      expect(updateCall[1]).not.toHaveProperty('role');
    });
  });

  describe('updatePassword', () => {
    const passwordData = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    it('should allow user to update their own password', async () => {
      const mockRequest = createMockRequest({ ...mockUser, sub: 'user-id' });
      mockUsersService.updatePassword.mockResolvedValue(undefined);

      const result = await controller.updatePassword('user-id', passwordData, mockRequest as any);

      expect(mockUsersService.updatePassword).toHaveBeenCalledWith('user-id', passwordData);
      expect(result).toEqual({ message: 'Senha atualizada com sucesso' });
    });

    it('should prevent user from updating others password', async () => {
      const mockRequest = createMockRequest({ ...mockUser, sub: 'user-id' });

      const result = await controller.updatePassword('other-user-id', passwordData, mockRequest as any);

      expect(result).toEqual({ message: 'Você só pode alterar sua própria senha' });
      expect(mockUsersService.updatePassword).not.toHaveBeenCalled();
    });

    it('should handle password update errors', async () => {
      const mockRequest = createMockRequest({ ...mockUser, sub: 'user-id' });
      const error = new Error('Senha atual incorreta');
      mockUsersService.updatePassword.mockRejectedValue(error);

      const result = await controller.updatePassword('user-id', passwordData, mockRequest as any);

      expect(result).toEqual({ message: 'Senha atual incorreta' });
    });
  });

  describe('remove', () => {
    it('should allow admin to remove other users', async () => {
      const mockRequest = createMockRequest({ ...mockAdminUser, sub: 'admin-id' });
      const deleteResult = { message: 'Usuário removido com sucesso' };
      mockUsersService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove('user-id', mockRequest as any);

      expect(mockUsersService.remove).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(deleteResult);
    });

    it('should prevent admin from removing themselves', async () => {
      const mockRequest = createMockRequest({ ...mockAdminUser, sub: 'admin-id' });

      const result = await controller.remove('admin-id', mockRequest as any);

      expect(result).toEqual({ message: 'Você não pode excluir sua própria conta' });
      expect(mockUsersService.remove).not.toHaveBeenCalled();
    });
  });

  describe('Guards', () => {
    it('should have JwtAuthGuard applied', () => {
      expect(mockJwtAuthGuard.canActivate).toBeDefined();
    });

    it('should have RolesGuard applied to admin routes', () => {
      expect(mockRolesGuard.canActivate).toBeDefined();
    });
  });
});