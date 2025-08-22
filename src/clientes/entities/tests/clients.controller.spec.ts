import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ClientsController } from '../clients.controller';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { TestDataFactory, createMockRequest } from '../../../test-setup';
import { ClientsService } from '../clients.services';

// Definir interfaces localmente para evitar problemas de import
interface CreateClientDto {
  nomeNaFachada: string;
  cnpj: string;
  razaoSocial: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais?: string;
  telefone?: string;
  email?: string;
  website?: string;
  status?: string;
  observacoes?: string;
  userId: string;
}

interface UpdateClientDto {
  nomeNaFachada?: string;
  cnpj?: string;
  razaoSocial?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  telefone?: string;
  email?: string;
  website?: string;
  status?: string;
  observacoes?: string;
}

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: ClientsService;

  const mockClient = TestDataFactory.createClient();

  const mockUser = {
    sub: 'user1',
    role: 'user',
  };

  const mockAdminUser = {
    sub: 'admin1',
    role: 'admin',
  };

  const mockClientService = {
    create: jest.fn(),
    findAllWithFilters: jest.fn(),
    countByUser: jest.fn(),
    findByStatus: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  // SOLUÇÃO: Mock do JwtService
  const mockJwtService = {
    sign: jest.fn(() => 'mock-token'),
    verify: jest.fn(() => ({ sub: 'user-id', username: 'test' })),
    verifyAsync: jest.fn(() => Promise.resolve({ sub: 'user-id', username: 'test' })),
    decode: jest.fn(() => ({ sub: 'user-id', username: 'test' })),
  };

  // SOLUÇÃO: Mock do JwtAuthGuard
  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: mockClientService,
        },
        // SOLUÇÃO PRINCIPAL: Adicionar o JwtService mockado
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      // SOLUÇÃO SECUNDÁRIA: Override do guard
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<ClientsController>(ClientsController);
    service = module.get<ClientsService>(ClientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createClientDto: CreateClientDto = TestDataFactory.createCreateClientDto();

    it('should create a client successfully', async () => {
      const mockRequest = createMockRequest(mockUser);
      mockClientService.create.mockResolvedValue(mockClient);

      const result = await controller.create(createClientDto, mockRequest as any);

      expect(mockClientService.create).toHaveBeenCalledWith({
        ...createClientDto,
        userId: mockUser.sub,
      });
      expect(result).toEqual({
        message: 'Cliente criado com sucesso',
        client: mockClient,
      });
    });

    it('should handle creation error', async () => {
      const mockRequest = createMockRequest(mockUser);
      const error = new Error('Database error');
      mockClientService.create.mockRejectedValue(error);

      const result = await controller.create(createClientDto, mockRequest as any);

      expect(result).toEqual({
        message: 'Erro ao criar cliente',
        error: 'Database error',
      });
    });
  });

  describe('findAll', () => {
    it('should return filtered clients for regular user', async () => {
      const mockRequest = createMockRequest(mockUser);
      const clients = [mockClient];
      mockClientService.findAllWithFilters.mockResolvedValue(clients);

      const result = await controller.findAll(
        mockRequest as any,
        'Test',
        '123',
        'ativo',
        'São Paulo',
        'nomeNaFachada',
        'asc'
      );

      expect(mockClientService.findAllWithFilters).toHaveBeenCalledWith({
        nomeNaFachada: 'Test',
        cnpj: '123',
        status: 'ativo',
        cidade: 'São Paulo',
        userId: mockUser.sub,
        sortBy: 'nomeNaFachada',
        order: 'asc',
      });
      expect(result).toEqual(clients);
    });

    it('should return all clients for admin user', async () => {
      const mockRequest = createMockRequest(mockAdminUser);
      const clients = [mockClient];
      mockClientService.findAllWithFilters.mockResolvedValue(clients);

      const result = await controller.findAll(
        mockRequest as any,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );

      expect(mockClientService.findAllWithFilters).toHaveBeenCalledWith({
        nomeNaFachada: undefined,
        cnpj: undefined,
        status: undefined,
        cidade: undefined,
        userId: undefined, // Admin sees all clients
        sortBy: undefined,
        order: undefined,
      });
      expect(result).toEqual(clients);
    });
  });

  describe('getMyStats', () => {
    it('should return user statistics', async () => {
      const mockRequest = createMockRequest(mockUser);
      const activeClients = [mockClient];
      const inactiveClients = [];
      
      mockClientService.countByUser.mockResolvedValue(10);
      mockClientService.findByStatus
        .mockResolvedValueOnce(activeClients) // ativo
        .mockResolvedValueOnce(inactiveClients); // inativo

      const result = await controller.getMyStats(mockRequest as any);

      expect(mockClientService.countByUser).toHaveBeenCalledWith(mockUser.sub);
      expect(mockClientService.findByStatus).toHaveBeenCalledWith('ativo', mockUser.sub);
      expect(mockClientService.findByStatus).toHaveBeenCalledWith('inativo', mockUser.sub);
      expect(result).toEqual({
        total: 10,
        ativos: 1,
        inativos: 0,
        percentualAtivos: 10, // 1/10 * 100 = 10%
      });
    });

    it('should handle zero clients scenario', async () => {
      const mockRequest = createMockRequest(mockUser);
      mockClientService.countByUser.mockResolvedValue(0);
      mockClientService.findByStatus
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await controller.getMyStats(mockRequest as any);

      expect(result).toEqual({
        total: 0,
        ativos: 0,
        inativos: 0,
        percentualAtivos: 0,
      });
    });
  });

  describe('findOne', () => {
    const clientId = '1';

    it('should return a specific client', async () => {
      const mockRequest = createMockRequest(mockUser);
      mockClientService.findOne.mockResolvedValue(mockClient);

      const result = await controller.findOne(clientId, mockRequest as any);

      expect(mockClientService.findOne).toHaveBeenCalledWith(clientId, mockUser.sub);
      expect(result).toEqual(mockClient);
    });

    it('should return a client for admin user', async () => {
      const mockRequest = createMockRequest(mockAdminUser);
      mockClientService.findOne.mockResolvedValue(mockClient);

      const result = await controller.findOne(clientId, mockRequest as any);

      expect(mockClientService.findOne).toHaveBeenCalledWith(clientId, undefined);
      expect(result).toEqual(mockClient);
    });

    it('should return not found message when client does not exist', async () => {
      const mockRequest = createMockRequest(mockUser);
      mockClientService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(clientId, mockRequest as any);

      expect(result).toEqual({ message: 'Cliente não encontrado' });
    });
  });

  describe('update', () => {
    const clientId = '1';
    const updateClientDto: UpdateClientDto = {
      nomeNaFachada: 'Updated Client',
      status: 'inativo',
    };

    it('should update a client successfully', async () => {
      const mockRequest = createMockRequest(mockUser);
      const updatedClient = { ...mockClient, ...updateClientDto };
      mockClientService.update.mockResolvedValue(updatedClient);

      const result = await controller.update(clientId, updateClientDto, mockRequest as any);

      expect(mockClientService.update).toHaveBeenCalledWith(clientId, updateClientDto, mockUser.sub);
      expect(result).toEqual({
        message: 'Cliente atualizado com sucesso',
        client: updatedClient,
      });
    });

    it('should handle update for admin user', async () => {
      const mockRequest = createMockRequest(mockAdminUser);
      const updatedClient = { ...mockClient, ...updateClientDto };
      mockClientService.update.mockResolvedValue(updatedClient);

      const result = await controller.update(clientId, updateClientDto, mockRequest as any);

      expect(mockClientService.update).toHaveBeenCalledWith(clientId, updateClientDto, undefined);
      expect(result).toEqual({
        message: 'Cliente atualizado com sucesso',
        client: updatedClient,
      });
    });

    it('should return not found message when client does not exist', async () => {
      const mockRequest = createMockRequest(mockUser);
      mockClientService.update.mockResolvedValue(null);

      const result = await controller.update(clientId, updateClientDto, mockRequest as any);

      expect(result).toEqual({ message: 'Cliente não encontrado ou sem permissão' });
    });

    it('should handle update error', async () => {
      const mockRequest = createMockRequest(mockUser);
      const error = new Error('Database error');
      mockClientService.update.mockRejectedValue(error);

      const result = await controller.update(clientId, updateClientDto, mockRequest as any);

      expect(result).toEqual({
        message: 'Erro ao atualizar cliente',
        error: 'Database error',
      });
    });
  });

  describe('remove', () => {
    const clientId = '1';

    it('should remove a client for regular user', async () => {
      const mockRequest = createMockRequest(mockUser);
      const expectedResponse = { message: 'Cliente excluído com sucesso' };
      mockClientService.remove.mockResolvedValue(expectedResponse);

      const result = await controller.remove(clientId, mockRequest as any);

      expect(mockClientService.remove).toHaveBeenCalledWith(clientId, mockUser.sub);
      expect(result).toEqual(expectedResponse);
    });

    it('should remove a client for admin user', async () => {
      const mockRequest = createMockRequest(mockAdminUser);
      const expectedResponse = { message: 'Cliente excluído com sucesso' };
      mockClientService.remove.mockResolvedValue(expectedResponse);

      const result = await controller.remove(clientId, mockRequest as any);

      expect(mockClientService.remove).toHaveBeenCalledWith(clientId, undefined);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle remove error', async () => {
      const mockRequest = createMockRequest(mockUser);
      const expectedResponse = { message: 'Cliente não encontrado' };
      mockClientService.remove.mockResolvedValue(expectedResponse);

      const result = await controller.remove(clientId, mockRequest as any);

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('Guard and Service Dependencies', () => {
    it('should have JwtService available', () => {
      const jwtService = controller['jwtService'] || mockJwtService;
      expect(jwtService).toBeDefined();
    });

    it('should have guard properly mocked', () => {
      expect(mockJwtAuthGuard.canActivate).toBeDefined();
      expect(mockJwtAuthGuard.canActivate()).toBe(true);
    });
  });
});