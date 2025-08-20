import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';

export interface CreateClientDto {
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

export interface UpdateClientDto {
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

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clientsRepository.create(createClientDto);
    return this.clientsRepository.save(client);
  }

  async findAll(userId?: string): Promise<Client[]> {
    const query = this.clientsRepository.createQueryBuilder('client')
      .leftJoinAndSelect('client.user', 'user');

    if (userId) {
      query.where('client.userId = :userId', { userId });
    }

    return query.orderBy('client.createdAt', 'DESC').getMany();
  }

  async findAllWithFilters(filters: {
    nomeNaFachada?: string;
    cnpj?: string;
    status?: string;
    cidade?: string;
    userId?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<Client[]> {
    const query = this.clientsRepository.createQueryBuilder('client')
      .leftJoinAndSelect('client.user', 'user');

    if (filters.userId) {
      query.where('client.userId = :userId', { userId: filters.userId });
    }

    if (filters.nomeNaFachada) {
      query.andWhere('client.nomeNaFachada LIKE :nome', { nome: `%${filters.nomeNaFachada}%` });
    }

    if (filters.cnpj) {
      query.andWhere('client.cnpj LIKE :cnpj', { cnpj: `%${filters.cnpj}%` });
    }

    if (filters.status) {
      query.andWhere('client.status = :status', { status: filters.status });
    }

    if (filters.cidade) {
      query.andWhere('client.cidade LIKE :cidade', { cidade: `%${filters.cidade}%` });
    }

    if (filters.sortBy) {
      const order = filters.order || 'asc';
      query.orderBy(`client.${filters.sortBy}`, order.toUpperCase() as 'ASC' | 'DESC');
    } else {
      query.orderBy('client.createdAt', 'DESC');
    }

    return query.getMany();
  }

  async findOne(id: string, userId?: string): Promise<Client | null> {
    const query = this.clientsRepository.createQueryBuilder('client')
      .leftJoinAndSelect('client.user', 'user')
      .where('client.id = :id', { id });

    if (userId) {
      query.andWhere('client.userId = :userId', { userId });
    }

    return query.getOne();
  }

  async update(id: string, updateClientDto: UpdateClientDto, userId?: string): Promise<Client | null> {
    const client = await this.findOne(id, userId);
    
    if (!client) {
      return null;
    }

    await this.clientsRepository.update(id, updateClientDto);
    return this.findOne(id);
  }

  async remove(id: string, userId?: string): Promise<{ message: string }> {
    const client = await this.findOne(id, userId);
    
    if (!client) {
      return { message: 'Cliente não encontrado' };
    }

    const result = await this.clientsRepository.delete(id);
    
    if (result.affected && result.affected > 0) {
      return { message: 'Cliente excluído com sucesso' };
    }
    
    return { message: 'Erro ao excluir cliente' };
  }

  async countByUser(userId: string): Promise<number> {
    return this.clientsRepository.count({ where: { userId } });
  }

  async findByStatus(status: string, userId?: string): Promise<Client[]> {
    const query = this.clientsRepository.createQueryBuilder('client')
      .where('client.status = :status', { status });

    if (userId) {
      query.andWhere('client.userId = :userId', { userId });
    }

    return query.getMany();
  }
}