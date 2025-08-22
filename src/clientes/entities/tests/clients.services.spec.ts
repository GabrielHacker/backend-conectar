import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ClientsService, CreateClientDto, UpdateClientDto } from '../clients.services';
import { Client } from '../client.entity';

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: Repository<Client>;
  let queryBuilder: SelectQueryBuilder<Client>;

  const mockClient: Client = {
    id: '1',
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
    userId: 'user1',
    user: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getRepositoryToken(Client),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    repository = module.get<Repository<Client>>(getRepositoryToken(Client));
    queryBuilder = mockRepository.createQueryBuilder();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a client', async () => {
      const createClientDto: CreateClientDto = {
        nomeNaFachada: 'Test Client',
        cnpj: '12345678000195',
        razaoSocial: 'Test Client Ltda',
        cep: '01234567',
        rua: 'Rua Teste',
        numero: '123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        userId: 'user1',
      };

      mockRepository.create.mockReturnValue(mockClient);
      mockRepository.save.mockResolvedValue(mockClient);

      const result = await service.create(createClientDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createClientDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockClient);
      expect(result).toEqual(mockClient);
    });
  });

  describe('findAll', () => {
    it('should return all clients without userId filter', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockClient]);

      const result = await service.findAll();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('client');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('client.user', 'user');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('client.createdAt', 'DESC');
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual([mockClient]);
    });

    it('should return clients filtered by userId', async () => {
      const userId = 'user1';
      mockQueryBuilder.getMany.mockResolvedValue([mockClient]);

      const result = await service.findAll(userId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('client.userId = :userId', { userId });
      expect(result).toEqual([mockClient]);
    });
  });

  describe('findAllWithFilters', () => {
    const baseFilters = {
      userId: 'user1',
      nomeNaFachada: 'Test',
      cnpj: '123',
      status: 'ativo',
      cidade: 'São Paulo',
      sortBy: 'nomeNaFachada',
      order: 'asc' as const,
    };

    it('should apply all filters correctly', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockClient]);

      const result = await service.findAllWithFilters(baseFilters);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('client.userId = :userId', { userId: 'user1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('client.nomeNaFachada LIKE :nome', { nome: '%Test%' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('client.cnpj LIKE :cnpj', { cnpj: '%123%' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('client.status = :status', { status: 'ativo' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('client.cidade LIKE :cidade', { cidade: '%São Paulo%' });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('client.nomeNaFachada', 'ASC');
      expect(result).toEqual([mockClient]);
    });

    it('should use default order when sortBy is provided but order is not', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockClient]);
      const filters = { ...baseFilters, order: undefined };

      await service.findAllWithFilters(filters);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('client.nomeNaFachada', 'ASC');
    });

    it('should use default sorting when no sortBy is provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockClient]);
      const filters = { userId: 'user1' };

      await service.findAllWithFilters(filters);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('client.createdAt', 'DESC');
    });

    it('should work with empty filters', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockClient]);

      const result = await service.findAllWithFilters({});

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('client.createdAt', 'DESC');
      expect(result).toEqual([mockClient]);
    });
  });

  describe('findOne', () => {
    const clientId = '1';

    it('should find a client by id without userId filter', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockClient);

      const result = await service.findOne(clientId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('client.id = :id', { id: clientId });
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual(mockClient);
    });

    it('should find a client by id with userId filter', async () => {
      const userId = 'user1';
      mockQueryBuilder.getOne.mockResolvedValue(mockClient);

      const result = await service.findOne(clientId, userId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('client.id = :id', { id: clientId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('client.userId = :userId', { userId });
      expect(result).toEqual(mockClient);
    });

    it('should return null when client is not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await service.findOne(clientId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const clientId = '1';
    const updateClientDto: UpdateClientDto = {
      nomeNaFachada: 'Updated Client',
      status: 'inativo',
    };

    it('should update a client successfully', async () => {
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockClient) // First call to check if client exists
        .mockResolvedValueOnce({ ...mockClient, ...updateClientDto }); // Second call to return updated client

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(clientId, updateClientDto);

      expect(service.findOne).toHaveBeenCalledTimes(2);
      expect(service.findOne).toHaveBeenNthCalledWith(1, clientId, undefined);
      expect(service.findOne).toHaveBeenNthCalledWith(2, clientId);
      expect(mockRepository.update).toHaveBeenCalledWith(clientId, updateClientDto);
      expect(result).toEqual({ ...mockClient, ...updateClientDto });
    });

    it('should update a client with userId filter', async () => {
      const userId = 'user1';
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce({ ...mockClient, ...updateClientDto });

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(clientId, updateClientDto, userId);

      expect(service.findOne).toHaveBeenNthCalledWith(1, clientId, userId);
      expect(result).toEqual({ ...mockClient, ...updateClientDto });
    });

    it('should return null when client is not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      const result = await service.update(clientId, updateClientDto);

      expect(result).toBeNull();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const clientId = '1';

    it('should remove a client successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockClient);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(clientId);

      expect(service.findOne).toHaveBeenCalledWith(clientId, undefined);
      expect(mockRepository.delete).toHaveBeenCalledWith(clientId);
      expect(result).toEqual({ message: 'Cliente excluído com sucesso' });
    });

    it('should remove a client with userId filter', async () => {
      const userId = 'user1';
      jest.spyOn(service, 'findOne').mockResolvedValue(mockClient);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(clientId, userId);

      expect(service.findOne).toHaveBeenCalledWith(clientId, userId);
      expect(result).toEqual({ message: 'Cliente excluído com sucesso' });
    });

    it('should return error message when client is not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      const result = await service.remove(clientId);

      expect(result).toEqual({ message: 'Cliente não encontrado' });
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should return error message when deletion fails', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockClient);
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.remove(clientId);

      expect(result).toEqual({ message: 'Erro ao excluir cliente' });
    });
  });

  describe('countByUser', () => {
    it('should return count of clients by user', async () => {
      const userId = 'user1';
      const expectedCount = 5;
      mockRepository.count.mockResolvedValue(expectedCount);

      const result = await service.countByUser(userId);

      expect(mockRepository.count).toHaveBeenCalledWith({ where: { userId } });
      expect(result).toBe(expectedCount);
    });
  });

  describe('findByStatus', () => {
    it('should find clients by status without userId filter', async () => {
      const status = 'ativo';
      mockQueryBuilder.getMany.mockResolvedValue([mockClient]);

      const result = await service.findByStatus(status);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('client.status = :status', { status });
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual([mockClient]);
    });

    it('should find clients by status with userId filter', async () => {
      const status = 'ativo';
      const userId = 'user1';
      mockQueryBuilder.getMany.mockResolvedValue([mockClient]);

      const result = await service.findByStatus(status, userId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('client.status = :status', { status });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('client.userId = :userId', { userId });
      expect(result).toEqual([mockClient]);
    });
  });
});