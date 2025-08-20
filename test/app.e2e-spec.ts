import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../src/users/entities/user.entity';
import { UsersModule } from '../src/users/users.module';
import { AuthModule } from '../src/auth/auth.module';

describe('App E2E Tests', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Banco em memória para testes
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
          dropSchema: true,
        }),
        JwtModule.register({
          global: true,
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        UsersModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors({
      origin: ['http://localhost:3001'],
      credentials: true,
    });
    
    await app.init();

    // Criar usuários de teste
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Admin Test',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
      });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'User Test',
        email: 'user@test.com',
        password: 'password123',
        role: 'user',
      });

    // Fazer login e obter tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@test.com',
        password: 'password123',
      });

    adminToken = adminLogin.body.access_token;
    userToken = userLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Endpoints', () => {
    describe('POST /auth/register', () => {
      it('should register a new user', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'New User',
            email: 'newuser@test.com',
            password: 'password123',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.message).toBe('User created successfully');
            expect(res.body.user).toHaveProperty('id');
            expect(res.body.user.email).toBe('newuser@test.com');
          });
      });
    });

    describe('POST /auth/login', () => {
      it('should login with valid credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'admin@test.com',
            password: 'password123',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('access_token');
            expect(res.body.user.email).toBe('admin@test.com');
          });
      });

      it('should not login with invalid credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'admin@test.com',
            password: 'wrongpassword',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.message).toBe('Invalid credentials');
          });
      });
    });
  });

  describe('Basic Tests', () => {
    it('should seed test users', () => {
      return request(app.getHttpServer())
        .post('/auth/seed')
        .expect(201);
    });
  });
});