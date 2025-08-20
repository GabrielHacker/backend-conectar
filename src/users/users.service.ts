import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThan } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
      provider: 'local',
    });

    return this.usersRepository.save(user);
  }

  async createFromGoogle(userData: {
    email: string;
    name: string;
    googleId: string;
    photo?: string;
    role?: UserRole;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: userData.email,
      name: userData.name,
      googleId: userData.googleId,
      photo: userData.photo,
      role: userData.role || UserRole.USER,
      provider: 'google',
      password: undefined, // Usuários do Google não têm senha local
    });

    return this.usersRepository.save(user);
  }

  async updateGoogleInfo(userId: string, googleData: {
    googleId: string;
    photo?: string;
  }): Promise<void> {
    await this.usersRepository.update(userId, {
      ...googleData,
      provider: 'google',
    });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findAllWithFilters(filters: {
    name?: string;
    email?: string;
    role?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<User[]> {
    const query = this.usersRepository.createQueryBuilder('user');

    if (filters.name) {
      query.andWhere('user.name LIKE :name', { name: `%${filters.name}%` });
    }

    if (filters.email) {
      query.andWhere('user.email LIKE :email', { email: `%${filters.email}%` });
    }

    if (filters.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters.sortBy) {
      const order = filters.order || 'asc';
      query.orderBy(`user.${filters.sortBy}`, order.toUpperCase() as 'ASC' | 'DESC');
    } else {
      query.orderBy('user.createdAt', 'DESC');
    }

    return query.getMany();
  }

  async findInactiveUsers(): Promise<User[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.usersRepository
      .createQueryBuilder('user')
      .where(
        '(user.lastLogin IS NULL AND user.createdAt < :thirtyDaysAgo) OR (user.lastLogin < :thirtyDaysAgo)',
        { thirtyDaysAgo }
      )
      .orderBy('user.createdAt', 'ASC')
      .getMany();
  }

  async countUsers(): Promise<number> {
    return this.usersRepository.count();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async update(id: string, updateData: {
    name?: string;
    email?: string;
    role?: UserRole;
  }): Promise<User | null> {
    await this.usersRepository.update(id, updateData);
    return this.findById(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.usersRepository.delete(id);
    if (result.affected && result.affected > 0) {
      return { message: 'Usuário excluído com sucesso' };
    }
    return { message: 'Usuário não encontrado' };
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { lastLogin: new Date() });
  }
}